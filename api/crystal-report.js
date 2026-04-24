// Vercel Serverless Function: /api/crystal-report
// 接收用戶「這答案不對」回報，寫入 Notion「水晶系統錯誤回報」資料庫。
//
// 環境變數：
//   NOTION_TOKEN              Notion Integration token
//   NOTION_CRYSTAL_REPORT_DB  回報資料庫 ID（若未設定則 fallback 寫到 NOTION_HR_PAGE_ID 當子頁面）
//   NOTION_HR_PAGE_ID         fallback 父頁面

const NOTION_VERSION = '2022-06-28';

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

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body
      : (req.body ? JSON.parse(req.body) : {});
    const question = (body.question || '').toString().slice(0, 1000);
    const answer = (body.answer || '').toString().slice(0, 5000);
    const reason = (body.reason || '').toString().slice(0, 500);
    const sources = Array.isArray(body.sources) ? body.sources : [];

    if (!question || !answer) {
      res.status(400).json({ error: '需要 question 與 answer' }); return;
    }

    const notionToken = process.env.NOTION_TOKEN;
    if (!notionToken) { res.status(500).json({ error: '伺服器未設定 NOTION_TOKEN' }); return; }

    const dbId = process.env.NOTION_CRYSTAL_REPORT_DB;
    const fallbackPage = process.env.NOTION_HR_PAGE_ID;

    const title = `[回報] ${question.slice(0, 60)}`;
    const now = new Date();
    const twTime = new Date(now.getTime() + 8 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16);

    const children = [
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '使用者問題' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: question } }] } },
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'AI 回答' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: answer } }] } },
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '回報原因' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: reason || '（未填寫）' } }] } },
      { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '引用來源' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: sources.length > 0 ? sources.map(s => `《${s.book}》p.${s.page}`).join('、') : '（無）' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `回報時間：${twTime} (UTC+8)` } }] } },
    ];

    let notionPayload;
    if (dbId) {
      notionPayload = {
        parent: { database_id: dbId },
        properties: {
          'Name': { title: [{ type: 'text', text: { content: title } }] },
        },
        children,
      };
    } else if (fallbackPage) {
      notionPayload = {
        parent: { page_id: fallbackPage },
        properties: {
          title: { title: [{ type: 'text', text: { content: title } }] },
        },
        children,
      };
    } else {
      res.status(500).json({ error: '未設定 NOTION_CRYSTAL_REPORT_DB 或 NOTION_HR_PAGE_ID' });
      return;
    }

    const r = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + notionToken,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notionPayload),
    });

    if (!r.ok) {
      const txt = await r.text();
      res.status(502).json({ error: 'Notion API 錯誤 (' + r.status + ')：' + txt.slice(0, 300) });
      return;
    }
    const d = await r.json();
    res.status(200).json({ ok: true, notion_url: d.url || null });
  } catch (e) {
    res.status(500).json({ error: '伺服器內部錯誤：' + (e.message || '未知') });
  }
};
