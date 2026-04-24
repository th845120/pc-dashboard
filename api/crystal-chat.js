// Vercel Serverless Function: /api/crystal-chat
// 水晶知識問答：讀取 JSON 知識庫 + 語意檢索 + GPT 回答（附書名頁碼）
//
// 環境變數：
//   OPENAI_API_KEY       OpenAI API key
//   HR_ALLOWED_ORIGIN    （選配）CORS 允許的 origin

const fs = require('fs');
const path = require('path');

const OPENAI_CHAT_MODEL = 'gpt-4o-mini';
const OPENAI_EMBED_MODEL = 'text-embedding-3-small';
const MAX_QUESTION_LEN = 500;
const TOP_K = 8;              // 取最相關 8 段餵給 GPT
const MAX_CHUNK_CHARS = 1200; // 單段最多 1200 字，超過切塊

// 知識庫與向量索引在啟動時載入，常駐記憶體
let KB_CHUNKS = null;         // [{ book, page, text, embedding: [] }, ...]
let KB_LOADED_AT = 0;

function setCors(req, res) {
  const allow = process.env.HR_ALLOWED_ORIGIN || 'https://preciouscrystal.com.tw';
  const origin = req.headers.origin || '';
  const ok =
    origin === allow ||
    /^https:\/\/.*\.vercel\.app$/.test(origin) ||
    /^http:\/\/localhost(:\d+)?$/.test(origin);
  res.setHeader('Access-Control-Allow-Origin', ok ? origin : allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function loadKB() {
  if (KB_CHUNKS) return KB_CHUNKS;
  // 檔案放在 /public/crystal_kb.json 或 /data/crystal_kb.json
  const candidates = [
    path.join(process.cwd(), 'data', 'crystal_kb.json'),
    path.join(process.cwd(), 'public', 'crystal_kb.json'),
    path.join(__dirname, '..', 'data', 'crystal_kb.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        KB_CHUNKS = Array.isArray(data) ? data : (data.chunks || []);
        KB_LOADED_AT = Date.now();
        return KB_CHUNKS;
      }
    } catch (e) { /* ignore */ }
  }
  throw new Error('找不到知識庫檔案 crystal_kb.json');
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function embedQuery(openaiKey, query) {
  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + openaiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OPENAI_EMBED_MODEL, input: query }),
  });
  if (!r.ok) throw new Error('Embedding API ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  return d.data[0].embedding;
}

function keywordScore(text, query) {
  // 簡單中文關鍵字命中：依查詢字中出現次數加分
  if (!text || !query) return 0;
  let score = 0;
  // 拆出 2-4 字詞做子字串匹配
  const words = [];
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= query.length - n; i++) words.push(query.slice(i, i + n));
  }
  const uniq = Array.from(new Set(words));
  for (const w of uniq) {
    if (text.includes(w)) score += w.length; // 長詞加權
  }
  return score;
}

async function retrieveTopK(openaiKey, query, topK) {
  const kb = loadKB();
  if (!kb || kb.length === 0) throw new Error('知識庫為空');

  // 先看是否有 embedding
  const hasEmbed = kb[0] && Array.isArray(kb[0].embedding);
  const scored = [];
  let usedEmbed = false;

  if (hasEmbed) {
    let qvec;
    try { qvec = await embedQuery(openaiKey, query); usedEmbed = !!qvec; }
    catch (e) { qvec = null; }
    for (const c of kb) {
      let cos = 0, kw = 0;
      if (qvec) cos = cosineSim(qvec, c.embedding);
      kw = keywordScore(c.text, query);
      const s = cos * 10 + kw * 0.3;
      scored.push({ c: c, s: s, cos: cos, kw: kw });
    }
  } else {
    for (const c of kb) {
      const kw = keywordScore(c.text, query);
      scored.push({ c: c, s: kw, cos: 0, kw: kw });
    }
  }
  scored.sort((a, b) => b.s - a.s);
  // 回傳帶分數
  return scored.slice(0, topK).map(x => ({
    book: x.c.book, page: x.c.page, text: x.c.text,
    cos: x.cos, kw: x.kw,
  }));
}

// 檢測問題關鍵字是否在檢索結果中出現（判斷有沒有真匹配）
function queryKeyTerms(query) {
  // 策略：先用「虛詞/疑問詞/標點/空白」把問題斷成實詞片段，再從片段裡抽 2-4 字詞。
  // 這樣「超七是什麼」會被拆成「超七」 + 「什麼」（什麼會被 STOP 濾掉），
  // 不會產生「超七是什」「七是什麼」這種橫跨虛詞的垃圾詞。
  const SEPARATORS = [
    '是什麼','是不是','有沒有','怎麼樣','的時候','什麼意思',
    '什麼','怎麼','如何','哪種','哪個','哪裡','哪些',
    '最貴','最便','最好','最強','最多','最少','最大','最小',
    '功效','作用','意思','代表','因為','所以','但是',
    '可以','請問','我要','我想','如果','的話','介紹','說明','比較',
    '一下','一點','知道','了解','查詢','搜尋','告訴',
    '還有','或是','或者','以及','而且','而且',
    '多少','幾個','幾種','種類','分類','價格','價錢','多貴','多少錢',
    '什麼','怎榮','怎樣','緣由','原因',
  ];
  // 單字虛詞 / 疑問詞 / 代名詞 / 常見動詞
  const SINGLE_STOP = '是的了嗎呢啊耶喔我你妳他她它有沒因而和且就都也讓別又可太很吃用看說説問答寫講跟與或並但即若而由給從們個把該此這那其中之啟誓呵阿要不在會點以同還已再在到對最最內有無裡邊另我們你們他們自己自己們來去起下上前後里外平常經常非常比較';
  // 標點 / 非中文字符全部當分隔
  let normalized = query;
  for (const sep of SEPARATORS) {
    normalized = normalized.split(sep).join('\u0000');
  }
  // 非中文字濾掉
  normalized = normalized.replace(/[^\u4e00-\u9fff\u0000]/g, '\u0000');
  // 單字停用詞當分隔
  normalized = normalized.split('').map(ch => SINGLE_STOP.includes(ch) ? '\u0000' : ch).join('');

  const segments = normalized.split('\u0000').filter(s => s.length > 0);
  const terms = [];
  for (const seg of segments) {
    // 實詞片段：實詞本身加進去。若長度 >=2，也抽 2-4 字子串。
    if (seg.length >= 2) terms.push(seg);  // 保留完整片段（最強力）
    for (let n = 2; n <= 4; n++) {
      if (seg.length < n) continue;
      for (let i = 0; i <= seg.length - n; i++) {
        terms.push(seg.slice(i, i + n));
      }
    }
  }
  // 去重，優先保留長詞
  const uniq = Array.from(new Set(terms));
  uniq.sort((a, b) => b.length - a.length);
  return uniq;
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
      res.status(400).json({ error: '問題不得超過 ' + MAX_QUESTION_LEN + ' 字' }); return;
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) { res.status(500).json({ error: '伺服器未設定 OPENAI_API_KEY' }); return; }

    // Debug 模式：?debug=1 回傳找到的段落預覽
    let isDebug = false;
    try { isDebug = new URL(req.url, 'http://x').searchParams.get('debug') === '1'; } catch (e) {}

    // 檢索
    let topChunks;
    try {
      topChunks = await retrieveTopK(openaiKey, question, TOP_K);
    } catch (e) {
      res.status(500).json({ error: '檢索失敗：' + (e.message || '未知') }); return;
    }

    if (!topChunks || topChunks.length === 0) {
      res.status(502).json({ error: '知識庫找不到相關內容' }); return;
    }

    if (isDebug) {
      res.status(200).json({
        debug: true,
        question: question,
        top: topChunks.map(c => ({
          book: c.book, page: c.page,
          preview: (c.text || '').slice(0, 200),
        })),
      });
      return;
    }

    // 檢測檢索置信度：用問題的關鍵詞檢查 top chunks 有沒有真的包含
    const keyTerms = queryKeyTerms(question);
    // 只挑最長的前幾個關鍵詞當「核心詞」。2 字以上優先。
    const coreTerms = keyTerms.filter(t => t.length >= 2).slice(0, 8);
    let strongHits = 0;  // top chunks 中有多少段真的包含核心關鍵詞
    const hitTerms = new Set();
    topChunks.forEach(c => {
      for (const t of coreTerms) {
        if (c.text && c.text.includes(t)) {
          hitTerms.add(t);
          strongHits++;
          break;
        }
      }
    });
    const maxCos = topChunks.reduce((m, c) => Math.max(m, c.cos || 0), 0);
    const lowConfidence = (strongHits < 2) || (maxCos < 0.30);
    // 極低信心：只要核心關鍵詞完全沒命中（strongHits === 0）就直接拒答。
    // 中文短詞的 embedding 相似度不可靠（例如「超七」會被誤判高分），
    // 必須靠字面命中才能確認書裡真的有寫到這個東西。
    // 只有在有抽出核心關鍵詞但完全沒命中時才拒答；若問題本身沒有核心詞（例如純問候），交給 GPT 處理。
    const veryLowConfidence = (coreTerms.length > 0 && strongHits === 0);

    if (veryLowConfidence) {
      const kwList = coreTerms.length > 0 ? `「${coreTerms.slice(0, 5).join('」「')}」` : '這個';
      res.status(200).json({
        answer: `${kwList} 這個我在 14 本書裡都沒查到欸 QQ\n\n我只會回答書裡實際有寫的內容，書裡沒寫的我不敢亂編讓你跟客人講錯話 (¯﹃¯)\n\n建議你直接跟老闆或資深直播主確認一下，或者換個關鍵字再問我試試～`,
        sources: [],
        diagnostic: {
          reason: 'no_keyword_hit',
          coreTerms: coreTerms,
          keyTerms: keyTerms,
          maxCosine: maxCos,
          strongHits: strongHits,
        },
      });
      return;
    }

    // 組 context。每段標出 cosine 分數讓 GPT 知道哪些是真相關
    let context = '';
    topChunks.forEach((c, i) => {
      const snippet = (c.text || '').slice(0, MAX_CHUNK_CHARS);
      const tag = (c.cos >= 0.35) ? '高相關' : (c.cos >= 0.25 ? '中相關' : '低相關');
      context += `\n[參考${i + 1}·${tag}] 出自《${c.book}》p.${c.page}\n${snippet}\n`;
    });
    context += `\n[檢索診斷] 問題關鍵詞「${keyTerms.join('」「')}」中，真实命中的只有：${hitTerms.size === 0 ? '無' : Array.from(hitTerms).join('、')}。最高語意相似度：${maxCos.toFixed(3)}。${lowConfidence ? '▲ 低信心：參考資料中似乎沒有直接回答這個問題的內容。' : ''}`;

    const systemPrompt =
      '你是「聚寶水晶 Precious Crystal」的 AI 水晶知識助理，名字叫「水晶小妹」。你只能根據公司內部的專業水晶/寶石/礦石/療癒文獻回答員工問題。\n' +
      '\n' +
      '===== 參考資料開始 =====\n' + context + '\n===== 參考資料結束 =====\n' +
      '\n' +
      '【【最重要的規則 —— 絕對不能編造】】\n' +
      'A. 你只能回答「參考資料」中實際寫到的內容。參考資料沒寫的東西，你絕對不能講，也不能從你的訓練記憶裡補。\n' +
      'B. 每段參考資料頭部都標了「高相關/中相關/低相關」。只有「高相關」跟「中相關」且內容直接提到問題關鍵字的段落才能當來源引用。「低相關」的段落即使找出來也不能當出處。\n' +
      'C. 【如何判斷沒寫】看「檢索診斷」那行。如果寫著「▲ 低信心」，或問題關鍵字直接沒在任何參考資料出現過，那就是書裡沒寫。\n' +
      'D. 【書裡沒寫時怎麼回】直接跟員工說「這個關鍵字在我知識庫的 14 本書裡都沒查到欸 QQ」或「書裡沒直接寫」，可以遷詞到你能找到的相關內容例如「不過書裡有寫到《x》的內容，你要看嗎」。絕對不能編答案、也不能發明書名頁碼。\n' +
      'E. 引用出處時，只能用「高/中相關」且內容真的跟你回答有關的段落。寫錯書名頁碼會讓員工去跟客人講錯話、出大糗。\n' +
      '\n' +
      '【人設規則】\n' +
      '你跟員工講話就像在跟閨蜜聊天。\n' +
      '1. 用「你」不用「您」。不要「敬請」「煩請」「依據專業文獻」這種行政文。\n' +
      '2. 說人話。不要「根據參考資料」「建議您」這種開場，直接進正題。\n' +
      '3. 適度用顏文字：´･ω･`、(˘▾˘)、(¯﹃¯)、(*´ω`)、(＞ω＜)、ᕙ(⇀‸↼‶)ᕗ、QQ。一個回答 1-2 個就好。\n' +
      '4. OCR 文本可能有錯字（「氛」→「氮」、「丫性」→「韌性」），你懂意思就好。但錯字不等於可以編內容。\n' +
      '5. 【最關鍵】若有動用參考資料內容，結尾必須標「—— 出自《書名》p.頁碼」（只能寫參考資料中真正提供答案的那幾段的書名頁碼）。若書裡沒寫這個問題，不要強採出處。\n' +
      '6. 長問題 300-500 字、短問題 80-200 字。\n' +
      '7. 問題跟水晶/寶石/礦石/療癒無關，幽默婉拒：「這我沒讀過欸 XD」。\n' +
      '8. 繁體中文、台灣用語。';

    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + openaiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OPENAI_CHAT_MODEL,
        temperature: 0.4,
        max_tokens: 900,
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

    res.status(200).json({
      answer: answer.trim(),
      sources: topChunks.map(c => ({ book: c.book, page: c.page })),
    });
  } catch (e) {
    res.status(500).json({ error: '伺服器內部錯誤：' + (e.message || '未知') });
  }
};
