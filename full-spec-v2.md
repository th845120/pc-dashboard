# 聚寶水晶 品牌儀表板 — 完整設計規格

## 說明：這份文件的用途與使用方式

這份規格文件用於**從零重建「聚寶水晶品牌儀表板」網站**。當原始程式碼遺失、需要重新開發，或需要在新環境重現相同功能時，只要將此文件完整複製貼上給任何 AI（ChatGPT、Claude、Gemini 等），AI 即可根據規格重新撰寫全部程式碼。

**使用步驟：**
1. 將此文件完整複製
2. 貼上給你選擇的 AI，並告知「請根據以下規格重建網站」
3. 依照文末「AI 執行步驟」，提供 AI 要求的數據與素材
4. AI 會依序輸出 `index.html`、`style.css`、`app.js`、`playground.js`、`splash.js` 五個檔案
5. 將檔案放入 GitHub repo（`th845120/pc-dashboard`），啟用 GitHub Pages 即完成部署

> **注意**：文中標示 `⚠️ 需用戶提供` 的欄位，需在每次更新時由用戶提供最新數據。

---

## 一、網站基本資訊

| 項目 | 內容 |
|---|---|
| 網站名稱 | 聚寶水晶 品牌儀表板 |
| 自訂網域 | https://preciouscrystal.com.tw |
| GitHub Pages URL | https://th845120.github.io/pc-dashboard/ |
| GitHub Repo | th845120/pc-dashboard |
| 部署方式 | GitHub Pages（main branch），CNAME 指向自訂網域 |
| HTTPS | Let's Encrypt 自動簽發，`https_enforced=true` |
| 網站類型 | 靜態網站（HTML + CSS + JS） |
| SEO | `robots.txt` + `<meta name="robots" content="noindex, nofollow" />` 阻擋搜尋引擎收錄 |

### 檔案結構

```
pc-dashboard/
├── index.html        — 主頁面（Splash Screen + 4 個 tab-panel）
├── style.css         — 完整樣式（深色/淺色主題、所有元件）
├── app.js            — 主邏輯（圖表、篩選器、計數器動畫、游標光暈）
├── playground.js     — 里程碑頁（計數器卡片、粒子效果）
├── splash.js         — 開場星空動畫（銀河、流星、陀螺儀視差）
├── logo.png          — 品牌 logo 圖騰（⚠️ 需用戶提供）
├── brand-text.png    — 品牌字「聚寶水晶」（用戶設計的透明 PNG）
├── brand-logo-full.png — Splash Screen 用完整品牌圖（logo + 文字 + 英文）
├── CNAME             — 自訂網域設定：preciouscrystal.com.tw
└── robots.txt        — 阻擋搜尋引擎
```

### 外部依賴（CDN 引入）

- **Chart.js**（圖表）
- **D3.js v7**（里程碑頁圈圖、粒子效果）
- **Google Fonts**：`Noto Sans TC`（正文）+ `DM Serif Display`（標題裝飾）

---

## 二、設計規格 — Apple 風格

> **設計語言**：Apple.com/tw 風格 — 大量留白、沈浸式深底、Glassmorphism 導航、scroll-triggered 淡入動畫、卡片 20px 圓角、1px 細邊框。結合 LV / Gucci / Hermès 奢華質感，簡約時尚，低調優雅。

### 2.1 品牌主色

品牌主色：`#53406e`（深紫）

### 2.2 深色模式 CSS 變數（預設模式）

> **注意**：深色底色比舊版更深，營造 Apple 風格沈浸感。

```css
:root, [data-theme='dark'] {
  --color-primary:           #c4b5dc;
  --color-primary-hover:     #d8cceb;
  --color-primary-light:     #8a78a6;
  --color-primary-highlight: #3a2f50;
  --color-primary-subtle:    #322849;

  --color-bg:           #1a1128;   /* 深底，比舊版 #2e2344 更深 */
  --color-surface:      #231a35;
  --color-surface-2:    #2c2142;
  --color-surface-3:    #352a4e;
  --color-border:       #3d3058;
  --color-divider:      #352a4e;
  --color-text:         #f5f5f7;   /* Apple 經典文字白 */
  --color-text-muted:   #a1a1a6;   /* Apple 次要灰 */
  --color-text-faint:   #6e6e73;   /* Apple 提示灰 */

  --color-good:    #3dbf7a;
  --color-good-bg: rgba(61,191,122,0.12);
  --color-warn:    #e8a825;
  --color-warn-bg: rgba(232,168,37,0.12);
  --color-bad:     #e05555;
  --color-bad-bg:  rgba(224,85,85,0.12);
  --color-gold:    #d4b65c;

  --shadow-sm: 0 2px 8px rgba(0,0,0,0.25);
  --shadow-md: 0 4px 24px rgba(0,0,0,0.3);
  --shadow-lg: 0 12px 48px rgba(0,0,0,0.4);

  --radius-sm:   0.5rem;
  --radius-md:   0.75rem;
  --radius-lg:   1rem;
  --radius-xl:   1.25rem;
  --radius-full: 9999px;

  --font-body:    'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  --font-display: 'DM Serif Display', 'Noto Serif TC', Georgia, serif;
  --font-mono:    'SF Mono', ui-monospace, monospace;

  --text-xs:   0.75rem;
  --text-sm:   0.8125rem;
  --text-base: 0.9375rem;
  --text-lg:   1.0625rem;
  --text-xl:   1.375rem;
  --text-2xl:  1.75rem;
  --text-3xl:  2.5rem;
  --text-hero: 3.5rem;

  --transition:      220ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --transition-slow: 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### 2.3 淺色模式 CSS 變數

```css
[data-theme='light'] {
  --color-primary:           #53406e;
  --color-primary-hover:     #42325a;
  --color-primary-light:     #6b5a87;
  --color-primary-highlight: #f3f0f7;
  --color-primary-subtle:    #ebe6f2;

  --color-bg:      #f5f5f7;   /* Apple 經典淺灰底 */
  --color-surface: #ffffff;
  --color-surface-2: #f2f0f5;
  --color-surface-3: #ebe8f0;
  --color-border:  #d2d2d7;
  --color-divider: #e5e5ea;
  --color-text:    #1d1d1f;
  --color-text-muted: #86868b;
  --color-text-faint: #aeaeb2;

  --color-good: #2d6a4f;  --color-good-bg: #ecf5ef;
  --color-warn: #9a6b1e;  --color-warn-bg: #fdf6e9;
  --color-bad:  #a62626;  --color-bad-bg:  #fbeaea;
  --color-gold: #b8952e;

  --shadow-sm: 0 1px 4px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 20px rgba(0,0,0,0.08);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.1);
}
```

### 2.4 設計風格

- **強制深色模式為預設**（不依賴系統設定），支援日夜切換
- **Apple 風格**：
  - Glassmorphism 黏頂導航列（`backdrop-filter: saturate(180%) blur(20px)`）
  - 卡片圓角 `20px`，帶 `1px solid var(--color-border)` 細邊框
  - Section 間距 `64px`（手機 `40px`），大量留白
  - 頁面大標題 `clamp(2rem, 1.5rem + 2vw, 3rem)`，搭配 48px 品牌漸層 accent-line
  - 最大寬度 `1120px`，置中
- **Section 頂部裝飾**：每個 section 頂部加 2px 漸層線（品牌紫 → 透明）

### 2.5 Scroll-Triggered 淡入動畫

```css
.fade-in-up {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.fade-in-up.visible {
  opacity: 1;
  transform: translateY(0);
}
```

使用 `IntersectionObserver` 觸發：
```javascript
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
```

所有 `.section`、`.kpi-card`、`.chart-card`、`.action-item` 預設加上 `fade-in-up` class。

### 2.6 CSS 全站強制規則

```css
/* 防止中文奇怪斷行 — 套用於 body 與所有主要文字元素 */
body { word-break: keep-all; overflow-wrap: break-word; }
h1, h2, h3, h4, h5, h6, p, li, td, th, span, div, label, a {
  word-break: keep-all;
  overflow-wrap: break-word;
}
```

- 圖表百分比 Y 軸標籤：使用 `toFixed(2)` 顯示小數點後兩位
- 行動建議文字結尾**必須加句號**
- **KPI 數值 `white-space: nowrap`**：防止大數字換行（如 142,363 不得在逗號處折行）

### 2.7 特效規格

#### 游標光暈
- `fixed` 定位，220×220px 圓形 `div`
- 背景：`radial-gradient(circle, rgba(196,181,220,0.08) 0%, transparent 70%)`
- `pointer-events: none`；`mix-blend-mode: screen`
- 跟隨滑鼠移動（JS 監聽 `mousemove`）
- **手機版停用**：偵測觸控裝置時完全隱藏游標光暈元素

#### 日夜切換按鈕光暈
- `theme-toggle` 按鈕的 `::before` 偽元素
- **深色模式**：冷色月光（品牌紫色系 `rgba(196,181,220,0.15)`）
- **淺色模式**：暖色陽光（橙黃色系 `rgba(255,200,50,0.12)`）
- `hover` 時光暈自然放大

---

## 二之二、Splash Screen（開場星空動畫）

### 結構
- 全螢幕 Canvas 粒子動畫 + 品牌 Logo Overlay
- 顯示 `brand-logo-full.png`（完整品牌圖）+ 標語「買得到寶藏，也買得到保障。」+ 提示「點擊任意處進入」
- 點擊後 fade-out 過場，顯示主 App

### ⚠️ Splash Logo 強制白色

**關鍵規則**：Splash Screen 的品牌圖（`.splash-brand-img`）必須透過 CSS filter 強制為白色：
```css
.splash-brand-img {
  filter: brightness(0) invert(1) drop-shadow(0 4px 20px rgba(255,255,255,0.15));
}
```
> 品牌圖原始檔案可能是紫色或彩色，Splash 背景為深黑色（`#0a0618`），若不加 filter 會看不清楚。

### 星空動畫（splash.js）
- **三層星星**：400 顆小星（0.3-1.1px）、150 顆中星（0.8-2.0px，60% 閃爍）、35 顆大星（1.5-3.0px，全部閃爍，40% 有十字光芒）
- **銀河帶**：預渲染離屏 Canvas，斜角 25° 漸層，4 層疊加（漫射光、核心亮帶、核心高光、12 個星雲結 + 500 顆星塵）
- **浮動星雲**：5 個漸層圓形，緩慢漂移 + 脈動
- **星座連線**：大星間距 < 90px 繪製半透明連線
- **流星**：每 150 幀 60% 機率生成，最多同時 2 顆
- **滑鼠互動**：滑鼠靠近 100px 內星星被排斥散開

### 手機陀螺儀視差
- 使用 `DeviceOrientation` API
- Android / 舊 iOS 直接監聽（頁面載入時即加上 listener）
- gamma（左右傾斜）控制水平偏移、beta（前後傾斜）控制垂直偏移
- 最大偏移 18px，傾斜範圍 ±45° 歸一化
- **多層視差深度**：銀河帶 0.5x、星雲 0.4x、小星 0.3x、中星 0.7x、大星 1.2x
- 平滑插值 lerp 因子 0.06
- 僅觸控裝置啟用，桌面版 gyro offset 維持 0

### ⚠️ iOS 陀螺儀權限修復（關鍵）

iOS 13+ 需要在使用者手勢（click）中呼叫 `DeviceOrientationEvent.requestPermission()`。

**核心問題**：Splash Screen 的點擊事件同時觸發「請求權限」和「關閉 Splash」，導致 Splash 在使用者回應權限對話框之前就消失了。

**解決方案**：
1. 偵測 `needsIOSGyroPermission` 旗標（`isTouch && typeof DeviceOrientationEvent.requestPermission === 'function'`）
2. **第一次點擊**：呼叫 `requestPermission()` 並等待 Promise 完成
3. Promise resolve 後才呼叫 `dismissSplash()`（無論 granted 或 denied）
4. 失敗時重設 `gyroPermissionRequested = false` 允許重試
5. **非 iOS 或已請求過**：直接 `dismissSplash()`

```javascript
// iOS 13+ 陀螺儀權限 — 必須先 requestPermission 再 dismiss
splash.addEventListener('click', function() {
  if (needsIOSGyroPermission && !gyroPermissionRequested) {
    gyroPermissionRequested = true;
    DeviceOrientationEvent.requestPermission().then(function(state) {
      if (state === 'granted') addGyroListener();
      dismissSplash();
    }).catch(function() {
      gyroPermissionRequested = false;
      dismissSplash();
    });
  } else {
    dismissSplash();
  }
});
```

### 品牌 Logo 點擊返回
- 主 App 中左上角品牌 Logo（`#brandHomeLink`）點擊可返回 Splash Screen
- 重新初始化星場 + 啟動動畫

### 員工星星標註（Employee Stars）

在星空中隨機放置 6 顆命名星星，代表公司員工。每顆星星都有名字標註，但在職與離職員工的視覺表現不同。**位置每次載入都隨機生成**，不是固定座標。

**設計參考**：星空遊戲「夜姬-DC3」的文字標註方式 + 「文妃/櫻貴妃（日本）」的旋轉圓環效果。

#### 在職員工（明亮模式）

姓名：靚潔、Jerry、阿嬤、郁芩

- 星星大小：`r = 2.8`，基礎不透明度 `0.95`
- 閃爍：`twinkleSpeed = 0.035`，`twinkleMin = 0.6`
- **4 射光芒**（`hasCross: true`）：十字 + 斜對角射線，帶徑向漸層效果
- **旋轉圓環**：`orbitRadius = r * 6`，日牉式部分弧形（約 200°），每幀旋轉 `0.015 rad`
- **名字標註**：13px、font-weight 500、明亮藤色 `rgba(215,210,240, eOp*0.9)`，帶淡紫陰影
- 不受滑鼠排斥效果影響

#### 離職員工（淡化模式）

姓名：佩瑾、珍妮

- 星星大小：`r = 2.8`（與在職相同），基礎不透明度 `0.85`
- 閃爍：`twinkleSpeed = 0.01`，`twinkleMin = 0.78`（範圍很窄，最暗時也清晰可見）
- **無光芒**（`hasCross: false`）、**無圓環**
- **名字標註**：12px、font-weight 400、同色但較淡 `rgba(215,210,240, eOp*0.7)`，無陰影

#### 位置規則 — 隨機分配
- **每次載入時隨機生成位置**，不是固定座標
- 避開中央 Logo 區域（比例 X: 0.28–0.72、Y: 0.20–0.70）
- 邊緣留白 `margin = 0.06`
- 員工星星之間最小距離 `minDist = 0.18`（比例座標的歐氏距離），避免重疊
- 使用 `randomizeEmployeePositions()` 函數，在 `initField()` 時呼叫
- `resize` 時會重新 `initField()` 並重新隨機分配位置
- 不受滑鼠排斥效果影響（`if (!s.isEmployee)` guard）

---

## 三、Header 與分頁導航

### Glassmorphism 黏頂 Header

```css
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: transparent;
  transition: background 0.3s ease, backdrop-filter 0.3s ease;
}
.header.scrolled {
  background: rgba(26, 17, 40, 0.72);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 0.5px solid rgba(61, 48, 88, 0.6);
}
[data-theme='light'] .header.scrolled {
  background: rgba(245, 245, 247, 0.72);
  border-bottom: 0.5px solid rgba(210, 210, 215, 0.6);
}
```

JS 監聽 scroll 事件，滾動超過 10px 時加上 `.scrolled` class。

### Header 結構
- 左側：`logo.png`（品牌圖騰，32×32px）+ `brand-text.png`（品牌字「聚寶水晶」，高度桌面 20px / 手機 16px）
- 右上：最後更新時間 badge（pill 樣式，`YYYY-MM-DD HH:MM (UTC+8)`）+ 日夜切換按鈕

### Pill-Style 分頁按鈕（4 個分頁）

| Tab index | 分頁名稱 |
|---|---|
| 0 | 品牌輿情 |
| 1 | 銷售數據 |
| 2 | 客服數據 |
| 3 | 里程碑 |

```css
.tab-btn {
  padding: 8px 20px;
  border-radius: 9999px;  /* pill shape */
  font-size: var(--text-sm);
  font-weight: 500;
  border: 1px solid transparent;
}
.tab-btn.active {
  background: var(--color-primary-highlight);
  border-color: rgba(196,181,220,0.2);
}
```

---

## 四、分頁 1：品牌輿情

### 4.1 蝦皮拍賣 KPI 卡片

| 欄位 | 數值 | 說明 |
|---|---|---|
| 整體評分 | `{shopee_rating}` ⚠️ 需用戶提供 | 滿分 5.00 |
| 好評率 | `{shopee_positive_rate}`% ⚠️ 需用戶提供 | 計算：rating_good ÷ (rating_good + rating_normal + rating_bad) |
| 蝦皮粉絲 | `{shopee_fans}` ⚠️ 需用戶提供 | — |
| 商品數 | `{shopee_products}` ⚠️ 需用戶提供 | — |
| 回覆率 | `{shopee_reply_rate}`% ⚠️ 需用戶提供 | — |

**數據來源 API（即時）：**
```
https://shopee.tw/api/v4/shop/get_shop_detail?username=opcrystal888
```

#### 蝦皮評價分布圖表

- **Doughnut chart**：好評 `{good_count}` ⚠️ / 普通 `{normal_count}` ⚠️ / 差評 `{bad_count}` ⚠️
- **Bar chart**：評價總量，Y 軸使用 log scale

### 4.2 Meta（Facebook）KPI 卡片

| 欄位 | 數值 |
|---|---|
| 粉絲數 | `{fb_fans}` ⚠️ 需用戶提供 |
| 推薦率 | `{fb_recommend_rate}`%（`{fb_reviews}` 則評論）⚠️ 需用戶提供 |
| 近期互動 | `{fb_engagement}`（讚 + 留言 + 分享）⚠️ 需用戶提供 |

### 4.3 Instagram KPI 卡片

| 欄位 | 數值 |
|---|---|
| 粉絲數 | `{ig_fans}` ⚠️ 需用戶提供 |
| 貼文數 | `{ig_posts}` ⚠️ 需用戶提供 |
| 追蹤中 | `{ig_following}` ⚠️ 需用戶提供 |

### 4.4 Google Business Profile KPI 卡片

| 欄位 | 數值 |
|---|---|
| 評分 | `{google_rating}` / 5 ⚠️ 需用戶提供 |
| 評論數 | `{google_reviews}` 則 ⚠️ 需用戶提供 |
| 商家地址 | 板橋區華江一路550號（固定） |

### 4.5 Google 最新評論

- **只顯示客人評論，不附老闆回應**
- 只保留最新 5 則
- 格式：`作者名 / 星數 / 日期 / 評論文字`
- 全部內容 ⚠️ 需用戶提供

### 4.6 品牌輿情行動建議（3 則）

> 格式：優先級標籤（優先 / 中等 / 持續）＋ 標題 ＋ 描述（結尾加句號）

1. **優先 — 加強 Dcard 能見度**
   考慮在 Dcard 水晶板投稿開箱文或與 KOL 合作，目前競品推薦文未收錄聚寶水晶。

2. **中等 — 優化蝦皮搜尋關鍵字**
   商品標題可加入更多搜尋關鍵字，提升站內與 Google 自然流量。

3. **持續 — 維持高好評率**
   目前 `{shopee_positive_rate}`% 好評率表現優異，建議持續追蹤並維持快速回覆。

---

## 五、分頁 2：客服數據

### 5.1 KPI 卡片（4 格，`service-kpi-4` grid）

| 欄位 | 數值 | 備註 |
|---|---|---|
| 未回覆聊聊 | `{latest_unreplied}` 筆 ⚠️ | + MoM 變化 |
| 詢問率 | `{latest_inquiry_rate}`% ⚠️ | + MoM 變化 |
| 回覆至下單轉化率 | `{latest_chat_cvr}`% ⚠️ | + MoM 變化 |
| 聊聊平均客單價 | NT$`{latest_chat_aov}` ⚠️ | + MoM 變化 |

> **重要計算公式**：聊聊平均客單價 = 銷售額 ÷ 訂單數（**不是** ÷ 買家數）

### 5.2 MoM 顯示規則

- 百分比變化（粉絲增長例外，用絕對差值）
- 上升：綠色 `#3dbf7a`，前綴 `▲`
- 下降：紅色 `#e05555`，前綴 `▼`

### 5.3 歷史趨勢圖表（4 張，2×2 grid）

每張圖表搭配年月篩選器（Popover Picker，規格見第七節）。

| 圖表 | 類型 | 特殊樣式 |
|---|---|---|
| 未回覆聊聊 | Bar chart | >100 紅色；>50 黃色；其餘品牌紫；最後一筆紅色 |
| 詢問率 | Line chart | — |
| 回覆至下單轉化率 | Line chart | — |
| 聊聊營業額 | Bar chart | — |

### 5.4 月份對比明細表格

帶年月篩選器，欄位：月份、未回覆、詢問率、轉化率、營業額、客單價

### 5.5 聊聊歷史數據（硬編碼，共 16 個月）

```javascript
const ALL_MONTHS        = ['202412','202501','202502','202503','202504','202505','202506','202507','202508','202509','202510','202511','202512','202601','202602','202603'];
const CHAT_UNREPLIED    = [25, 24, 33, 27, 63, 43, 48, 28, 9, 13, 65, 86, 23, 26, 57, 33];
const CHAT_INQUIRY_RATE = [0.74, 0.24, 0.28, 0.34, 0.21, 0.19, 0.23, 0.17, 0.16, 0.17, 0.18, 0.16, 0.13, 0.13, 0.10, 0.15];
const CHAT_CVR          = [12.75, 12.74, 14.90, 15.18, 22.83, 17.68, 19.22, 19.88, 19.01, 14.17, 17.40, 13.25, 16.56, 21.74, 26.62, 16.56];
const CHAT_REVENUE      = [170188, 109791, 250833, 235624, 217444, 366068, 439750, 462293, 393235, 254487, 263654, 296604, 222605, 311334, 524550, 267428];
const CHAT_AOV          = [3418, 2240, 3216, 2772, 2111, 3936, 2819, 3640, 3818, 3856, 3296, 5816, 3649, 4448, 5194, 4313];
```

### 5.6 聊聊表格數據（硬編碼）

```javascript
const CHAT_TABLE = [
  { month:'202412', unreplied:25,  inquiryRate:'0.74%', cvr:'12.75%', revenue:'NT$170,188', aov:'NT$3,418' },
  { month:'202501', unreplied:24,  inquiryRate:'0.24%', cvr:'12.74%', revenue:'NT$109,791', aov:'NT$2,240' },
  { month:'202502', unreplied:33,  inquiryRate:'0.28%', cvr:'14.90%', revenue:'NT$250,833', aov:'NT$3,216' },
  { month:'202503', unreplied:27,  inquiryRate:'0.34%', cvr:'15.18%', revenue:'NT$235,624', aov:'NT$2,772' },
  { month:'202504', unreplied:63,  inquiryRate:'0.21%', cvr:'22.83%', revenue:'NT$217,444', aov:'NT$2,111' },
  { month:'202505', unreplied:43,  inquiryRate:'0.19%', cvr:'17.68%', revenue:'NT$366,068', aov:'NT$3,936' },
  { month:'202506', unreplied:48,  inquiryRate:'0.23%', cvr:'19.22%', revenue:'NT$439,750', aov:'NT$2,819' },
  { month:'202507', unreplied:28,  inquiryRate:'0.17%', cvr:'19.88%', revenue:'NT$462,293', aov:'NT$3,640' },
  { month:'202508', unreplied:9,   inquiryRate:'0.16%', cvr:'19.01%', revenue:'NT$393,235', aov:'NT$3,818' },
  { month:'202509', unreplied:13,  inquiryRate:'0.17%', cvr:'14.17%', revenue:'NT$254,487', aov:'NT$3,856' },
  { month:'202510', unreplied:65,  inquiryRate:'0.18%', cvr:'17.40%', revenue:'NT$263,654', aov:'NT$3,296' },
  { month:'202511', unreplied:86,  inquiryRate:'0.16%', cvr:'13.25%', revenue:'NT$296,604', aov:'NT$5,816' },
  { month:'202512', unreplied:23,  inquiryRate:'0.13%', cvr:'16.56%', revenue:'NT$222,605', aov:'NT$3,649' },
  { month:'202601', unreplied:26,  inquiryRate:'0.13%', cvr:'21.74%', revenue:'NT$311,334', aov:'NT$4,448' },
  { month:'202602', unreplied:57,  inquiryRate:'0.10%', cvr:'26.62%', revenue:'NT$524,550', aov:'NT$5,194' },
  { month:'202603', unreplied:33,  inquiryRate:'0.15%', cvr:'16.56%', revenue:'NT$267,428', aov:'NT$4,313', isLatest:true },
];
```

### 5.7 客服數據行動建議（3 則）

1. **優先 — 降低未回覆聊聊數量**
   目前 33 筆未回覆聊聊，雖較上月已改善 42%，仍建議設定自動回覆或固定回覆時段，持續壓低至 20 筆以下，避免影響買家體驗與蝦皮搜尋排名。

2. **中等 — 提升回覆至下單轉化率**
   目前轉化率 16.56%，歷史高峰曾達 26.62%（202602）。可優化回覆話術、提供個人化商品推薦及限時優惠，拉升聊聊下單比例。

3. **持續 — 維持聊聊滿意度**
   目前滿意度 99.38%，表現優異。建議持續維持專業、親切的回覆品質，穩定高滿意度水準。

---

## 六、分頁 3：銷售數據

### 6.1 本月總覽 KPI（3 格，`sales-kpi-3` grid）

| 欄位 | 數值 | 計算公式 |
|---|---|---|
| 淨營業額 | NT$`{net_revenue}` ⚠️ | **可出貨訂單銷售額 − 不成立訂單銷售額 − 退貨/退款銷售額** |
| 可出貨訂單 | `{shippable_orders}` 筆 ⚠️ | — |
| 平均客單價 | NT$`{avg_order_value}` ⚠️ | — |

三格皆顯示 MoM 變化。

### 6.2 訂單明細 KPI（2 格，`sales-kpi-2` grid）

| 欄位 | 數值 |
|---|---|
| 不成立訂單 | `{invalid_orders}` 筆 / NT$`{invalid_amount}` ⚠️ + MoM |
| 退貨/退款 | `{return_orders}` 筆 / NT$`{return_amount}` ⚠️ + MoM |

### 6.3 買家結構 KPI（3 格）

| 欄位 | 數值 |
|---|---|
| 買家數 | `{buyer_count}` 人 ⚠️ + MoM |
| 新客 | `{new_buyers}` 人 ⚠️ + MoM |
| 複購率 | `{repurchase_rate}`% ⚠️ + MoM |

### 6.4 其他 KPI

| 欄位 | 數值 | MoM 規則 |
|---|---|---|
| 蝦皮粉絲增長 | `{fans_growth}` ⚠️ | 用**絕對差值**（非百分比）|
| 行動銷售額佔比 | `{mobile_sales_pct}`% ⚠️ | 百分比變化 |

### 6.5 歷史趨勢圖表（5 張）

每張搭配年月篩選器（Popover Picker）。

| 圖表 | 類型 | 特殊說明 |
|---|---|---|
| 蝦皮粉絲增長 | Bar chart | 負值顯示紅色 |
| 新客增長 | Bar chart | — |
| 複購率 | Line chart | — |
| 訂單轉換率 | Line chart | Y 軸使用 `toFixed(2)` |
| 平均客單價 | Line chart | — |

### 6.6 銷售歷史數據（硬編碼，共 16 個月）

```javascript
const ALL_MONTHS     = ['202412','202501','202502','202503','202504','202505','202506','202507','202508','202509','202510','202511','202512','202601','202602','202603'];
const ALL_FANS       = [4733, 6214, 2310, 749, 1600, 9610, 3979, 3237, 3139, 1845, 685, 2038, 2673, 2215, 4712, -253];
const ALL_NEWBUYER   = [139, 153, 229, 189, 193, 213, 248, 159, 150, 122, 129, 113, 84, 95, 98, 87];
const ALL_REPURCHASE = [11.48, 12.55, 14.70, 21.71, 21.72, 20.73, 28.38, 28.76, 25.71, 16.03, 23.81, 18.95, 24.54, 22.43, 34.07, 29.53];
const ALL_CVR        = [0.52, 0.54, 0.71, 1.01, 1.04, 0.72, 0.52, 0.50, 0.58, 0.40, 0.33, 0.44, 0.42, 0.47, 0.65, 0.44];
const ALL_AOV        = [3173, 3351, 3869, 3896, 3962, 4312, 4930, 8135, 5597, 3994, 4909, 5280, 5209, 5904, 4041, 3837];
```

### 6.7 銷售表格數據（硬編碼）

```javascript
const SALES_TABLE = [
  { month:'202412', fans:4733,  newbuyer:139, repurchase:'11.48%', cvr:'0.52%', aov:'NT$3,173', mBounce:'22.82%', pcBounce:'74.21%' },
  { month:'202501', fans:6214,  newbuyer:153, repurchase:'12.55%', cvr:'0.54%', aov:'NT$3,351', mBounce:'22.09%', pcBounce:'74.63%' },
  { month:'202502', fans:2310,  newbuyer:229, repurchase:'14.70%', cvr:'0.71%', aov:'NT$3,869', mBounce:'21.61%', pcBounce:'72.75%' },
  { month:'202503', fans:749,   newbuyer:189, repurchase:'21.71%', cvr:'1.01%', aov:'NT$3,896', mBounce:'20.36%', pcBounce:'68.28%' },
  { month:'202504', fans:1600,  newbuyer:193, repurchase:'21.72%', cvr:'1.04%', aov:'NT$3,962', mBounce:'16.35%', pcBounce:'69.84%' },
  { month:'202505', fans:9610,  newbuyer:213, repurchase:'20.73%', cvr:'0.72%', aov:'NT$4,312', mBounce:'19.37%', pcBounce:'63.67%' },
  { month:'202506', fans:3979,  newbuyer:248, repurchase:'28.38%', cvr:'0.52%', aov:'NT$4,930', mBounce:'19.25%', pcBounce:'62.75%' },
  { month:'202507', fans:3237,  newbuyer:159, repurchase:'28.76%', cvr:'0.50%', aov:'NT$8,135', mBounce:'18.70%', pcBounce:'63.84%' },
  { month:'202508', fans:3139,  newbuyer:150, repurchase:'25.71%', cvr:'0.58%', aov:'NT$5,597', mBounce:'21.60%', pcBounce:'61.96%' },
  { month:'202509', fans:1845,  newbuyer:122, repurchase:'16.03%', cvr:'0.40%', aov:'NT$3,994', mBounce:'26.93%', pcBounce:'72.65%' },
  { month:'202510', fans:685,   newbuyer:129, repurchase:'23.81%', cvr:'0.33%', aov:'NT$4,909', mBounce:'29.60%', pcBounce:'72.81%' },
  { month:'202511', fans:2038,  newbuyer:113, repurchase:'18.95%', cvr:'0.44%', aov:'NT$5,280', mBounce:'27.23%', pcBounce:'67.65%' },
  { month:'202512', fans:2673,  newbuyer:84,  repurchase:'24.54%', cvr:'0.42%', aov:'NT$5,209', mBounce:'26.84%', pcBounce:'66.45%' },
  { month:'202601', fans:2215,  newbuyer:95,  repurchase:'22.43%', cvr:'0.47%', aov:'NT$5,904', mBounce:'26.71%', pcBounce:'72.03%' },
  { month:'202602', fans:4712,  newbuyer:98,  repurchase:'34.07%', cvr:'0.65%', aov:'NT$4,041', mBounce:'26.16%', pcBounce:'－' },
  { month:'202603', fans:-253,  newbuyer:87,  repurchase:'29.53%', cvr:'0.44%', aov:'NT$3,837', mBounce:'26.92%', pcBounce:'73.80%', isLatest:true },
];
```

### 6.8 蝦皮歷史年度營業額（硬編碼）

用於年度折線圖 + 同比季度分析，月份索引 0 = 1 月、11 = 12 月。

```javascript
const YEARLY_REVENUE = {
  2024: [null, null, 839114, 419141, 1163383, 1168206, 1398145, 1279539, 417360, 709423, 723213, 785941],
  2025: [699028, 1140141, 1033369, 1085720, 1299852, 1843769, 2152000, 1342820, 789236, 1024300, 1025103, 705297],
  2026: [971098, 1562399, 782417, null, null, null, null, null, null, null, null, null]
};
```

**年度顏色：**
- 2024：黃色 `#e8a825`
- 2025：綠色 `#3dbf7a`
- 2026：品牌紫 `#c4b5dc`

**圖表功能：**
- 年度 checkbox 切換顯示哪年（可多選）
- 同比季度分析下拉選單（Q1 / Q2 / Q3 / Q4）

### 6.9 年度表現數據（硬編碼）

```javascript
const YEARLY_PERFORMANCE = [
  {
    year: 2024,
    revenue: 22889003,
    orders: 5068,
    cvr: 0.48,
    avgOrder: 4516.38,
    invalidOrders: 506,
    invalidAmount: 1768094,
    returnOrders: 46,
    returnRate: 0.91
  },
  {
    year: 2025,
    revenue: 30933808,
    orders: 11366,
    cvr: 0.44,
    avgOrder: 2721.61,
    invalidOrders: 678,
    invalidAmount: 2372539,
    returnOrders: 73,
    returnRate: 0.64
  }
];
```

**YoY 顯示規則：**
- YoY 數字以 `<br>` 換行顯示在主數字下方
- 變好 → 綠色（class: `up`）；變差 → 紅色（class: `down`）
- `invertColor` 邏輯：退貨率、不成立訂單數 → **減少是好事**，顏色邏輯反轉

### 6.10 年度營業額明細表格間距

> **關鍵**：年度營業額明細表格（revenue history table）與上方 YoY 分析 section 之間，必須加上 `margin-top: 48px` 間距，避免視覺擁擠。

### 6.11 銷售數據行動建議（5 則）

> 此分頁行動建議共 5 則（其餘分頁 3-4 則）。

1. **優先 — 恢復粉絲增長動能，止血負成長**
   3 月粉絲流失 253 人，較上月 +4,712 人大幅衰退。建議檢視蝦皮廣告投放是否中斷或預算縮減，並搭配直播活動與社群互動（抽獎、限時優惠）重新拉回粉絲關注。歷史高峰曾達 +9,610 人（202505），目前原因需緊急排查。

2. **優先 — 拉高訂單轉換率，目前僅 0.44%**
   轉換率從上月 0.65% 下降至 0.44%，歷史高峰為 1.04%（202504）。建議優化商品詳情頁資訊豐富度、加強購買誘因（限時折扣、滾動滴砂），並針對高跳出率的電腦版（73.80%）優化頁面體驗與視覺引導。

3. **中等 — 降低不成立訂單比例**
   3 月不成立 40 筆（NT$120,747）+ 退貨 5 筆（NT$67,674），合計 NT$188,421 損失，佔總營業額 19.4%。年度趨勢也顯示 2025 年不成立單量較 2024 年增加 34%。建議分析不成立主因（未付款、取消、地址問題），針對性改善付款提醒與訂單確認流程。

4. **中等 — 提升新客獲取與回購穩定性**
   新客 87 人較上月 98 人下降 11%，複購率 29.53% 也從上月 34.07% 回落。可探索首購優惠券吸引新客，同時運用會員專屬折扣、回購提醒、新品優先通知等手段穩住熟客回購。歷史複購高峰達 34.07%（202602），證明客群有回購潛力。

5. **持續 — 維持營業額成長動能**
   2026 Q1 營業額 NT$3,315,914，同比 2025 Q1 成長 15.43%，年度營業額從 2024 年 NT$22.9M 成長至 2025 年 NT$30.9M（+35.1%）。但平均客單價從 NT$4,516 降至 NT$2,721（−39.7%），營收成長主要靠訂單量放大。建議在維持單量的同時，透過組合優惠、高單價商品推薦拉回客單價。

---

## 七、共用元件：Popover 年月篩選器

此元件在客服數據、銷售數據兩個分頁中使用，各分頁的圖表與表格各有獨立實例（共 4 個）。

### 7.1 版面結構

```
┌──────────────────────────────────────────┐
│  左側：快捷按鈕                              │
│  ─────────────                            │
│  全部                                      │
│  近 1 個月                                  │
│  近 3 個月                                  │
│  近 6 個月                                  │
│  近 12 個月                                 │
│  Q1 / Q2 / Q3 / Q4                        │
│  自訂範圍                                   │
│──────────────────────────────────────────│
│  右側：動態區域                              │
│  （顯示目前篩選摘要 或 自訂步驟互動區）          │
│──────────────────────────────────────────│
│  底部：已選範圍 label                        │
└──────────────────────────────────────────┘
```

### 7.2 行為規則

- 點擊快捷按鈕 → 套用篩選 → popover **自動關閉**
- 點擊「自訂範圍」→ 進入 4 步驟引導：
  1. 選擇起始年
  2. 選擇起始月
  3. 選擇結束年
  4. 選擇結束月
- 重新打開 popover 時：
  - 清除所有 active 狀態
  - 重置自訂步驟回第 1 步
  - 右側顯示目前篩選範圍摘要

---

## 八、分頁 4：里程碑

> 前身為「互動實驗室」，已簡化為里程碑展示頁。

### 8.1 動態數字總覽（3 格 counter grid）

- 動畫：ease-out cubic，持續 2 秒
- 數字從 0 滾動到目標值

| 指標 | 數值（硬編碼） |
|---|---|
| 累計營業額 | NT$61,181,971 |
| 累計訂單數 | 26,269 筆 |
| 粉絲總數 | 162,750 人 |

### ⚠️ 里程碑計數器文字溢出與動畫漂移修正

**問題 1：數字截斷**
- 卡片不可使用 `overflow: hidden`，否則大數字（如 `NT$61,181,971`）在小螢幕上會被截斷
- 使用 JS 自動縮放（`calcFitSize`）：動畫開始前，先用隱藏 `<span>` 測量最終數字寬度，若超過卡片可用寬度，逐步縮小字號至合適大小

**問題 2：動畫漂移**
- 計數器動畫期間數字會靠右偏移，是因為動畫中段的數字位數不同導致寬度變化
- **解法**：在動畫開始**之前**就用 `calcFitSize()` 計算最終值的字號，固定 `fontSize` 後再啟動動畫。動畫過程中字號不變，只有數字內容在變。

```javascript
function calcFitSize(el, text) {
  var card = el.closest('.pg-counter-card');
  if (!card) return 44;
  var cardW = card.clientWidth - 48;
  var span = document.createElement('span');
  span.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-weight:700;font-variant-numeric:tabular-nums;';
  span.textContent = text;
  document.body.appendChild(span);
  var size = 44;
  span.style.fontSize = size + 'px';
  while (span.scrollWidth > cardW && size > 14) {
    size -= 1;
    span.style.fontSize = size + 'px';
  }
  document.body.removeChild(span);
  return size;
}

// 使用方式：在動畫啟動前
var finalText = prefix + target.toLocaleString('en-US') + suffix;
var fitSize = calcFitSize(el, finalText);
el.style.fontSize = fitSize + 'px';  // 固定字號
// 然後才啟動 requestAnimationFrame 動畫
```

- `window.addEventListener('resize', ...)` 時也需重新計算字號

### 8.2 里程碑訊息（Pin/Unpin 互動）

每張 counter 卡片都有一則專屬溫馨訊息，顯示於卡片區域下方的 `pg-milestone-area`。

**互動邏輯：**
- **桌面版**：hover 卡片 → 顯示對應訊息；hover 移開 → 若無 pin 則恢復預設文字
- **手機版**：點擊卡片 → 顯示對應訊息（因無 hover）
- **Pin/Unpin**：點擊卡片 → 鎖定該訊息（`pinnedMsg`）；再次點擊同一張卡片 → 解鎖，恢復預設
- 預設提示文字：「💎 點擊上方卡片，查看里程碑故事」（手機）或「💎 將游標移到卡片上方，查看里程碑故事」（桌面）

### 8.3 Canvas 粒子流動背景

- 粒子數量：80 顆
- 滑鼠**排斥**效果（滑鼠靠近時粒子向外散開）
- 粒子間距 < 100px 時繪製連線

---

## 九、需要用戶提供的報表與數據

### 9.1 每月例行更新（5 份蝦皮後台報表）

| 報表名稱 | 蝦皮下載檔名 | 提取欄位 |
|---|---|---|
| 商店數據 | `shop-stats` | 粉絲增長 |
| 商品概況 | `productoverview` | 商品數 |
| 銷售組成 | `sales_composition` | 使用「可出貨訂單」工作表：訂單數、買家數、新買家數、銷售額、客單價；不成立訂單數量與金額；退貨/退款數量與金額；複購率、轉換率 |
| 流量概況 | `traffic_overview` | 手機跳出率、電腦跳出率、行動銷售額佔比 |
| 聊聊報表 | `chat` | 未回覆聊聊數、詢問率、回覆至下單轉化率、聊聊營業額、聊聊客單價（= 銷售額 ÷ 訂單數） |

### 9.2 品牌輿情即時數據（每月手動搜尋）

IG、Facebook、Google **沒有可接 API**，須直接上官方頁面查詢：

| 來源 | 需抓取欄位 |
|---|---|
| Instagram | 粉絲數、貼文數、追蹤中人數 |
| Facebook | 粉絲數、推薦率、評論數、近期互動數（讚 + 留言 + 分享） |
| Google Business Profile | 評分、評論數 |
| Google 最新評論 | 最新 5 則客人評論（作者名、星數、日期、評論文字） |

蝦皮數據使用公開 API 即時拉取：
```
https://shopee.tw/api/v4/shop/get_shop_detail?username=opcrystal888
```

### 9.3 其他素材

| 素材 | 說明 |
|---|---|
| `logo.png` | 品牌 logo 圖騰，放置於 repo 根目錄 |
| `brand-text.png` | 品牌字「聚寶水晶」透明 PNG（用戶設計），header 用 |
| `brand-logo-full.png` | Splash Screen 完整品牌圖（logo + 中文 + 英文） |

---

## 十、AI 執行步驟

收到此提示詞後，AI 應依照以下順序執行：

### 步驟 1：確認用戶要執行的任務

詢問用戶：
> 「請問您需要：(A) 全新重建整個網站、(B) 更新某個月的數據、還是 (C) 修改特定功能？」

### 步驟 2：收集必要數據 — ⛔ 強制停點

> **⛔ 絕對禁止：在收齊以下所有數據之前，不得開始撰寫任何程式碼。**
> **即使本文件附有舊的硬編碼數據或 references 原始碼中有現成數值，也不可直接沿用。**
> **每一次重建或更新都必須使用最新數據。**
> **數據來源分兩類：**
> **• 第 1-5 項（蝦皮報表）和第 11 項（logo）→ 向用戶索取**
> **• 第 6-10 項（社群平台數據）→ AI 自己透過 API/瀏覽器/外部工具查詢，不可跟用戶要**
> **AI 必須向用戶展示收集進度清單，全部 ✅ 後才可進入步驟 3。**

---

#### 路徑 A — 全新重建（必須收齊以下全部項目）

**📦 蝦皮後台報表（5 份 Excel/CSV）：**

| # | 報表名稱 | 蝦皮下載檔名 | 需提取的欄位 |
|---|---------|------------|------------|
| 1 | 商店數據 | `shop-stats` | 粉絲增長 |
| 2 | 商品概況 | `productoverview` | 商品數 |
| 3 | 銷售組成 | `sales_composition` | 使用「可出貨訂單」工作表：訂單數、買家數、新買家數、銷售額、客單價；不成立訂單數量與金額；退貨/退款數量與金額；複購率、轉換率 |
| 4 | 流量概況 | `traffic_overview` | 手機跳出率、電腦跳出率、行動銷售額佔比 |
| 5 | 聊聊報表 | `chat` | 未回覆聊聊數、詢問率、回覆至下單轉化率、聊聊營業額、客單價（= 銷售額 ÷ 訂單數，不是 ÷ 買家數） |

**📱 社群平台即時數據（AI 自行查詢，不是跟用戶要）：**

> **重要：以下 6-10 項數據由 AI 自己透過 API、瀏覽器、或已連接的外部工具主動查詢。**
> **不可要求用戶手動提供這些數據。**
> **AI 只需向用戶確認帳號名稱是否正確（預設值已列於下方），確認後即可自行收集。**

| # | 平台 | 需要的欄位 | 查詢方式（AI 執行） | 預設帳號/名稱 |
|---|------|----------|----------|----------|
| 6 | 蝦皮拍賣 | 整體評分、好評率、粉絲數、商品數、回覆率、評價分布（好評/普通/差評數量） | 呼叫蝦皮 API：`https://shopee.tw/api/v4/shop/get_shop_detail?username=opcrystal888` | `opcrystal888` |
| 7 | Facebook | 粉絲數、推薦率、評論數、近期互動數（讚 + 留言 + 分享） | 使用 Facebook Pages 連接器或瀏覽器查詢粉專 | `聚寶水晶 Precious Crystal` |
| 8 | Instagram | 粉絲數、貼文數、追蹤中人數 | 瀏覽器查詢 IG 個人頁 | `@opcrystal888` |
| 9 | Google Business Profile | 評分、評論數 | 使用 Google My Business 連接器或瀏覽器查詢 | 帳號 `accounts/114746820478975490439`、位置 `locations/15052927170992413726` |
| 10 | Google 最新評論 | 最新 5 則**客人**評論（作者名、星數、日期、評論文字）。**不要老闆回應** | 同上（Google My Business 連接器） | 同上 |

**🖼️ 其他素材：**

| # | 素材 | 說明 |
|---|------|------|
| 11 | `logo.png` | 品牌 logo 圖片檔。若 repo 中已有且用戶確認沿用，可跳過 |
| 12 | `brand-text.png` | 品牌字圖片。若 repo 中已有且用戶確認沿用，可跳過 |
| 13 | `brand-logo-full.png` | Splash 完整品牌圖。若 repo 中已有且用戶確認沿用，可跳過 |

---

**AI 必須向用戶展示以下收集進度清單，逐項確認：**

```
數據收集進度：

── 用戶提供（向用戶索取）──
⬜ 1. 商店數據 (shop-stats)
⬜ 2. 商品概況 (productoverview)
⬜ 3. 銷售組成 (sales_composition)
⬜ 4. 流量概況 (traffic_overview)
⬜ 5. 聊聊報表 (chat)

── AI 自行查詢（確認帳號後 AI 自己去抓）──
⬜ 6. 蝦皮拍賣即時數據 → AI 查詢 opcrystal888
⬜ 7. Facebook 數據 → AI 查詢聚寶水晶粉專
⬜ 8. Instagram 數據 → AI 查詢 @opcrystal888
⬜ 9. Google Business 數據 → AI 查詢 Google 商家
⬜ 10. Google 最新 5 則評論 → AI 查詢 Google 商家

── 用戶提供 ──
⬜ 11. logo.png
⬜ 12. brand-text.png
⬜ 13. brand-logo-full.png
—————————————
全部 ✅ 後才可進入步驟 3
```

---

#### 路徑 B — 每月數據更新

只需提供當月 5 份蝦皮報表 + 品牌輿情即時數據。
AI 將新月份 append 至歷史陣列，並移除最早一筆（維持 16 個月滑動窗口）。
**同樣必須使用上方清單逐項確認，不可跳過。**
**里程碑數字（累計營業額、累計訂單數、粉絲總數）也須同步更新。**

#### 路徑 C — 修改特定功能

詢問用戶要修改哪個部分，視情況決定是否需要新數據。

---

### 步驟 3：依序輸出 5 個檔案

依照以下順序逐一輸出，每個檔案完整輸出後再進入下一個：

1. **`style.css`**：深色/淺色主題 CSS 變數、全站排版、所有元件樣式、游標光暈（桌面）、日夜切換按鈕、Splash Screen 樣式、scroll 淡入動畫、Glassmorphism header
2. **`index.html`**：HTML 骨架（Splash Screen + 4 個 tab-panel）、所有 KPI 卡片結構、行動建議、CDN 引入、`<meta name="robots" content="noindex, nofollow" />`
3. **`app.js`**：Chart.js 圖表初始化、Popover 篩選器邏輯、MoM 計算、IntersectionObserver 淡入動畫、Header scroll 偵測（glassmorphism）、計數器動畫、游標光暈 JS（觸控裝置停用）、主題切換
4. **`playground.js`**：里程碑 calcFitSize 自動縮放計數器動畫、Pin/Unpin 訊息互動、Canvas 粒子效果
5. **`splash.js`**：星空動畫（銀河帶 + 三層星星 + 星雲 + 流星 + 星座連線）、員工星星標註（在職/離職分別處理）、手機陀螺儀視差（DeviceOrientation + iOS 13+ 權限修復）、品牌 Logo 返回功能

### 步驟 4：確認部署

告知用戶將 5 個檔案 + 圖片素材上傳至 GitHub repo `th845120/pc-dashboard`，確認 CNAME 檔案存在（`preciouscrystal.com.tw`），GitHub Pages 已從 main branch 啟用。

### 重要提醒事項

- 所有歷史數據（聊聊 16 個月、銷售 16 個月、年度營業額）皆**硬編碼**在 JS 檔案中，不依賴後端
- 每次更新數據只需修改 JS 陣列中的對應數值，並 append 新月份
- 品牌輿情頁的即時 KPI 數值（蝦皮 API 數據除外）需手動硬編碼更新
- 行動建議文字每次更新時可根據最新數據調整，但每段描述**結尾必須加句號**
- 圖表百分比 Y 軸一律使用 `.toFixed(2)` 顯示
- `word-break: keep-all` 必須套用於所有中文說明文字元素，防止奇怪斷行
- **KPI 數值必須加 `white-space: nowrap`**，防止大數字（如粉絲數 142,363）在逗號處換行
- 游標光暈效果僅限桌面版，手機版完全停用
- 里程碑數字須在每月更新時同步更新
- **里程碑計數器使用 calcFitSize() 在動畫開始前預先計算字號**，避免動畫過程中數字漂移
- Splash Screen 的星空動畫支援手機陀螺儀視差
- **iOS 陀螺儀權限必須在點擊事件中先 requestPermission 完成後再 dismiss Splash**，否則使用者點接受也無效
- **Splash Logo 必須透過 `filter: brightness(0) invert(1)` 強制為白色**
- **年度營業額明細表格與上方 YoY 區域之間必須保持 48px 間距**
- **員工星星**：在職員工有旋轉圓環 + 光芒 + 明亮文字；離職員工同大星星但不透明度稍低 + 無圓環無光芒 + 文字稍淡
- **員工星星位置每次載入隨機生成**，避開中央 Logo 區域，不受滑鼠排斥力影響
- **手機版 Splash Screen 縮小 30%**：Logo `max-width: 182px`、slogan `font-size: var(--text-base)`、hint `font-size: var(--text-xs)`

---

*本文件版本：2026-04-16 v7 | 對應網站：https://preciouscrystal.com.tw*
