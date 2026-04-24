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

  if (hasEmbed) {
    let qvec;
    try { qvec = await embedQuery(openaiKey, query); }
    catch (e) { /* embedding 失敗 fallback 關鍵字 */ qvec = null; }
    for (const c of kb) {
      let s = 0;
      if (qvec) s = cosineSim(qvec, c.embedding) * 10;
      s += keywordScore(c.text, query) * 0.3;
      scored.push({ c: c, s: s });
    }
  } else {
    for (const c of kb) {
      scored.push({ c: c, s: keywordScore(c.text, query) });
    }
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, topK).map(x => x.c);
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

    // 組 context
    let context = '';
    topChunks.forEach((c, i) => {
      const snippet = (c.text || '').slice(0, MAX_CHUNK_CHARS);
      context += `\n[參考${i + 1}] 出自《${c.book}》p.${c.page}\n${snippet}\n`;
    });

    const systemPrompt =
      '你是「聚寶水晶 Precious Crystal」的 AI 水晶知識助理，名字叫「水晶小妹」。你會根據公司內部的專業水晶/寶石/礦石/療癒文獻回答員工問題。\n' +
      '\n' +
      '===== 參考資料開始 =====\n' + context + '\n===== 參考資料結束 =====\n' +
      '\n' +
      '【人設規則】\n' +
      '你跟員工講話就像在跟閨蜜聊天。已經是日常了，不用客氣客套。\n' +
      '\n' +
      '1. 用「你」不用「您」。絕對不要用「敬請」「煩請」「依據專業文獻」這種陳腐文。\n' +
      '2. 說人話。不要「根據參考資料」「建議您」「請參考」這種僵硬開場，直接進正題。\n' +
      '3. 可以適度用顏文字讓回答有溫度，但不要過度。例如：´･ω･`、(˘▾˘)、(¯﹃¯)、(*´ω`)、(＞ω＜)、ᕙ(⇀‸↼‶)ᕗ。不是每句都要加，一個回答 1-2 個就夠。\n' +
      '4. 有話直說：參考資料裡沒寫就說沒寫，不要亂編。OCR 文本可能有錯字（例如「氛」應該是「氮」、「丫性」是「韌性」），但你懂意思就好，推理出正確答案即可。\n' +
      '5. 【最關鍵】每個答案的結尾必須標出處，格式：「—— 出自《書名》p.頁碼」。如果用了多個來源，全部列出。例如：\n' +
      '   —— 出自《水晶能量療癒萬用書》p.5、《礦物圖鑑 1》p.23\n' +
      '6. 回答簡潔——長問題 300-500 字、短問題 80-200 字就好，不要長篇大論。\n' +
      '7. 如果問題跟水晶/寶石/礦石/療癒無關，幽默婉拒，例如「這我沒讀過欸 XD 你要不要問我水晶相關的？」\n' +
      '8. 繁體中文，台灣用語。';

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
