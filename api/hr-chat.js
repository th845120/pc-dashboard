// Vercel Serverless Function: /api/hr-chat
// 員工人資 AI 問答：抓 Notion 規章頁面 + 呼叫 OpenRouter (Claude Sonnet 4) 或 OpenAI
//
// 環境變數（必須在 Vercel 後台設定）：
//   OPENROUTER_API_KEY   OpenRouter API key（優先使用；走 Claude Sonnet 4）
//   OPENROUTER_MODEL     （選配）OpenRouter 模型，預設 anthropic/claude-sonnet-4
//   OPENAI_API_KEY       OpenAI API key（fallback，若沒設 OPENROUTER_API_KEY 時使用）
//   NOTION_TOKEN         Notion integration token（需 share 規章頁面給 integration）
//   NOTION_HR_PAGE_ID    Notion 規章頁面 ID（含或不含 dash 皆可）
//   HR_ALLOWED_ORIGIN    （選配）CORS 允許的 origin，預設 https://preciouscrystal.com.tw

const NOTION_VERSION = '2022-06-28';
const OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-sonnet-4';
const MAX_QUESTION_LEN = 500;
const MAX_RULES_CHARS = 30000; // 限制 system prompt 長度，避免費用爆炸
const MAX_DB_ROWS = 60;         // 單一子資料庫最多抓幾筆
const MAX_NEST_DEPTH = 3;       // 子 block 遞迴最大深度

// 簡單的記憶體快取（同一個 serverless 容器共用）
let rulesCache = null;
let rulesCacheAt = 0;
const RULES_TTL_MS = 10 * 60 * 1000; // 10 分鐘
const CACHE_VERSION = 'v4-props'; // 更動版本即可作廢快取

function setCors(req, res) {
  const allow = process.env.HR_ALLOWED_ORIGIN || 'https://preciouscrystal.com.tw';
  const origin = req.headers.origin || '';
  // 允許本站、preview、localhost（開發用）
  const ok =
    origin === allow ||
    /^https:\/\/.*\.vercel\.app$/.test(origin) ||
    /^http:\/\/localhost(:\d+)?$/.test(origin);
  res.setHeader('Access-Control-Allow-Origin', ok ? origin : allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizePageId(raw) {
  if (!raw) return '';
  const s = String(raw).replace(/-/g, '').trim();
  if (s.length !== 32) return raw; // 回傳原樣讓 Notion 錯誤訊息帶資訊
  return (
    s.slice(0, 8) + '-' +
    s.slice(8, 12) + '-' +
    s.slice(12, 16) + '-' +
    s.slice(16, 20) + '-' +
    s.slice(20)
  );
}

async function notionFetch(url, token) {
  const r = await fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Notion-Version': NOTION_VERSION,
    },
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error('Notion API ' + r.status + ': ' + text.slice(0, 400));
  }
  return r.json();
}

function extractRichText(rt) {
  if (!Array.isArray(rt)) return '';
  return rt.map(t => (t && t.plain_text) ? t.plain_text : '').join('');
}

function blockToText(block, indent) {
  const pad = '  '.repeat(indent || 0);
  const type = block.type;
  const data = block[type];
  if (!data) return '';

  // table_row ：cells 是二維陣列 rich_text
  if (type === 'table_row') {
    const cells = (data.cells || []).map(cellRt => extractRichText(cellRt).replace(/\s+/g, ' ').trim());
    // 過濾全空列
    if (cells.every(c => !c)) return '';
    return pad + '| ' + cells.join(' | ') + ' |';
  }
  // table：本身沒有 text，內容全在 children (table_row)
  if (type === 'table') return '';

  const rt = data.rich_text;
  const text = extractRichText(rt);
  switch (type) {
    case 'heading_1': return '\n' + pad + '# ' + text;
    case 'heading_2': return '\n' + pad + '## ' + text;
    case 'heading_3': return '\n' + pad + '### ' + text;
    case 'bulleted_list_item': return pad + '- ' + text;
    case 'numbered_list_item': return pad + '1. ' + text;
    case 'to_do': return pad + '[' + (data.checked ? 'x' : ' ') + '] ' + text;
    case 'toggle': return pad + text;
    case 'quote': return pad + '> ' + text;
    case 'callout': return pad + text;
    case 'code': return pad + '```\n' + text + '\n' + pad + '```';
    case 'divider': return pad + '---';
    case 'paragraph': return pad + text;
    default: return pad + text;
  }
}

function getPageTitle(page) {
  const props = page && page.properties ? page.properties : {};
  for (const key of Object.keys(props)) {
    const p = props[key];
    if (p && p.type === 'title') {
      return extractRichText(p.title) || '(未命名)';
    }
  }
  return '(未命名)';
}

// 將 Notion page properties （Description、Bonus、Select 等）轉成文字
// child_database 裡的很多规章內容在這裡，不在 block 裡
function extractPagePropertiesText(page) {
  const props = page && page.properties ? page.properties : {};
  const lines = [];
  for (const key of Object.keys(props)) {
    const p = props[key];
    if (!p) continue;
    // 跳過 title（已經先被當標題用了）
    if (p.type === 'title') continue;
    let val = '';
    switch (p.type) {
      case 'rich_text':
        val = extractRichText(p.rich_text);
        break;
      case 'number':
        val = (p.number == null) ? '' : String(p.number);
        break;
      case 'select':
        val = (p.select && p.select.name) || '';
        break;
      case 'multi_select':
        val = (p.multi_select || []).map(o => o.name).filter(Boolean).join(', ');
        break;
      case 'status':
        val = (p.status && p.status.name) || '';
        break;
      case 'checkbox':
        val = p.checkbox ? '是' : '否';
        break;
      case 'date':
        val = (p.date && (p.date.start || '')) + (p.date && p.date.end ? ' ~ ' + p.date.end : '');
        break;
      case 'url':
        val = p.url || '';
        break;
      case 'email':
        val = p.email || '';
        break;
      case 'phone_number':
        val = p.phone_number || '';
        break;
      case 'people':
        val = (p.people || []).map(u => u.name).filter(Boolean).join(', ');
        break;
      case 'formula':
        if (p.formula) {
          if (p.formula.type === 'string') val = p.formula.string || '';
          else if (p.formula.type === 'number') val = (p.formula.number == null) ? '' : String(p.formula.number);
          else if (p.formula.type === 'boolean') val = p.formula.boolean ? '是' : '否';
          else if (p.formula.type === 'date' && p.formula.date) val = p.formula.date.start || '';
        }
        break;
      case 'rollup':
        if (p.rollup) {
          if (p.rollup.type === 'number') val = (p.rollup.number == null) ? '' : String(p.rollup.number);
          else if (p.rollup.type === 'array') {
            val = (p.rollup.array || []).map(item => {
              if (item.type === 'rich_text') return extractRichText(item.rich_text);
              if (item.type === 'title') return extractRichText(item.title);
              if (item.type === 'number') return String(item.number || '');
              return '';
            }).filter(Boolean).join(', ');
          }
        }
        break;
      default:
        val = '';
    }
    val = (val || '').toString().trim();
    if (val) lines.push('- ' + key + '：' + val);
  }
  return lines.join('\n');
}

async function fetchBlockChildren(blockId, token, depth) {
  depth = depth || 0;
  if (depth > MAX_NEST_DEPTH) return '';
  let text = '';
  let cursor = null;
  let safety = 0;
  do {
    const url = 'https://api.notion.com/v1/blocks/' + encodeURIComponent(blockId) + '/children?page_size=100' +
      (cursor ? '&start_cursor=' + encodeURIComponent(cursor) : '');
    let data;
    try { data = await notionFetch(url, token); }
    catch (e) { break; }

    for (const b of (data.results || [])) {
      // 遇到子資料庫 → query 並把每一筆抓進來
      if (b.type === 'child_database') {
        try {
          text += '\n' + (await fetchDatabaseAsText(b.id, token, depth + 1)) + '\n';
        } catch (e) {
          text += '\n[讀取子資料庫失敗: ' + (e.message || '') + ']\n';
        }
        continue;
      }
      // 遇到子頁面 → 遞迴抓頁面內容
      if (b.type === 'child_page') {
        const title = (b.child_page && b.child_page.title) || '(子頁面)';
        text += '\n## ' + title + '\n';
        try {
          text += await fetchBlockChildren(b.id, token, depth + 1);
        } catch (e) {}
        continue;
      }
      const line = blockToText(b, depth);
      if (line) text += line + '\n';
      if (b.has_children) {
        try {
          text += await fetchBlockChildren(b.id, token, depth + 1);
        } catch (e) {}
      }
    }
    cursor = data.has_more ? data.next_cursor : null;
    safety++;
  } while (cursor && safety < 20);
  return text;
}

async function fetchDatabaseAsText(dbId, token, depth) {
  depth = depth || 0;
  // 取資料庫標題（若有）
  let dbTitle = '';
  try {
    const meta = await notionFetch('https://api.notion.com/v1/databases/' + encodeURIComponent(dbId), token);
    if (meta && Array.isArray(meta.title)) dbTitle = extractRichText(meta.title);
  } catch (e) { /* 忽略 */ }

  let out = dbTitle ? ('\n===== 資料庫：' + dbTitle + ' =====\n') : '\n===== 子資料庫 =====\n';

  // query 資料庫所有 page
  let cursor = null;
  let collected = 0;
  let safety = 0;
  do {
    const body = { page_size: Math.min(100, MAX_DB_ROWS - collected) };
    if (cursor) body.start_cursor = cursor;
    let data;
    try {
      const r = await fetch('https://api.notion.com/v1/databases/' + encodeURIComponent(dbId) + '/query', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) break;
      data = await r.json();
    } catch (e) { break; }

    for (const page of (data.results || [])) {
      if (collected >= MAX_DB_ROWS) break;
      collected++;
      const title = getPageTitle(page);
      out += '\n### ' + title + '\n';

      // 1. 先把 properties （Description、Bonus等欄位）轉成文字
      const propsText = extractPagePropertiesText(page);
      if (propsText) out += propsText + '\n';

      // 2. 再把 page 內的 blocks（含 table、段落等）抹上來
      try {
        const body = await fetchBlockChildren(page.id, token, depth + 1);
        if (body && body.trim()) out += body + '\n';
        else if (!propsText) out += '(此條目無內文)\n';
      } catch (e) {
        out += '[讀取內文失敗]\n';
      }
    }

    cursor = data.has_more ? data.next_cursor : null;
    safety++;
  } while (cursor && collected < MAX_DB_ROWS && safety < 10);

  return out;
}

async function fetchNotionPageText(pageId, token) {
  // 直接遞迴讀取整個頁面（包含 child_database 和 child_page）
  return await fetchBlockChildren(pageId, token, 0);
}

async function getRules(token, pageId, bypassCache) {
  const now = Date.now();
  if (!bypassCache && rulesCache && (now - rulesCacheAt) < RULES_TTL_MS) {
    return rulesCache;
  }
  const text = await fetchNotionPageText(pageId, token);
  const trimmed = (text || '').slice(0, MAX_RULES_CHARS);
  rulesCache = trimmed;
  rulesCacheAt = now;
  return trimmed;
}

// 除錯用：?debug=1 可看抓到的規章原文
function isDebug(req) {
  try {
    const url = new URL(req.url, 'http://x');
    return url.searchParams.get('debug') === '1';
  } catch (e) { return false; }
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body
      : (req.body ? JSON.parse(req.body) : {});
    const question = (body.question || '').toString().trim();
    if (!question) { res.status(400).json({ error: '請輸入問題' }); return; }
    if (question.length > MAX_QUESTION_LEN) {
      res.status(400).json({ error: '問題不得超過 ' + MAX_QUESTION_LEN + ' 字' });
      return;
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openrouterModel = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
    const openaiKey = process.env.OPENAI_API_KEY;
    const notionToken = process.env.NOTION_TOKEN;
    const rawPageId = process.env.NOTION_HR_PAGE_ID;
    if (!openrouterKey && !openaiKey) { res.status(500).json({ error: '伺服器未設定 OPENROUTER_API_KEY 或 OPENAI_API_KEY' }); return; }
    if (!notionToken) { res.status(500).json({ error: '伺服器未設定 NOTION_TOKEN' }); return; }
    if (!rawPageId) { res.status(500).json({ error: '伺服器未設定 NOTION_HR_PAGE_ID' }); return; }

    const pageId = normalizePageId(rawPageId);

    // 支援 ?refresh=1 強迫重新抓取
    const bypassCache = (function(){
      try { return new URL(req.url,'http://x').searchParams.get('refresh') === '1'; }
      catch(e){ return false; }
    })();

    let rules = '';
    try {
      rules = await getRules(notionToken, pageId, bypassCache);
    } catch (e) {
      res.status(502).json({ error: '讀取公司規章失敗：' + (e.message || '未知錯誤') + '。請確認 Notion integration 已被 share 至該頁面。' });
      return;
    }

    if (isDebug(req)) {
      res.status(200).json({ debug: true, rules_length: rules.length, rules_preview: rules.slice(0, 4000) });
      return;
    }

    if (!rules || rules.length < 20) {
      res.status(502).json({ error: '公司規章內容為空或過短（實際長度：' + (rules ? rules.length : 0) + ' 字）。請確認 Notion 頁面 + 子資料庫都已 share 給 integration。' });
      return;
    }

    const systemPrompt =
      '你是「聚寶水晶 Precious Crystal」的 AI 人資助理，名字叫「水晶妹」。你的工作是幫員工回答公司制度、出勤、請假、薪資、福利、規章的問題。\n' +
      '\n' +
      '以下是公司規章原文（由 Notion 頁面抓取），這是你唯一的正式依據：\n' +
      '===== 公司規章開始 =====\n' +
      rules +
      '\n===== 公司規章結束 =====\n' +
      '\n' +
      '【人設規則】\n' +
      '你跟員工講話就像在跟閨蜜聊天。已經是日常了，不用客氣客套。\n' +
      '\n' +
      '1. 用「你」不用「您」。絕對不要用「敬請」「煩請」「依本公司規定」這種陳腐的行政文。\n' +
      '2. 說人話。不要「根據公司規章」「建議您」「請參考」這種僵硬開場，直接進正題。\n' +
      '3. 可以適度用顏文字讓回答有溫度，但不要過度。例如：´･ω･`、(˘▾˘)、(¯﹃¯)、(*´ω`)、(＞ω＜)、ᕙ(⇀‸↼‶)ᕗ、QQ。不是每句都要加，一個回答 1-2 個就夠。\n' +
      '4. 有話直說：規章沒寫就跟她說沒寫，不要繞、不要用「可能」「或許」模糊帶過。例如「這規章裡沒寫欸，你得直接問老闆」「這個我真的答不出來 QQ」。\n' +
      '5. 不安慰、不奉承。員工問「這樣合理嗎」，你就告訴她規章怎麼寫，不用去判斷合不合理，也不用一直幫老闆護航。寧可殘忍坦承，也不溫順奉承。\n' +
      '6. 加班費、個人薪資、考績這種機密問題，直接說「這個得直接問老闆/人資，我這邊看不到個人資料的 (¯﹃¯)」。\n' +
      '7. 問題跟人資無關（股票、感情、生病），幽默婉拒，例如「哈哈這我不熟欸 XD 你要不要問我請假規定之類的」。\n' +
      '8. 不要每次結尾都加「如有疑問請聯繫人資」。真的有必要才說。\n' +
      '9. 回答若有引用規章，用輕鬆方式標註，例如「（這寫在福利制度裡）」「（公司規範第 26 條有寫）」。\n' +
      '10. 繁體中文、台灣用語。長問題 200-400 字、短問題 50-150 字，不要長篇大論。';

    // 優先走 OpenRouter (Claude Sonnet 4)，沒設才退回 OpenAI gpt-4o-mini
    let llmResp;
    let providerLabel;
    if (openrouterKey) {
      providerLabel = 'OpenRouter';
      llmResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + openrouterKey,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://preciouscrystal.com.tw',
          'X-Title': 'Precious Crystal HR Chat',
        },
        body: JSON.stringify({
          model: openrouterModel,
          temperature: 0.3,
          max_tokens: 700,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
        }),
      });
    } else {
      providerLabel = 'OpenAI';
      llmResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + openaiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.3,
          max_tokens: 700,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
        }),
      });
    }

    if (!llmResp.ok) {
      const errText = await llmResp.text();
      res.status(502).json({ error: providerLabel + ' API 錯誤 (' + llmResp.status + ')：' + errText.slice(0, 300) });
      return;
    }
    const llmData = await llmResp.json();
    const answer = llmData && llmData.choices && llmData.choices[0] &&
                   llmData.choices[0].message && llmData.choices[0].message.content;
    if (!answer) { res.status(502).json({ error: providerLabel + ' 回傳無內容' }); return; }

    res.status(200).json({ answer: answer.trim() });
  } catch (e) {
    res.status(500).json({ error: '伺服器內部錯誤：' + (e.message || '未知') });
  }
};
