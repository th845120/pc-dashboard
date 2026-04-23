// Vercel Serverless Function: /api/hr-chat
// 員工人資 AI 問答：抓 Notion 規章頁面 + 呼叫 OpenAI
//
// 環境變數（必須在 Vercel 後台設定）：
//   OPENAI_API_KEY       OpenAI API key
//   NOTION_TOKEN         Notion integration token（需 share 規章頁面給 integration）
//   NOTION_HR_PAGE_ID    Notion 規章頁面 ID（含或不含 dash 皆可）
//   HR_ALLOWED_ORIGIN    （選配）CORS 允許的 origin，預設 https://preciouscrystal.com.tw

const NOTION_VERSION = '2022-06-28';
const OPENAI_MODEL = 'gpt-4o-mini';
const MAX_QUESTION_LEN = 500;
const MAX_RULES_CHARS = 18000; // 限制 system prompt 長度，避免費用爆炸

// 簡單的記憶體快取（同一個 serverless 容器共用）
let rulesCache = null;
let rulesCacheAt = 0;
const RULES_TTL_MS = 10 * 60 * 1000; // 10 分鐘

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

function blockToText(block) {
  const type = block.type;
  const data = block[type];
  if (!data) return '';
  const rt = data.rich_text;
  const text = extractRichText(rt);
  switch (type) {
    case 'heading_1': return '\n# ' + text + '\n';
    case 'heading_2': return '\n## ' + text + '\n';
    case 'heading_3': return '\n### ' + text + '\n';
    case 'bulleted_list_item': return '- ' + text;
    case 'numbered_list_item': return '1. ' + text;
    case 'to_do': return '[' + (data.checked ? 'x' : ' ') + '] ' + text;
    case 'toggle': return text;
    case 'quote': return '> ' + text;
    case 'callout': return text;
    case 'code': return '```\n' + text + '\n```';
    case 'divider': return '---';
    case 'paragraph': return text;
    default: return text;
  }
}

async function fetchNotionPageText(pageId, token) {
  // Notion blocks list 是平坦的（最多一層需要遞迴子 blocks）
  // 為效能考量先抓一層，規章通常用 heading / list 已足夠
  let text = '';
  let cursor = null;
  let safety = 0;
  do {
    const url = 'https://api.notion.com/v1/blocks/' + encodeURIComponent(pageId) + '/children?page_size=100' +
      (cursor ? '&start_cursor=' + encodeURIComponent(cursor) : '');
    const data = await notionFetch(url, token);
    for (const b of (data.results || [])) {
      const line = blockToText(b);
      if (line) text += line + '\n';
      // 抓第一層子區塊（toggle / list 常有巢狀）
      if (b.has_children) {
        try {
          const childUrl = 'https://api.notion.com/v1/blocks/' + encodeURIComponent(b.id) + '/children?page_size=100';
          const childData = await notionFetch(childUrl, token);
          for (const cb of (childData.results || [])) {
            const cLine = blockToText(cb);
            if (cLine) text += '  ' + cLine + '\n';
          }
        } catch (e) {
          // 忽略單一子區塊錯誤
        }
      }
    }
    cursor = data.has_more ? data.next_cursor : null;
    safety++;
  } while (cursor && safety < 20);
  return text;
}

async function getRules(token, pageId) {
  const now = Date.now();
  if (rulesCache && (now - rulesCacheAt) < RULES_TTL_MS) {
    return rulesCache;
  }
  const text = await fetchNotionPageText(pageId, token);
  const trimmed = text.slice(0, MAX_RULES_CHARS);
  rulesCache = trimmed;
  rulesCacheAt = now;
  return trimmed;
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

    const openaiKey = process.env.OPENAI_API_KEY;
    const notionToken = process.env.NOTION_TOKEN;
    const rawPageId = process.env.NOTION_HR_PAGE_ID;
    if (!openaiKey) { res.status(500).json({ error: '伺服器未設定 OPENAI_API_KEY' }); return; }
    if (!notionToken) { res.status(500).json({ error: '伺服器未設定 NOTION_TOKEN' }); return; }
    if (!rawPageId) { res.status(500).json({ error: '伺服器未設定 NOTION_HR_PAGE_ID' }); return; }

    const pageId = normalizePageId(rawPageId);

    let rules = '';
    try {
      rules = await getRules(notionToken, pageId);
    } catch (e) {
      res.status(502).json({ error: '讀取公司規章失敗：' + (e.message || '未知錯誤') + '。請確認 Notion integration 已被 share 至該頁面。' });
      return;
    }

    if (!rules || rules.length < 20) {
      res.status(502).json({ error: '公司規章內容為空或過短，請確認 Notion 頁面有內容且已 share 給 integration。' });
      return;
    }

    const systemPrompt =
      '你是「聚寶水晶 Precious Crystal」的 AI 人資助理，專門回答員工關於公司制度、出勤、請假、薪資、福利與規章的問題。\n' +
      '\n' +
      '以下是公司規章原文（由 Notion 頁面抓取），請以此為唯一正式依據：\n' +
      '===== 公司規章開始 =====\n' +
      rules +
      '\n===== 公司規章結束 =====\n' +
      '\n' +
      '回答規則：\n' +
      '1. 僅能根據上方規章內容作答；若規章沒有明確規定，請回答「規章未明定此項，請聯繫人資窗口」，不可自行編造。\n' +
      '2. 若問題與人資制度無關（例如問股票、生活瑣事），禮貌拒絕並引導回人資主題。\n' +
      '3. 回答以繁體中文為主，語氣專業友善，避免口語化過度。\n' +
      '4. 若問題涉及個人薪資、考績、個資等敏感資訊，請提醒員工直接聯繫人資，AI 不代為回答個人資料。\n' +
      '5. 回答結尾若有引用規章段落，請在括號中標示章節名稱或關鍵字，讓員工可以回溯。\n' +
      '6. 回答長度控制在 400 字以內，重點清楚。';

    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
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

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      res.status(502).json({ error: 'OpenAI API 錯誤 (' + openaiResp.status + ')：' + errText.slice(0, 300) });
      return;
    }
    const openaiData = await openaiResp.json();
    const answer = openaiData && openaiData.choices && openaiData.choices[0] &&
                   openaiData.choices[0].message && openaiData.choices[0].message.content;
    if (!answer) { res.status(502).json({ error: 'OpenAI 回傳無內容' }); return; }

    res.status(200).json({ answer: answer.trim() });
  } catch (e) {
    res.status(500).json({ error: '伺服器內部錯誤：' + (e.message || '未知') });
  }
};
