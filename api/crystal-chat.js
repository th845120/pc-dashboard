// Vercel Serverless Function: /api/crystal-chat
// 水晶知識問答：RAG + 4 層防禦
//   第 1 層：OCR 品質過濾（低分頁降權/排除）
//   第 2 層：多書交叉驗證（單書來源加警語）
//   第 3 層：常識事實白名單 + 衝突檢測
//   第 4 層：前端回報按鈕（由 /api/crystal-report 處理）
//
// 環境變數：OPENAI_API_KEY, HR_ALLOWED_ORIGIN

const fs = require('fs');
const path = require('path');

const OPENAI_CHAT_MODEL = 'gpt-4o-mini';
const OPENAI_EMBED_MODEL = 'text-embedding-3-small';
const MAX_QUESTION_LEN = 500;
const TOP_K = 8;
const MAX_CHUNK_CHARS = 1200;
const MIN_OCR_QUALITY = 5;  // OCR 品質 < 5 的頁面完全排除
const WARN_OCR_QUALITY = 7; // OCR 品質 < 7 的頁面給 prompt 加警語

let KB_CHUNKS = null;
let WHITELIST = null;

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
        return KB_CHUNKS;
      }
    } catch (e) { /* ignore */ }
  }
  throw new Error('找不到知識庫檔案 crystal_kb.json');
}

function loadWhitelist() {
  if (WHITELIST) return WHITELIST;
  const candidates = [
    path.join(process.cwd(), 'data', 'crystal_facts_whitelist.json'),
    path.join(__dirname, '..', 'data', 'crystal_facts_whitelist.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        WHITELIST = JSON.parse(fs.readFileSync(p, 'utf-8'));
        return WHITELIST;
      }
    } catch (e) { /* ignore */ }
  }
  WHITELIST = { crystals: {} };
  return WHITELIST;
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
  if (!text || !query) return 0;
  let score = 0;
  const words = [];
  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= query.length - n; i++) words.push(query.slice(i, i + n));
  }
  const uniq = Array.from(new Set(words));
  for (const w of uniq) {
    if (text.includes(w)) score += w.length;
  }
  return score;
}

async function retrieveTopK(openaiKey, query, topK) {
  const kb = loadKB();
  if (!kb || kb.length === 0) throw new Error('知識庫為空');

  const hasEmbed = kb[0] && Array.isArray(kb[0].embedding);
  const scored = [];

  if (hasEmbed) {
    let qvec;
    try { qvec = await embedQuery(openaiKey, query); }
    catch (e) { qvec = null; }
    for (const c of kb) {
      // 【第 1 層】OCR 品質 < MIN_OCR_QUALITY 直接排除
      const q = (typeof c.quality === 'number') ? c.quality : 10;
      if (q < MIN_OCR_QUALITY) continue;
      let cos = 0, kw = 0;
      if (qvec) cos = cosineSim(qvec, c.embedding);
      kw = keywordScore(c.text, query);
      // 品質低者降權
      const qualityPenalty = q < WARN_OCR_QUALITY ? 0.5 : 1.0;
      const s = (cos * 10 + kw * 0.3) * qualityPenalty;
      scored.push({ c: c, s: s, cos: cos, kw: kw, q: q });
    }
  } else {
    for (const c of kb) {
      const q = (typeof c.quality === 'number') ? c.quality : 10;
      if (q < MIN_OCR_QUALITY) continue;
      const kw = keywordScore(c.text, query);
      scored.push({ c: c, s: kw, cos: 0, kw: kw, q: q });
    }
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, topK).map(x => ({
    book: x.c.book, page: x.c.page, text: x.c.text,
    cos: x.cos, kw: x.kw, quality: x.q,
  }));
}

// 抽取問題核心關鍵詞
function queryKeyTerms(query) {
  const SEPARATORS = [
    '是什麼','是不是','有沒有','怎麼樣','的時候','什麼意思',
    '什麼','怎麼','如何','哪種','哪個','哪裡','哪些',
    '最貴','最便','最好','最強','最多','最少','最大','最小',
    '功效','作用','意思','代表','因為','所以','但是',
    '可以','請問','我要','我想','如果','的話','介紹','說明','比較',
    '一下','一點','知道','了解','查詢','搜尋','告訴',
    '還有','或是','或者','以及','而且',
    '多少','幾個','幾種','種類','分類','價格','價錢','多貴','多少錢',
    '怎榮','怎樣','緣由','原因',
  ];
  const SINGLE_STOP = '是的了嗎呢啊耶喔我你妳他她它有沒因而和且就都也讓別又可太很吃用看說説問答寫講跟與或並但即若而由給從們個把該此這那其中之啟誓呵阿要不在會點以同還已再在到對最內有無裡邊另來去起下上前後里外平常經常非常比較';
  let normalized = query;
  for (const sep of SEPARATORS) normalized = normalized.split(sep).join('\u0000');
  normalized = normalized.replace(/[^\u4e00-\u9fff\u0000]/g, '\u0000');
  normalized = normalized.split('').map(ch => SINGLE_STOP.includes(ch) ? '\u0000' : ch).join('');

  const segments = normalized.split('\u0000').filter(s => s.length > 0);
  const terms = [];
  for (const seg of segments) {
    if (seg.length >= 2) terms.push(seg);
    for (let n = 2; n <= 4; n++) {
      if (seg.length < n) continue;
      for (let i = 0; i <= seg.length - n; i++) terms.push(seg.slice(i, i + n));
    }
  }
  const uniq = Array.from(new Set(terms));
  uniq.sort((a, b) => b.length - a.length);
  return uniq;
}

// 【第 3 層】判斷問題是否觸及白名單水晶，若有則組 facts 上下文
function matchWhitelist(question) {
  const wl = loadWhitelist();
  const matched = [];
  for (const [name, fact] of Object.entries(wl.crystals || {})) {
    const hit = question.includes(name) ||
                (fact.aliases || []).some(a => question.toLowerCase().includes(String(a).toLowerCase()));
    if (hit) matched.push({ name, fact });
  }
  return matched;
}

// 【第 2 層】多書交叉驗證：top chunks 來自幾本不同書？
function bookDiversity(topChunks) {
  const books = new Set();
  topChunks.forEach(c => books.add(c.book));
  return books.size;
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

    let isDebug = false;
    try { isDebug = new URL(req.url, 'http://x').searchParams.get('debug') === '1'; } catch (e) {}

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
        debug: true, question,
        top: topChunks.map(c => ({
          book: c.book, page: c.page, quality: c.quality,
          cos: c.cos, kw: c.kw,
          preview: (c.text || '').slice(0, 200),
        })),
        whitelist_matched: matchWhitelist(question).map(m => m.name),
      });
      return;
    }

    // 關鍵字命中檢查
    const keyTerms = queryKeyTerms(question);
    const coreTerms = keyTerms.filter(t => t.length >= 2).slice(0, 8);
    let strongHits = 0;
    const hitTerms = new Set();
    topChunks.forEach(c => {
      for (const t of coreTerms) {
        if (c.text && c.text.includes(t)) { hitTerms.add(t); strongHits++; break; }
      }
    });
    const maxCos = topChunks.reduce((m, c) => Math.max(m, c.cos || 0), 0);

    // 白名單 fact 匹配
    const whitelistHits = matchWhitelist(question);

    // 極低信心：核心詞完全沒命中 → 拒答（但若命中白名單仍可答）
    const veryLowConfidence = (coreTerms.length > 0 && strongHits === 0);
    if (veryLowConfidence && whitelistHits.length === 0) {
      const kwList = coreTerms.length > 0 ? `「${coreTerms.slice(0, 5).join('」「')}」` : '這個';
      res.status(200).json({
        answer: `${kwList} 這個我在 14 本書裡都沒查到欸 QQ\n\n我只會回答書裡實際有寫的內容，書裡沒寫的我不敢亂編讓你跟客人講錯話 (¯﹃¯)\n\n建議你直接跟老闆或資深直播主確認一下，或者換個關鍵字再問我試試～`,
        sources: [],
        diagnostic: { reason: 'no_keyword_hit', coreTerms, maxCosine: maxCos, strongHits },
      });
      return;
    }

    // 【第 2 層】多書交叉驗證
    const numBooks = bookDiversity(topChunks);
    const singleBookWarning = numBooks <= 1;

    // 組 context
    let context = '';
    topChunks.forEach((c, i) => {
      const snippet = (c.text || '').slice(0, MAX_CHUNK_CHARS);
      const tag = (c.cos >= 0.35) ? '高相關' : (c.cos >= 0.25 ? '中相關' : '低相關');
      const qtag = c.quality < WARN_OCR_QUALITY ? ` ⚠️OCR品質偏低(${c.quality}/10)` : '';
      context += `\n[參考${i + 1}·${tag}${qtag}] 出自《${c.book}》p.${c.page}\n${snippet}\n`;
    });
    context += `\n[檢索診斷] 問題核心詞「${coreTerms.join('」「')}」中，真正命中的只有：${hitTerms.size === 0 ? '無' : Array.from(hitTerms).join('、')}。最高語意相似度：${maxCos.toFixed(3)}。參考資料來自 ${numBooks} 本書。${singleBookWarning ? '▲ 單書來源：只有 1 本書提到，請在回答開頭加「目前我只在 1 本書裡看到相關說法，僅供參考」警語。' : ''}`;

    // 【第 3 層】白名單 facts
    let whitelistBlock = '';
    if (whitelistHits.length > 0) {
      whitelistBlock = '\n\n===== 【第 3 層 常識事實校對表】=====\n' +
        '以下是【人工校對過的正確事實】。若上方參考資料有任何地方與此衝突，你「必須」以此為準，並在回答中明確指出書上寫錯（格式：「書裡寫 X，但實際上應該是 Y」）。\n\n';
      whitelistHits.forEach(({ name, fact }) => {
        whitelistBlock += `【${name}】\n`;
        for (const [k, v] of Object.entries(fact)) {
          if (k === 'aliases') continue;
          if (Array.isArray(v)) {
            whitelistBlock += `  ${k}: ${v.join('、')}\n`;
          } else {
            whitelistBlock += `  ${k}: ${v}\n`;
          }
        }
        whitelistBlock += '\n';
      });
      whitelistBlock += '===== 校對表結束 =====\n';
    }

    const systemPrompt =
      '你是「聚寶水晶 Precious Crystal」的 AI 水晶知識助理，名字叫「水晶小妹」。你只能根據公司內部的專業水晶/寶石/礦石/療癒文獻回答員工問題。\n' +
      '\n' +
      '===== 參考資料開始 =====\n' + context + '\n===== 參考資料結束 =====\n' +
      whitelistBlock +
      '\n' +
      '【【最重要的規則 —— 絕對不能編造】】\n' +
      'A. 你只能回答「參考資料」中實際寫到的內容。參考資料沒寫的東西，你絕對不能講，也不能從你的訓練記憶裡補。\n' +
      'B. 每段參考資料頭部都標了「高相關/中相關/低相關」。只有「高相關」跟「中相關」且內容直接提到問題關鍵字的段落才能當來源引用。「低相關」的段落即使找出來也不能當出處。\n' +
      'C. 若段落標記「⚠️OCR品質偏低」，代表書的 OCR 可能有錯字或胡言亂語，不可逐字照抄，只能提取明確合理的資訊。\n' +
      'D. 【如何判斷沒寫】看「檢索診斷」那行。如果問題核心詞完全沒命中任何參考資料，那就是書裡沒寫。\n' +
      'E. 【書裡沒寫時怎麼回】直接跟員工說「這個關鍵字在我知識庫的 14 本書裡都沒查到欸 QQ」或「書裡沒直接寫」，絕對不能編答案、也不能發明書名頁碼。\n' +
      'F. 【單書來源警告】若診斷顯示「單書來源」，必須在回答開頭加警語：「目前只在 1 本書裡看到，僅供參考」。\n' +
      'G. 【常識校對表最優先】若有提供「常識事實校對表」，當書上內容與校對表衝突時，以校對表為準，並在回答中指出書裡的錯誤（例如「書裡寫『紫水晶英文源自希臘文「深」』其實是錯的，正確應該是『不醉』(a-methystos)，這是 OCR 書本身的錯誤」）。\n' +
      '\n' +
      '【人設規則】\n' +
      '你跟員工講話就像在跟閨蜜聊天。\n' +
      '1. 用「你」不用「您」。不要「敬請」「煩請」「依據專業文獻」這種行政文。\n' +
      '2. 說人話。不要「根據參考資料」「建議您」這種開場，直接進正題。\n' +
      '3. 適度用顏文字：´･ω･`、(˘▾˘)、(¯﹃¯)、(*´ω`)、(＞ω＜)、ᕙ(⇀‸↼‶)ᕗ、QQ。一個回答 1-2 個就好。\n' +
      '4. OCR 文本可能有錯字，你懂意思就好。但錯字不等於可以編內容。\n' +
      '5. 【最關鍵】若有動用參考資料內容，結尾必須標「—— 出自《書名》p.頁碼」（只能寫參考資料中真正提供答案的那幾段的書名頁碼）。若書裡沒寫這個問題，不要強採出處。\n' +
      '6. 長問題 300-500 字、短問題 80-200 字。\n' +
      '7. 問題跟水晶/寶石/礦石/療癒無關，幽默婉拒：「這我沒讀過欸 XD」。\n' +
      '8. 繁體中文、台灣用語。';

    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + openaiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OPENAI_CHAT_MODEL,
        temperature: 0.3,
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
      sources: topChunks.map(c => ({ book: c.book, page: c.page, quality: c.quality })),
      diagnostic: {
        strongHits, maxCosine: maxCos, numBooks,
        whitelistUsed: whitelistHits.map(m => m.name),
        singleBookWarning,
      },
    });
  } catch (e) {
    res.status(500).json({ error: '伺服器內部錯誤：' + (e.message || '未知') });
  }
};
