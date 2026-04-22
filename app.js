// ===== TAB SWITCHING =====
var activeSalesSub = 'sales-overview';

function switchMainTab(target, fromBtn) {
  document.querySelectorAll('.tab-btn').forEach(function(b) {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  fromBtn.classList.add('active');
  fromBtn.setAttribute('aria-selected', 'true');
  document.getElementById('tab-' + target).classList.add('active');
}

function switchSalesSubPanel(subId) {
  activeSalesSub = subId;
  document.querySelectorAll('.sales-sub-panel').forEach(function(p) { p.classList.remove('active'); });
  var panel = document.getElementById(subId);
  if (panel) panel.classList.add('active');
  // Update dropdown item active state
  document.querySelectorAll('.tab-dropdown-item').forEach(function(item) {
    item.classList.toggle('active', item.dataset.sub === subId);
  });
}

document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    var target = btn.dataset.tab;
    if (target === 'sales') {
      // Do nothing on click — dropdown shows on hover only,
      // actual navigation happens via dropdown sub-items
      return;
    } else {
      switchMainTab(target, btn);
    }
  });
});

// Dropdown sub-item clicks
document.querySelectorAll('.tab-dropdown-item').forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.stopPropagation();
    var subId = item.dataset.sub;
    var salesBtn = document.querySelector('[data-tab="sales"]');
    // Switch to sales tab first
    switchMainTab('sales', salesBtn);
    // Then switch sub-panel
    switchSalesSubPanel(subId);
    // Close dropdown
    var dd = item.closest('.tab-dropdown');
    if (dd) dd.classList.remove('open');
  });
});

// Mobile touch support for dropdown
(function() {
  var dropdown = document.querySelector('.tab-dropdown');
  if (!dropdown) return;
  var salesBtn = dropdown.querySelector('.tab-btn');
  var touchOpened = false;

  // On touch devices, tap toggles dropdown open
  salesBtn.addEventListener('touchstart', function(e) {
    if (!touchOpened) {
      e.preventDefault();
      dropdown.classList.add('open');
      touchOpened = true;
    } else {
      dropdown.classList.remove('open');
      touchOpened = false;
    }
  }, { passive: false });

  // Close dropdown when tapping outside
  document.addEventListener('touchstart', function(e) {
    if (touchOpened && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      touchOpened = false;
    }
  });
})();

// ===== THEME TOGGLE =====
(function () {
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  // Always default to dark (brand purple)
  let d = 'dark';
  r.setAttribute('data-theme', d);
  const sunIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  const moonIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  if (t) {
    t.innerHTML = sunIcon;
    t.addEventListener('click', () => {
      d = d === 'dark' ? 'light' : 'dark';
      r.setAttribute('data-theme', d);
      t.setAttribute('aria-label', d === 'dark' ? '切換淺色模式' : '切換深色模式');
      t.innerHTML = d === 'dark' ? sunIcon : moonIcon;
    });
  }
})();

// ===== CHART.JS THEME HELPERS =====
function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ===== DONUT CHART: 評價分布 =====
const donutCtx = document.getElementById('ratingDonut');
if (donutCtx) {
  new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['好評 (4-5★)', '普通 (3★)', '差評 (1-2★)'],
      datasets: [{
        data: [16517, 33, 8],
        backgroundColor: ['#3dbf7a', '#e8a825', '#e05555'],
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(2);
              return ` ${ctx.label}：${ctx.parsed.toLocaleString()} 則 (${pct}%)`;
            }
          },
          bodyFont: { family: "'Noto Sans TC', sans-serif", size: 13 },
          padding: 10,
        }
      },
      animation: {
        animateRotate: true,
        duration: 800,
        easing: 'easeInOutQuart',
      }
    }
  });
}

// ===== BAR CHART: 評價總量 =====
const barCtx = document.getElementById('totalBar');
if (barCtx) {
  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['好評\n(4-5★)', '普通\n(3★)', '差評\n(1-2★)'],
      datasets: [{
        label: '評價數量',
        data: [16517, 33, 8],
        backgroundColor: ['rgba(61,191,122,0.75)', 'rgba(232,168,37,0.75)', 'rgba(224,85,85,0.75)'],
        borderColor: ['#3dbf7a', '#e8a825', '#e05555'],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y.toLocaleString()} 則`
          },
          bodyFont: { family: "'Noto Sans TC', sans-serif", size: 13 },
          padding: 10,
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'Noto Sans TC', sans-serif", size: 12 },
            color: '#b0a6c0',
          },
          border: { display: false },
        },
        y: {
          type: 'logarithmic',
          grid: {
            color: 'rgba(180,170,200,0.1)',
          },
          ticks: {
            font: { family: "'Noto Sans TC', sans-serif", size: 11 },
            color: '#b0a6c0',
            callback: (v) => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v,
          },
          border: { display: false },
        }
      },
      animation: {
        duration: 800,
        easing: 'easeInOutQuart',
      }
    }
  });
}

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, duration = 1200, suffix = '') {
  const start = performance.now();
  const isFloat = String(target).includes('.');
  const decimals = isFloat ? String(target).split('.')[1].length : 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = target * ease;
    el.textContent = (isFloat
      ? current.toFixed(decimals)
      : Math.round(current).toLocaleString()) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// Trigger counters on load
// 用 ID 精準對應，避免索引偶合問題
const kpiData = [
  // 蝦皮
  { id: 'kpi-shopee-rating', val: 4.99, float: true },
  { id: 'kpi-shopee-positive', val: 99.75, float: true, suffix: '%' },
  { id: 'kpi-shopee-fans', val: 142363 },
  { id: 'kpi-shopee-products', val: 366 },
  { id: 'kpi-shopee-reply', val: 73, suffix: '%' },
  // Meta — display as "16K" so skip counter
  // { id: 'kpi-meta-fans', val: 16000 },
  { id: 'kpi-meta-recommend', val: 100, suffix: '%' },
  { id: 'kpi-meta-engagement', val: 279 },
  // Google Business Profile
  { id: 'kpi-google-rating', val: 5.0, float: true },
  { id: 'kpi-google-reviews', val: 55 },
].map(d => ({ ...d, el: document.getElementById(d.id) })).filter(d => d.el);

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      kpiData.forEach(({ el, val, float, suffix }) => {
        if (el) animateCounter(el, val, 1000, suffix || '');
      });
      observer.disconnect();
    }
  });
}, { threshold: 0.2 });

const firstKpi = document.querySelector('.kpi-grid');
if (firstKpi) observer.observe(firstKpi);

// ===== 銷售數據圖表（延遲初始化，避免 hidden tab canvas bug）=====
let salesChartsInitialized = false;
let salesChartInstances = {};  // 儲存 chart 實例供更新用

// 完整歷史資料（16 個月，最舊到最新）
const ALL_MONTHS       = ['202412','202501','202502','202503','202504','202505','202506','202507','202508','202509','202510','202511','202512','202601','202602','202603'];
const ALL_FANS         = [4733, 6214, 2310, 749, 1600, 9610, 3979, 3237, 3139, 1845, 685, 2038, 2673, 2215, 4712, -253];
const ALL_NEWBUYER     = [139, 153, 229, 189, 193, 213, 248, 159, 150, 122, 129, 113, 84, 95, 98, 87];
const ALL_REPURCHASE   = [11.48, 12.55, 14.70, 21.71, 21.72, 20.73, 28.38, 28.76, 25.71, 16.03, 23.81, 18.95, 24.54, 22.43, 34.07, 29.53];
const ALL_CVR          = [0.52, 0.54, 0.71, 1.01, 1.04, 0.72, 0.52, 0.50, 0.58, 0.40, 0.33, 0.44, 0.42, 0.47, 0.65, 0.44];
const ALL_AOV          = [3173, 3351, 3869, 3896, 3962, 4312, 4930, 8135, 5597, 3994, 4909, 5280, 5209, 5904, 4041, 3837];

// 根據月數截取最後 N 筆
function sliceData(arr, months) {
  const n = Math.min(months, arr.length);
  return arr.slice(-n);
}

// 顏色：最後一筆紅，負值也紅，其餘品牌紫
function barBg(data) {
  return data.map(function(v, i) {
    if (i === data.length - 1) return '#e05555';
    if (v < 0) return 'rgba(224,85,85,0.55)';
    return 'rgba(196,181,220,0.55)';
  });
}
function barBorder(data) {
  return data.map(function(v, i) {
    if (i === data.length - 1) return '#e05555';
    if (v < 0) return '#e05555';
    return '#c4b5dc';
  });
}
function linePtBg(data) {
  return data.map((_, i) => i === data.length - 1 ? '#e05555' : '#c4b5dc');
}
function linePtSize(data) {
  return data.map((_, i) => i === data.length - 1 ? 7 : 3);
}

const sharedTooltip = {
  bodyFont: { family: "'Noto Sans TC', sans-serif", size: 13 },
  padding: 10,
};
const sharedScaleX = {
  grid: { display: false },
  ticks: { font: { family: "'Noto Sans TC', sans-serif", size: 10 }, color: '#b0a6c0', maxRotation: 45 },
  border: { display: false },
};
const sharedScaleY = {
  grid: { color: 'rgba(180,170,200,0.1)' },
  ticks: { font: { family: "'Noto Sans TC', sans-serif", size: 11 }, color: '#b0a6c0' },
  border: { display: false },
};

// 建立或更新一個 Chart
function upsertChart(id, config) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (salesChartInstances[id]) {
    salesChartInstances[id].destroy();
  }
  salesChartInstances[id] = new Chart(ctx, config);
}

function renderSalesCharts(months) {
  const labels    = sliceData(ALL_MONTHS, months);
  const fans      = sliceData(ALL_FANS, months);
  const newbuyer  = sliceData(ALL_NEWBUYER, months);
  const repurch   = sliceData(ALL_REPURCHASE, months);
  const cvr       = sliceData(ALL_CVR, months);
  const aov       = sliceData(ALL_AOV, months);

  // ── 粉絲增長（bar）──
  upsertChart('salesFansChart', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: fans,
        backgroundColor: barBg(fans),
        borderColor: barBorder(fans),
        borderWidth: 1.5,
        borderRadius: 5,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: ctx => ` ${ctx.parsed.y >= 0 ? '+' : ''}${ctx.parsed.y.toLocaleString()} 人` } } },
      scales: {
        x: sharedScaleX,
        y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: v => (v > 0 ? '+' : '') + v.toLocaleString() } }
      },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });

  // ── 新客增長（bar）──
  upsertChart('salesNewBuyerChart', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: newbuyer,
        backgroundColor: barBg(newbuyer),
        borderColor: barBorder(newbuyer),
        borderWidth: 1.5,
        borderRadius: 5,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: ctx => ` ${ctx.parsed.y} 人` } } },
      scales: { x: sharedScaleX, y: sharedScaleY },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });

  // ── 複購率（line）──
  upsertChart('salesRepurchaseChart', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: repurch,
        borderColor: '#c4b5dc',
        backgroundColor: 'rgba(196,181,220,0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: linePtSize(repurch),
        pointBackgroundColor: linePtBg(repurch),
        pointBorderColor: linePtBg(repurch),
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: ctx => ` ${ctx.parsed.y}%` } } },
      scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: v => v + '%' } } },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });

  // ── 轉換率（line）──
  upsertChart('salesCvrChart', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: cvr,
        borderColor: '#c4b5dc',
        backgroundColor: 'rgba(196,181,220,0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: linePtSize(cvr),
        pointBackgroundColor: linePtBg(cvr),
        pointBorderColor: linePtBg(cvr),
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: ctx => ` ${parseFloat(ctx.parsed.y.toFixed(2))}%` } } },
      scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: v => parseFloat(v.toFixed(2)) + '%' } } },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });

  // ── 平均客單價（line）──
  upsertChart('salesAovChart', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: aov,
        borderColor: '#c4b5dc',
        backgroundColor: 'rgba(196,181,220,0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: linePtSize(aov),
        pointBackgroundColor: linePtBg(aov),
        pointBorderColor: linePtBg(aov),
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: ctx => ` NT$${ctx.parsed.y.toLocaleString()}` } } },
      scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: v => 'NT$' + v.toLocaleString() } } },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });

}

// ── 完整資料陣列（給表格用）──
const ALL_TABLE_DATA = [
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
  { month:'202602', fans:4712,  newbuyer:98,  repurchase:'34.07%', cvr:'0.65%', aov:'NT$4,041', mBounce:'26.16%', pcBounce:'－'    },
  { month:'202603', fans:-253,  newbuyer:87,  repurchase:'29.53%', cvr:'0.44%', aov:'NT$3,837', mBounce:'26.92%', pcBounce:'73.80%', isLatest: true },
];

// 月份字串 "202412" → yyyymm 數字，方便比較
function toNum(yyyymm) { return parseInt(yyyymm); }

// 從四個 select 讀取起迄範圍，回傳 { from: 202412, to: 202603 }
function readRange(yFromId, mFromId, yToId, mToId) {
  const yf = document.getElementById(yFromId)?.value;
  const mf = document.getElementById(mFromId)?.value;
  const yt = document.getElementById(yToId)?.value;
  const mt = document.getElementById(mToId)?.value;
  const from = (yf && mf) ? parseInt(yf + mf.padStart(2,'0')) : 0;
  const to   = (yt && mt) ? parseInt(yt + mt.padStart(2,'0')) : 999999;
  return { from, to };
}

// 過濾資料陣列
function filterByRange(arr, from, to) {
  return arr.filter((_,i) => {
    const m = toNum(ALL_MONTHS[i]);
    return m >= from && m <= to;
  });
}

function filterTableData(from, to) {
  return ALL_TABLE_DATA.filter(d => {
    const m = toNum(d.month);
    return m >= from && m <= to;
  });
}

// ── 重繪表格 ──
function renderTable(from, to) {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;
  const rows = filterTableData(from, to);

  // 計算每欄前 3 名
  var t3Fans   = topNIndices(rows.map(function(d) { return d.fans; }), 3);
  var t3New    = topNIndices(rows.map(function(d) { return d.newbuyer; }), 3);
  var t3Rep    = topNIndices(rows.map(function(d) { return parseNumStr(d.repurchase); }), 3);
  var t3Cvr    = topNIndices(rows.map(function(d) { return parseNumStr(d.cvr); }), 3);
  var t3Aov    = topNIndices(rows.map(function(d) { return parseNumStr(d.aov); }), 3);
  // 跳出率越低越好，所以標前 3 低（用負值取 top）
  var t3MB     = topNIndices(rows.map(function(d) { return -parseNumStr(d.mBounce); }), 3);
  var t3PB     = topNIndices(rows.map(function(d) { var v = parseNumStr(d.pcBounce); return v === 0 ? Infinity : -v; }), 3);

  const html = rows.map(function(d, idx) {
    const isLatest = !!d.isLatest;
    const fansVal = d.fans < 0 ? d.fans.toLocaleString() : '+' + d.fans.toLocaleString();
    const fansClass = d.fans < 0 ? 'cell-bad' : '';
    const rowClass = isLatest ? 'highlight-row' : '';
    const bold = function(v) { return isLatest ? '<strong>' + v + '</strong>' : v; };
    const monthCell = isLatest ? '<strong>' + d.month + '</strong>' : d.month;

    var c3Fans = t3Fans[idx] ? ' cell-top3' : '';
    var c3New  = t3New[idx]  ? ' cell-top3' : '';
    var c3Rep  = t3Rep[idx]  ? ' cell-top3' : '';
    var c3Cvr  = t3Cvr[idx]  ? ' cell-top3' : '';
    var c3Aov  = t3Aov[idx]  ? ' cell-top3' : '';
    var c3MB   = t3MB[idx]   ? ' cell-top3' : '';
    var c3PB   = t3PB[idx]   ? ' cell-top3' : '';

    return '<tr class="' + rowClass + '">' +
      '<td>' + monthCell + '</td>' +
      '<td class="' + fansClass + c3Fans + '">' + bold(fansVal) + '</td>' +
      '<td class="' + c3New + '">' + bold(d.newbuyer) + '</td>' +
      '<td class="' + c3Rep + '">' + bold(d.repurchase) + '</td>' +
      '<td class="' + c3Cvr + '">' + bold(d.cvr) + '</td>' +
      '<td class="' + c3Aov + '">' + bold(d.aov) + '</td>' +
      '<td class="' + c3MB + '">' + bold(d.mBounce) + '</td>' +
      '<td class="' + c3PB + '">' + bold(d.pcBounce) + '</td>' +
      '</tr>';
  }).join('');
  tbody.innerHTML = html;
}

// ===== Year-Month Range Picker =====

// 從 ALL_MONTHS 自動產生可用年月資料
var AVAIL_MAP = {}; // { '2024': ['12'], '2025': ['01',...,'12'], '2026': ['01','02','03'] }
ALL_MONTHS.forEach(function(m) {
  var y = m.slice(0,4), mo = m.slice(4);
  if (!AVAIL_MAP[y]) AVAIL_MAP[y] = [];
  AVAIL_MAP[y].push(mo);
});
var AVAIL_YEARS = Object.keys(AVAIL_MAP).sort();

function yyyymm(y, m) { return parseInt(y + String(m).padStart(2,'0')); }
function fmtLabel(v) {
  if (!v) return '—';
  var s = String(v);
  return s.slice(0,4) + '/' + parseInt(s.slice(4)) + '月';
}

// 建立 Picker 實例
// ── 依索引陣列過濾後重繪圖表 ──
function renderSalesChartsFiltered(indices) {
  if (!indices || indices.length === 0) {
    renderSalesCharts(ALL_MONTHS.length);
    return;
  }
  var labels  = indices.map(function(i) { return ALL_MONTHS[i]; });
  var fans    = indices.map(function(i) { return ALL_FANS[i]; });
  var newb    = indices.map(function(i) { return ALL_NEWBUYER[i]; });
  var repurch = indices.map(function(i) { return ALL_REPURCHASE[i]; });
  var cvr     = indices.map(function(i) { return ALL_CVR[i]; });
  var aov     = indices.map(function(i) { return ALL_AOV[i]; });

  function mkLine(data) {
    return { data: data, borderColor: '#c4b5dc', backgroundColor: 'rgba(196,181,220,0.08)',
      tension: 0.35, fill: true, pointRadius: linePtSize(data),
      pointBackgroundColor: linePtBg(data), pointBorderColor: linePtBg(data), borderWidth: 2 };
  }

  upsertChart('salesFansChart', {
    type: 'bar',
    data: { labels: labels, datasets: [{ data: fans, backgroundColor: barBg(fans), borderColor: barBorder(fans), borderWidth: 1.5, borderRadius: 5, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(ctx) { return ' ' + (ctx.parsed.y >= 0 ? '+' : '') + ctx.parsed.y.toLocaleString() + ' 人'; } } } }, scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return (v > 0 ? '+' : '') + v.toLocaleString(); } } } }, animation: { duration: 600, easing: 'easeInOutQuart' } }
  });
  upsertChart('salesNewBuyerChart', {
    type: 'bar',
    data: { labels: labels, datasets: [{ data: newb, backgroundColor: barBg(newb), borderColor: barBorder(newb), borderWidth: 1.5, borderRadius: 5, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(ctx) { return ' ' + ctx.parsed.y + ' 人'; } } } }, scales: { x: sharedScaleX, y: sharedScaleY }, animation: { duration: 600, easing: 'easeInOutQuart' } }
  });
  upsertChart('salesRepurchaseChart', { type: 'line', data: { labels: labels, datasets: [mkLine(repurch)] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(ctx) { return ' ' + ctx.parsed.y + '%'; } } } }, scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return v + '%'; } } } }, animation: { duration: 600, easing: 'easeInOutQuart' } } });
  upsertChart('salesCvrChart',        { type: 'line', data: { labels: labels, datasets: [mkLine(cvr)]    }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(ctx) { return ' ' + parseFloat(ctx.parsed.y.toFixed(2)) + '%'; } } } }, scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return parseFloat(v.toFixed(2)) + '%'; } } } }, animation: { duration: 600, easing: 'easeInOutQuart' } } });
  upsertChart('salesAovChart',        { type: 'line', data: { labels: labels, datasets: [mkLine(aov)]    }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(ctx) { return ' NT$' + ctx.parsed.y.toLocaleString(); } } } }, scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return 'NT$' + v.toLocaleString(); } } } }, animation: { duration: 600, easing: 'easeInOutQuart' } } });
}

function createPicker(opts) {
  // opts: { triggerId, popoverId, areaId, labelId, selectedLabelId, shortcutPrefix, onApply }
  var trigger       = document.getElementById(opts.triggerId);
  var popover       = document.getElementById(opts.popoverId);
  var area          = document.getElementById(opts.areaId);
  var triggerLabel  = document.getElementById(opts.labelId);
  var selectedLabel = document.getElementById(opts.selectedLabelId);
  if (!trigger || !popover || !area) return;

  var state = { from: 0, to: 999999, pendingFrom: null, pendingTo: null, step: 'from-year' };
  // step: 'from-year' | 'from-month' | 'to-year' | 'to-month'

  function close() { popover.classList.remove('open'); }
  function open()  {
    // 重置 custom 步驟狀態
    state.step = 'from-year';
    state.pendingFrom = null;
    state.pendingTo = null;
    // 清除所有 shortcut 的 active 狀態
    popover.querySelectorAll('.ym-shortcut').forEach(function(b) { b.classList.remove('active'); });
    // 顯示目前篩選範圍摘要
    area.innerHTML = '<div class="ym-picker-title">目前篩選</div>' +
      '<div style="color:var(--color-text-muted);font-size:var(--text-sm);margin-top:8px;word-break:keep-all;">' +
      (state.from ? fmtLabel(state.from) : '最早') + ' → ' +
      (state.to < 999999 ? fmtLabel(state.to) : '最新') + '</div>' +
      '<div style="color:var(--color-text-faint);font-size:var(--text-xs);margin-top:12px;">點選左側選項切換範圍</div>';
    popover.classList.add('open');
  }

  trigger.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = popover.classList.contains('open');
    // Close all other popovers first
    document.querySelectorAll('.ym-popover.open').forEach(function(p) { p.classList.remove('open'); });
    if (!isOpen) open();
  });

  // Stop clicks inside popover from bubbling to document
  popover.addEventListener('click', function(e) { e.stopPropagation(); });

  // Close on outside click
  document.addEventListener('click', function(e) {
    if (!popover.contains(e.target) && e.target !== trigger && !trigger.contains(e.target)) close();
  });

  // Shortcuts
  popover.querySelectorAll('.ym-shortcut').forEach(function(btn) {
    btn.addEventListener('click', function() {
      popover.querySelectorAll('.ym-shortcut').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var preset = btn.dataset.preset;
      if (preset === 'all') {
        state.from = 0; state.to = 999999;
        updateLabels('全部');
      } else if (preset === '1m') {
        var idx1 = Math.max(0, ALL_MONTHS.length - 1);
        state.from = parseInt(ALL_MONTHS[idx1]); state.to = 999999;
        updateLabels('近 1 個月');
      } else if (preset === '3m') {
        var idx3 = Math.max(0, ALL_MONTHS.length - 3);
        state.from = parseInt(ALL_MONTHS[idx3]); state.to = 999999;
        updateLabels('近 3 個月');
      } else if (preset === '6m') {
        var idx6 = Math.max(0, ALL_MONTHS.length - 6);
        state.from = parseInt(ALL_MONTHS[idx6]); state.to = 999999;
        updateLabels('近 6 個月');
      } else if (preset === '12m') {
        var idx12 = Math.max(0, ALL_MONTHS.length - 12);
        state.from = parseInt(ALL_MONTHS[idx12]); state.to = 999999;
        updateLabels('近 12 個月');
      } else if (preset === 'Q1' || preset === 'Q2' || preset === 'Q3' || preset === 'Q4') {
        var qMap = { Q1: ['01','03'], Q2: ['04','06'], Q3: ['07','09'], Q4: ['10','12'] };
        var qRange = qMap[preset];
        var latestMonth = ALL_MONTHS[ALL_MONTHS.length - 1];
        var latestYear = latestMonth.substring(0, 4);
        var latestMM = latestMonth.substring(4, 6);
        // 如果當前季度的起始月在最新數據之後，則使用前一年
        var qYear = latestYear;
        if (parseInt(qRange[0]) > parseInt(latestMM)) {
          qYear = String(parseInt(latestYear) - 1);
        }
        state.from = parseInt(qYear + qRange[0]);
        state.to = parseInt(qYear + qRange[1]);
        updateLabels(qYear + ' ' + preset);
      } else if (preset === 'custom') {
        state.step = 'from-year';
        state.pendingFrom = null; state.pendingTo = null;
        renderArea();
        return;
      }
      // 非 custom 預設選完後，套用篩選並自動關閉 popover
      if (opts.onApply) opts.onApply(state.from, state.to);
      close();
    });
  });

  function updateLabels(text) {
    if (triggerLabel)  triggerLabel.textContent  = text;
    if (selectedLabel) selectedLabel.textContent = '已選：' + text;
  }

  function renderArea() {
    var custom = popover.querySelector('[data-preset="custom"]');
    var isCustom = custom && custom.classList.contains('active');
    // Determine if we're in custom mode
    var inCustom = state.step !== 'done' && (state.pendingFrom !== null || ['from-year','from-month','to-year','to-month'].indexOf(state.step) > -1);
    // Always show year/month picker for custom
    var customShortcut = popover.querySelector('.ym-shortcut[data-preset="custom"]');
    if (!customShortcut || !customShortcut.classList.contains('active')) {
      // Not custom mode — just show summary
      area.innerHTML = '<div class="ym-picker-title">已套用篩選</div>' +
        '<div style="color:var(--color-text-muted);font-size:var(--text-sm);margin-top:8px;word-break:keep-all;">' +
        (state.from ? fmtLabel(state.from) : '最早') + ' → ' +
        (state.to < 999999 ? fmtLabel(state.to) : '最新') + '</div>';
      return;
    }
    // Custom mode — show step
    renderStep();
  }

  function renderStep() {
    area.innerHTML = '';

    // Step indicator
    var steps = document.createElement('div');
    steps.className = 'ym-step-label';
    var labels = ['起始年','起始月','結束年','結束月'];
    var stepIdx = ['from-year','from-month','to-year','to-month'].indexOf(state.step);
    labels.forEach(function(l, i) {
      var dot = document.createElement('span');
      dot.className = 'ym-step-dot' + (i <= stepIdx ? ' active' : '');
      steps.appendChild(dot);
      var txt = document.createTextNode(' ' + l + ' ');
      steps.appendChild(txt);
    });
    area.appendChild(steps);

    if (state.step === 'from-year' || state.step === 'to-year') {
      var isFrom = state.step === 'from-year';
      var title = document.createElement('div');
      title.className = 'ym-picker-title';
      title.textContent = isFrom ? '選擇起始年份' : '選擇結束年份';
      area.appendChild(title);

      // Back button for to-year
      if (!isFrom) {
        var back = document.createElement('button');
        back.className = 'ym-back-btn';
        back.innerHTML = '← 重選起始';
        back.addEventListener('click', function() { state.step = 'from-year'; renderStep(); });
        area.appendChild(back);
      }

      var grid = document.createElement('div');
      grid.className = 'ym-year-grid';
      AVAIL_YEARS.forEach(function(y) {
        var cell = document.createElement('button');
        cell.className = 'ym-cell';
        cell.textContent = y + ' 年';
        var fromY = state.pendingFrom ? String(state.pendingFrom).slice(0,4) : null;
        if (isFrom && fromY === y) cell.classList.add('selected');
        cell.addEventListener('click', function() {
          if (isFrom) {
            state._fromYear = y;
            state.step = 'from-month';
          } else {
            state._toYear = y;
            state.step = 'to-month';
          }
          renderStep();
        });
        grid.appendChild(cell);
      });
      area.appendChild(grid);

    } else if (state.step === 'from-month' || state.step === 'to-month') {
      var isFromM = state.step === 'from-month';
      var year = isFromM ? state._fromYear : state._toYear;
      var months = AVAIL_MAP[year] || [];

      var back = document.createElement('button');
      back.className = 'ym-back-btn';
      back.innerHTML = '← ' + year + ' 年';
      back.addEventListener('click', function() {
        state.step = isFromM ? 'from-year' : 'to-year';
        renderStep();
      });
      area.appendChild(back);

      var title = document.createElement('div');
      title.className = 'ym-picker-title';
      title.textContent = (isFromM ? '選擇起始月份' : '選擇結束月份') + '（' + year + '）';
      area.appendChild(title);

      var grid = document.createElement('div');
      grid.className = 'ym-month-grid';
      months.forEach(function(mo) {
        var val = yyyymm(year, parseInt(mo));
        var cell = document.createElement('button');
        cell.className = 'ym-cell';
        cell.textContent = parseInt(mo) + ' 月';
        // Disable to-months before from
        if (!isFromM && state.pendingFrom && val < state.pendingFrom) {
          cell.classList.add('disabled');
        }
        cell.addEventListener('click', function() {
          if (isFromM) {
            state.pendingFrom = val;
            state.step = 'to-year';
            // If pendingTo < pendingFrom, reset
            if (state.pendingTo && state.pendingTo < state.pendingFrom) state.pendingTo = null;
          } else {
            state.pendingTo = val;
            state.step = 'done';
            // Finalize
            state.from = state.pendingFrom || 0;
            state.to   = state.pendingTo   || 999999;
            updateLabels(fmtLabel(state.from) + ' – ' + fmtLabel(state.to));
            renderArea();
            return;
          }
          renderStep();
        });
        if (isFromM && state.pendingFrom === val) cell.classList.add('selected');
        if (!isFromM && state.pendingTo === val)   cell.classList.add('selected');
        grid.appendChild(cell);
      });
      area.appendChild(grid);

    } else if (state.step === 'done') {
      // 顯示已選摘要，不再遞迴
      area.innerHTML = '<div class="ym-picker-title">已選定範圍</div>' +
        '<div style="color:var(--color-text);font-size:var(--text-base);margin-top:8px;font-weight:600;">' +
        fmtLabel(state.from) + ' &nbsp;→&nbsp; ' + fmtLabel(state.to) + '</div>' +
        '<div style="color:var(--color-text-muted);font-size:var(--text-xs);margin-top:6px;">按下「套用」以更新圖表</div>';
    }
  }

  // Apply button
  document.getElementById(opts.applyId)?.addEventListener('click', function() {
    opts.onApply(state.from || 0, state.to || 999999);
    close();
  });

  return state;
}

function initSalesCharts() {
  if (salesChartsInitialized) return;
  salesChartsInitialized = true;

  // 預設：顯示全部
  renderSalesCharts(ALL_MONTHS.length);
  renderTable(0, 999999);

  // 建立圖表 Picker
  createPicker({
    triggerId: 'chartPickerTrigger',
    popoverId: 'chartPickerPopover',
    areaId:    'chartPickerArea',
    labelId:   'chartPickerLabel',
    selectedLabelId: 'chartSelectedLabel',
    applyId:   'chartRangeApply',
    onApply: function(from, to) {
      var indices = [];
      ALL_MONTHS.forEach(function(m, i) {
        var n = parseInt(m);
        if (n >= from && n <= to) indices.push(i);
      });
      if (indices.length === 0) indices = ALL_MONTHS.map(function(_, i) { return i; });
      renderSalesChartsFiltered(indices);
    }
  });

  // 建立表格 Picker
  createPicker({
    triggerId: 'tablePickerTrigger',
    popoverId: 'tablePickerPopover',
    areaId:    'tablePickerArea',
    labelId:   'tablePickerLabel',
    selectedLabelId: 'tableSelectedLabel',
    applyId:   'tableRangeApply',
    onApply: function(from, to) {
      renderTable(from, to);
    }
  });
}

// 監聽 Tab 切換，切到銷售數據時才初始化
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tab === 'sales') {
      requestAnimationFrame(() => setTimeout(initSalesCharts, 50));
    }
  });
});

// ===== 客服數據圖表（延遲初始化）=====
let serviceChartsInitialized = false;
let serviceChartInstances = {};

// 聊聊歷史數據（16 個月，與 ALL_MONTHS 對應）
const CHAT_UNREPLIED     = [25, 24, 33, 27, 63, 43, 48, 28, 9, 13, 65, 86, 23, 26, 57, 33];
const CHAT_INQUIRY_RATE  = [0.74, 0.24, 0.28, 0.34, 0.21, 0.19, 0.23, 0.17, 0.16, 0.17, 0.18, 0.16, 0.13, 0.13, 0.10, 0.15];
const CHAT_CVR           = [12.75, 12.74, 14.90, 15.18, 22.83, 17.68, 19.22, 19.88, 19.01, 14.17, 17.40, 13.25, 16.56, 21.74, 26.62, 16.56];
const CHAT_REVENUE       = [170188, 109791, 250833, 235624, 217444, 366068, 439750, 462293, 393235, 254487, 263654, 296604, 222605, 311334, 524550, 267428];
const CHAT_AOV           = [3418, 2240, 3216, 2772, 2111, 3936, 2819, 3640, 3818, 3856, 3296, 5816, 3649, 4448, 5194, 4313];

// 聊聊表格數據
const CHAT_TABLE_DATA = [
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
  { month:'202603', unreplied:33,  inquiryRate:'0.15%', cvr:'16.56%', revenue:'NT$267,428', aov:'NT$4,313', isLatest: true },
];

// 未回覆聊聊 bar 特殊顏色（>100 紅，>50 黃，其餘品牌紫）
function chatUnrepliedBg(data) {
  return data.map(function(v, i) {
    if (i === data.length - 1) return '#e05555';
    if (v > 100) return '#e05555';
    if (v > 50)  return '#e8a825';
    return 'rgba(196,181,220,0.55)';
  });
}
function chatUnrepliedBorder(data) {
  return data.map(function(v, i) {
    if (i === data.length - 1) return '#e05555';
    if (v > 100) return '#e05555';
    if (v > 50)  return '#e8a825';
    return '#c4b5dc';
  });
}

// 建立或更新客服圖表實例
function upsertServiceChart(id, config) {
  var ctx = document.getElementById(id);
  if (!ctx) return;
  if (serviceChartInstances[id]) {
    serviceChartInstances[id].destroy();
  }
  serviceChartInstances[id] = new Chart(ctx, config);
}

// 渲染客服圖表（全量資料）
function renderServiceCharts(months) {
  var labels    = sliceData(ALL_MONTHS, months);
  var unreplied = sliceData(CHAT_UNREPLIED, months);
  var inquiry   = sliceData(CHAT_INQUIRY_RATE, months);
  var cvr       = sliceData(CHAT_CVR, months);
  var revenue   = sliceData(CHAT_REVENUE, months);

  // 未回覆聊聊（bar）
  upsertServiceChart('serviceUnrepliedChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: unreplied,
        backgroundColor: chatUnrepliedBg(unreplied),
        borderColor: chatUnrepliedBorder(unreplied),
        borderWidth: 1.5,
        borderRadius: 5,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(ctx) { return ' ' + ctx.parsed.y + ' 筆'; } } } },
      scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return v; } } } },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });

  // 詢問率（line）
  upsertServiceChart('serviceInquiryChart', {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: inquiry,
        borderColor: '#c4b5dc',
        backgroundColor: 'rgba(196,181,220,0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: linePtSize(inquiry),
        pointBackgroundColor: linePtBg(inquiry),
        pointBorderColor: linePtBg(inquiry),
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(ctx) { return ' ' + parseFloat(ctx.parsed.y.toFixed(2)) + '%'; } } } },
      scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return parseFloat(v.toFixed(2)) + '%'; } } } },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });

  // 轉化率回覆至下單（line）
  upsertServiceChart('serviceCvrChart', {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: cvr,
        borderColor: '#c4b5dc',
        backgroundColor: 'rgba(196,181,220,0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: linePtSize(cvr),
        pointBackgroundColor: linePtBg(cvr),
        pointBorderColor: linePtBg(cvr),
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(ctx) { return ' ' + parseFloat(ctx.parsed.y.toFixed(2)) + '%'; } } } },
      scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return parseFloat(v.toFixed(2)) + '%'; } } } },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });

  // 聊聊營業額（bar）
  upsertServiceChart('serviceRevenueChart', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: revenue,
        backgroundColor: barBg(revenue),
        borderColor: barBorder(revenue),
        borderWidth: 1.5,
        borderRadius: 5,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(ctx) { return ' NT$' + ctx.parsed.y.toLocaleString(); } } } },
      scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return 'NT$' + (v >= 1000 ? (v/1000).toFixed(0) + 'K' : v); } } } },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });
}

// 依索引陣列過濾後重繪客服圖表
function renderServiceChartsFiltered(indices) {
  if (!indices || indices.length === 0) {
    renderServiceCharts(ALL_MONTHS.length);
    return;
  }
  var labels    = indices.map(function(i) { return ALL_MONTHS[i]; });
  var unreplied = indices.map(function(i) { return CHAT_UNREPLIED[i]; });
  var inquiry   = indices.map(function(i) { return CHAT_INQUIRY_RATE[i]; });
  var cvr       = indices.map(function(i) { return CHAT_CVR[i]; });
  var revenue   = indices.map(function(i) { return CHAT_REVENUE[i]; });

  upsertServiceChart('serviceUnrepliedChart', {
    type: 'bar',
    data: { labels: labels, datasets: [{ data: unreplied, backgroundColor: chatUnrepliedBg(unreplied), borderColor: chatUnrepliedBorder(unreplied), borderWidth: 1.5, borderRadius: 5, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(c) { return ' ' + c.parsed.y + ' 筆'; } } } }, scales: { x: sharedScaleX, y: sharedScaleY }, animation: { duration: 600, easing: 'easeInOutQuart' } }
  });

  function mkLine(data) {
    return { data: data, borderColor: '#c4b5dc', backgroundColor: 'rgba(196,181,220,0.08)',
      tension: 0.35, fill: true, pointRadius: linePtSize(data),
      pointBackgroundColor: linePtBg(data), pointBorderColor: linePtBg(data), borderWidth: 2 };
  }
  upsertServiceChart('serviceInquiryChart', { type: 'line', data: { labels: labels, datasets: [mkLine(inquiry)] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(c) { return ' ' + parseFloat(c.parsed.y.toFixed(2)) + '%'; } } } }, scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return parseFloat(v.toFixed(2)) + '%'; } } } }, animation: { duration: 600, easing: 'easeInOutQuart' } } });
  upsertServiceChart('serviceCvrChart',      { type: 'line', data: { labels: labels, datasets: [mkLine(cvr)]    }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(c) { return ' ' + parseFloat(c.parsed.y.toFixed(2)) + '%'; } } } }, scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return parseFloat(v.toFixed(2)) + '%'; } } } }, animation: { duration: 600, easing: 'easeInOutQuart' } } });
  upsertServiceChart('serviceRevenueChart', {
    type: 'bar',
    data: { labels: labels, datasets: [{ data: revenue, backgroundColor: barBg(revenue), borderColor: barBorder(revenue), borderWidth: 1.5, borderRadius: 5, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(c) { return ' NT$' + c.parsed.y.toLocaleString(); } } } }, scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return 'NT$' + (v >= 1000 ? (v/1000).toFixed(0) + 'K' : v); } } } }, animation: { duration: 600, easing: 'easeInOutQuart' } }
  });
}

// 解析字串數字（支援 'NT$170,188' 和 '0.74%' 格式）
function parseNumStr(s) {
  if (typeof s === 'number') return s;
  return parseFloat(String(s).replace(/[^\d.\-]/g, '')) || 0;
}

// MoM 漲跌標籤
function momTag(curr, prev, isPercent, invertColor) {
  if (prev === null || prev === undefined) return '';
  var c = parseNumStr(curr);
  var p = parseNumStr(prev);
  if (p === 0 && c === 0) return '';
  var diff, display;
  if (isPercent) {
    diff = c - p;
    display = Math.abs(diff).toFixed(2) + '%';
  } else if (p !== 0) {
    diff = (c - p) / Math.abs(p) * 100;
    display = Math.abs(diff).toFixed(1) + '%';
  } else {
    return '';
  }
  if (Math.abs(diff) < 0.01) return '';
  var arrow = diff >= 0 ? '▲' : '▼';
  var cls = invertColor ? (diff <= 0 ? 'cell-good' : 'cell-bad') : (diff >= 0 ? 'cell-good' : 'cell-bad');
  return '<br><span class="mom-delta ' + cls + '">' + arrow + ' ' + display + '</span>';
}

// 取某欄位前 N 名的索引集合（數字越大越「好」）
function topNIndices(arr, n) {
  var sorted = arr.map(function(v, i) { return { v: v, i: i }; })
    .sort(function(a, b) { return b.v - a.v; });
  var set = {};
  for (var k = 0; k < Math.min(n, sorted.length); k++) set[sorted[k].i] = true;
  return set;
}

// 渲染客服明細表
function renderServiceTable(from, to) {
  var tbody = document.getElementById('serviceTableBody');
  if (!tbody) return;
  var rows = CHAT_TABLE_DATA.filter(function(d) {
    var m = parseInt(d.month);
    return m >= from && m <= to;
  });

  // 計算每欄前 3 名
  var top3Unreplied = topNIndices(rows.map(function(d) { return d.unreplied; }), 3);
  var top3Inquiry   = topNIndices(rows.map(function(d) { return parseNumStr(d.inquiryRate); }), 3);
  var top3Cvr       = topNIndices(rows.map(function(d) { return parseNumStr(d.cvr); }), 3);
  var top3Revenue   = topNIndices(rows.map(function(d) { return parseNumStr(d.revenue); }), 3);
  var top3Aov       = topNIndices(rows.map(function(d) { return parseNumStr(d.aov); }), 3);

  var html = rows.map(function(d, idx) {
    var isLatest = !!d.isLatest;
    var rowClass = isLatest ? 'highlight-row' : '';
    var bold = function(v) { return isLatest ? '<strong>' + v + '</strong>' : v; };
    var monthCell = isLatest ? '<strong>' + d.month + '</strong>' : d.month;
    var prev = idx > 0 ? rows[idx - 1] : null;

    // top3 黃字 class
    var t3U = top3Unreplied[idx] ? ' cell-top3' : '';
    var t3I = top3Inquiry[idx]   ? ' cell-top3' : '';
    var t3C = top3Cvr[idx]       ? ' cell-top3' : '';
    var t3R = top3Revenue[idx]   ? ' cell-top3' : '';
    var t3A = top3Aov[idx]       ? ' cell-top3' : '';

    // MoM — only show on latest row
    var mUnreplied = (isLatest && prev) ? momTag(d.unreplied, prev.unreplied, false, true) : '';
    var mInquiry = (isLatest && prev) ? momTag(d.inquiryRate, prev.inquiryRate, true, true) : '';
    var mCvr = (isLatest && prev) ? momTag(d.cvr, prev.cvr, true, false) : '';
    var mRevenue = (isLatest && prev) ? momTag(d.revenue, prev.revenue, false, false) : '';
    var mAov = (isLatest && prev) ? momTag(d.aov, prev.aov, false, false) : '';
    return '<tr class="' + rowClass + '">' +
      '<td>' + monthCell + '</td>' +
      '<td class="' + t3U + '">' + bold(d.unreplied) + mUnreplied + '</td>' +
      '<td class="' + t3I + '">' + bold(d.inquiryRate) + mInquiry + '</td>' +
      '<td class="' + t3C + '">' + bold(d.cvr) + mCvr + '</td>' +
      '<td class="' + t3R + '">' + bold(d.revenue) + mRevenue + '</td>' +
      '<td class="' + t3A + '">' + bold(d.aov) + mAov + '</td>' +
      '</tr>';
  }).join('');
  tbody.innerHTML = html;
}

function initServiceCharts() {
  if (serviceChartsInitialized) return;
  serviceChartsInitialized = true;

  renderServiceCharts(ALL_MONTHS.length);
  renderServiceTable(0, 999999);

  // 圖表 Picker
  createPicker({
    triggerId: 'serviceChartPickerTrigger',
    popoverId: 'serviceChartPickerPopover',
    areaId:    'serviceChartPickerArea',
    labelId:   'serviceChartPickerLabel',
    selectedLabelId: 'serviceChartSelectedLabel',
    applyId:   'serviceChartRangeApply',
    onApply: function(from, to) {
      var indices = [];
      ALL_MONTHS.forEach(function(m, i) {
        var n = parseInt(m);
        if (n >= from && n <= to) indices.push(i);
      });
      if (indices.length === 0) indices = ALL_MONTHS.map(function(_, i) { return i; });
      renderServiceChartsFiltered(indices);
    }
  });

  // 表格 Picker
  createPicker({
    triggerId: 'serviceTablePickerTrigger',
    popoverId: 'serviceTablePickerPopover',
    areaId:    'serviceTablePickerArea',
    labelId:   'serviceTablePickerLabel',
    selectedLabelId: 'serviceTableSelectedLabel',
    applyId:   'serviceTableRangeApply',
    onApply: function(from, to) {
      renderServiceTable(from, to);
    }
  });
}

// 監聽 Tab 切換，切到客服數據時才初始化
document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (btn.dataset.tab === 'service') {
      requestAnimationFrame(function() { setTimeout(initServiceCharts, 50); });
    }
  });
});

// ===== 蝦皮歷史營業額 =====
var YEARLY_REVENUE = {
  2024: [null, null, 839114, 419141, 1163383, 1168206, 1398145, 1279539, 417360, 709423, 723213, 785941],
  2025: [699028, 1140141, 1033369, 1085720, 1299852, 1843769, 2152000, 1342820, 789236, 1024300, 1025103, 705297],
  2026: [971098, 1562399, 782417, null, null, null, null, null, null, null, null, null]
};

var YEARLY_COLORS = {
  2024: { line: '#e8a825', bg: 'rgba(232,168,37,0.08)' },
  2025: { line: '#3dbf7a', bg: 'rgba(61,191,122,0.08)' },
  2026: { line: '#c4b5dc', bg: 'rgba(196,181,220,0.15)' }
};

var MONTH_LABELS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// 季度對應月份索引 (0-based)
var QUARTER_MONTHS = {
  Q1: [0, 1, 2],
  Q2: [3, 4, 5],
  Q3: [6, 7, 8],
  Q4: [9, 10, 11]
};

var revenueHistoryChartInitialized = false;
var revenueHistoryChartInstance = null;

// 格式化金額
function fmtNTD(v) {
  if (v === null || v === undefined) return '—';
  return 'NT$' + Math.round(v).toLocaleString('en-US');
}

// 建立/更新 revenueHistoryChart datasets
function buildRevenueDatasets(activeYears) {
  var datasets = [];
  activeYears.forEach(function(year) {
    var col = YEARLY_COLORS[year];
    var rawData = YEARLY_REVENUE[year];
    // Chart.js expects null for missing points (not undefined)
    var data = rawData.map(function(v) { return v !== null && v !== undefined ? v : null; });
    datasets.push({
      label: String(year),
      data: data,
      borderColor: col.line,
      backgroundColor: col.bg,
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: col.line,
      pointBorderColor: col.line,
      borderWidth: 2,
      spanGaps: false
    });
  });
  return datasets;
}

// 計算季度總額（若所有月份都是 null 則回傳 null）
function calcQuarterRevenue(year, quarter) {
  var monthIdx = QUARTER_MONTHS[quarter];
  var data = YEARLY_REVENUE[year];
  var total = 0;
  var hasData = false;
  monthIdx.forEach(function(i) {
    if (data[i] !== null && data[i] !== undefined) {
      total += data[i];
      hasData = true;
    }
  });
  return hasData ? total : null;
}

// 更新同比面板
function updateYoyPanel(quarter) {
  var panel = document.getElementById('yoyPanel');
  var content = document.getElementById('yoyContent');
  if (!panel || !content) return;

  if (!quarter) {
    content.style.display = 'none';
    return;
  }

  content.style.display = 'block';

  var years = [2024, 2025, 2026];
  var html = '<div style="font-size:var(--text-sm);font-weight:600;color:var(--color-text);margin-bottom:10px;">' + quarter + ' 同比分析</div>';

  // 2025 vs 2024, 2026 vs 2025
  var comparisons = [
    { curr: 2025, prev: 2024 },
    { curr: 2026, prev: 2025 }
  ];

  comparisons.forEach(function(comp) {
    var currVal = calcQuarterRevenue(comp.curr, quarter);
    var prevVal = calcQuarterRevenue(comp.prev, quarter);

    var currStr = currVal !== null ? fmtNTD(currVal) : '—';
    var prevStr = prevVal !== null ? fmtNTD(prevVal) : '—';

    var yoyStr = '';
    if (currVal !== null && prevVal !== null && prevVal > 0) {
      var pct = ((currVal - prevVal) / prevVal * 100);
      var sign = pct >= 0 ? '▲' : '▼';
      var cls = pct >= 0 ? 'yoy-up' : 'yoy-down';
      yoyStr = '<span class="' + cls + '">' + sign + ' ' + Math.abs(pct).toFixed(2) + '%</span>';
    } else {
      yoyStr = '<span style="color:var(--color-text-faint);">--</span>';
    }

    html += '<div class="yoy-row">' +
      '<strong style="color:var(--color-text);">' + comp.curr + ' ' + quarter + '</strong>' +
      '：' + currStr +
      '&nbsp;&nbsp;vs&nbsp;&nbsp;' +
      '<strong style="color:var(--color-text);">' + comp.prev + ' ' + quarter + '</strong>' +
      '：' + prevStr +
      '&nbsp;&nbsp;→&nbsp;&nbsp;同比：' + yoyStr +
      '</div>';
  });

  content.innerHTML = html;
}

// 填充年度數據表格
function renderRevenueTable() {
  var tbody = document.getElementById('revenueTableBody');
  if (!tbody) return;

  var years = [2024, 2025, 2026];
  var html = '';

  years.forEach(function(year) {
    var data = YEARLY_REVENUE[year];
    var isLatestYear = (year === 2026);

    // 計算年度合計（只加有數據的月份）
    var total = 0;
    var hasAny = false;
    data.forEach(function(v) {
      if (v !== null && v !== undefined) {
        total += v;
        hasAny = true;
      }
    });

    var rowClass = isLatestYear ? 'highlight-row' : '';
    var cells = data.map(function(v) {
      if (v === null || v === undefined) return '<td>—</td>';
      return '<td>NT$' + Math.round(v).toLocaleString('en-US') + '</td>';
    }).join('');

    var totalCell = hasAny
      ? '<td class="year-total">NT$' + Math.round(total).toLocaleString('en-US') + '</td>'
      : '<td>—</td>';

    html += '<tr class="' + rowClass + '">' +
      '<td>' + year + '</td>' +
      cells +
      totalCell +
      '</tr>';
  });

  tbody.innerHTML = html;
}

// 初始化走勢圖
function initRevenueHistoryChart() {
  if (revenueHistoryChartInitialized) return;
  revenueHistoryChartInitialized = true;

  renderRevenueTable();

  var activeYears = [2024, 2025, 2026];
  var datasets = buildRevenueDatasets(activeYears);

  var canvas = document.getElementById('revenueHistoryChart');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  revenueHistoryChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: MONTH_LABELS_SHORT,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: getCSSVar('--color-text-muted'),
            font: { size: 11, family: getCSSVar('--font-body') },
            usePointStyle: true,
            pointStyleWidth: 10,
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: getCSSVar('--color-surface'),
          borderColor: getCSSVar('--color-border'),
          borderWidth: 1,
          titleColor: getCSSVar('--color-text'),
          bodyColor: getCSSVar('--color-text-muted'),
          padding: 12,
          callbacks: {
            label: function(ctx) {
              if (ctx.parsed.y === null) return ' ' + ctx.dataset.label + '：—';
              return ' ' + ctx.dataset.label + '：NT$' + Math.round(ctx.parsed.y).toLocaleString('en-US');
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(196,181,220,0.07)', drawBorder: false },
          ticks: {
            color: getCSSVar('--color-text-faint'),
            font: { size: 11, family: getCSSVar('--font-body') }
          }
        },
        y: {
          grid: { color: 'rgba(196,181,220,0.07)', drawBorder: false },
          ticks: {
            color: getCSSVar('--color-text-faint'),
            font: { size: 11, family: getCSSVar('--font-body') },
            callback: function(v) {
              if (v >= 1000000) return 'NT$' + (v / 1000000).toFixed(1) + 'M';
              if (v >= 1000) return 'NT$' + (v / 1000).toFixed(0) + 'K';
              return 'NT$' + v;
            }
          }
        }
      },
      animation: { duration: 600, easing: 'easeInOutQuart' }
    }
  });

  // 監聽年度 checkbox
  var checkboxes = document.querySelectorAll('input[name="yearToggle"]');
  checkboxes.forEach(function(cb) {
    cb.addEventListener('change', function() {
      var newActive = [];
      checkboxes.forEach(function(c) {
        if (c.checked) newActive.push(parseInt(c.value));
      });
      if (revenueHistoryChartInstance) {
        revenueHistoryChartInstance.data.datasets = buildRevenueDatasets(newActive);
        revenueHistoryChartInstance.update();
      }
    });
  });

  // 監聽同比季度下拉
  var quarterSel = document.getElementById('yoyQuarterSelect');
  if (quarterSel) {
    quarterSel.addEventListener('change', function() {
      updateYoyPanel(this.value);
    });
  }
}

// 監聽 Tab 切換，切到銷售數據時也初始化歷史營業額圖表
document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (btn.dataset.tab === 'sales') {
      requestAnimationFrame(function() {
        setTimeout(function() {
          initRevenueHistoryChart();
          initRevRaceChart();
        }, 80);
      });
    }
  });
});

// ===== 營業額賽跑圖（銷售頁面） =====
var revRaceInitialized = false;
function initRevRaceChart() {
  if (revRaceInitialized) return;
  revRaceInitialized = true;

  var container = document.getElementById('revRaceChart');
  var timelineEl = document.getElementById('revRaceTimeline');
  var playBtn = document.getElementById('revRacePlay');
  if (!container || typeof d3 === 'undefined') return;

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var colors = { 2024: '#e8a825', 2025: '#3dbf7a', 2026: '#9b59b6' };

  // 讀取目前勾選的年份
  function getCheckedYears() {
    var checked = [];
    document.querySelectorAll('input[name="yearToggle"]').forEach(function(cb) {
      if (cb.checked) checked.push(parseInt(cb.value));
    });
    return checked.length > 0 ? checked : [2024, 2025, 2026];
  }

  function buildFrames() {
    var checkedYears = getCheckedYears();
    var frames = [];
    for (var m = 0; m < 12; m++) {
      var frame = [];
      checkedYears.forEach(function(y) {
        var val = YEARLY_REVENUE[y] && YEARLY_REVENUE[y][m];
        if (val !== null && val !== undefined) {
          frame.push({ year: String(y), value: val, color: colors[y] });
        }
      });
      if (frame.length > 0) {
        frame.sort(function(a, b) { return b.value - a.value; });
        frames.push({ month: MONTHS[m], data: frame });
      }
    }
    return frames;
  }

  var allFrames = buildFrames();

  var margin = { top: 30, right: 120, bottom: 10, left: 50 };
  var barHeight = 42;

  function renderFrame(idx, animate) {
    if (idx >= allFrames.length) return;
    if (animate === undefined) animate = true;
    var frame = allFrames[idx];
    var maxBars = 3;
    var data = frame.data.slice(0, maxBars);
    var w = container.clientWidth || 700;
    var h = margin.top + margin.bottom + data.length * (barHeight + 8);

    container.innerHTML = '';
    var svg = d3.select(container)
      .append('svg')
      .attr('width', w)
      .attr('height', h);

    var maxVal = d3.max(data, function(d) { return d.value; }) || 1;
    var x = d3.scaleLinear().domain([0, maxVal * 1.15]).range([margin.left, w - margin.right]);

    svg.append('text')
      .attr('x', w - margin.right)
      .attr('y', 22)
      .attr('text-anchor', 'end')
      .attr('class', 'pg-race-month')
      .text(frame.month);

    var bars = svg.selectAll('.pg-race-bar')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', function(d, i) { return 'translate(0,' + (margin.top + i * (barHeight + 8)) + ')'; });

    bars.append('text')
      .attr('x', margin.left - 8)
      .attr('y', barHeight / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('class', 'pg-race-label')
      .text(function(d) { return d.year; });

    var raceDuration = animate ? 1200 : 0;

    // 實心 bar
    var mainBar = bars.append('rect')
      .attr('x', margin.left)
      .attr('y', 0)
      .attr('height', barHeight)
      .attr('rx', 6)
      .attr('fill', function(d) { return d.color; })
      .attr('width', animate ? 0 : function(d) { return Math.max(0, x(d.value) - margin.left); });
    if (animate) {
      mainBar.transition()
        .duration(raceDuration)
        .ease(d3.easeCubicOut)
        .attr('width', function(d) { return Math.max(0, x(d.value) - margin.left); });
    }

    // glow bar
    var glowBar = bars.append('rect')
      .attr('x', margin.left)
      .attr('y', 0)
      .attr('height', barHeight)
      .attr('rx', 6)
      .attr('fill', function(d) { return d.color; })
      .attr('opacity', 0.15)
      .attr('filter', 'blur(8px)')
      .attr('width', animate ? 0 : function(d) { return Math.max(0, x(d.value) - margin.left); });
    if (animate) {
      glowBar.transition()
        .duration(raceDuration)
        .ease(d3.easeCubicOut)
        .attr('width', function(d) { return Math.max(0, x(d.value) - margin.left); });
    }

    // Runner emoji at the end of each bar
    var runner = bars.append('text')
      .attr('y', barHeight / 2 + 6)
      .attr('x', animate ? margin.left : function(d) { return x(d.value) + 2; })
      .attr('font-size', '20px')
      .attr('class', 'pg-race-runner')
      .text('🏃');
    if (animate) {
      runner.transition()
        .duration(raceDuration)
        .ease(d3.easeCubicOut)
        .attr('x', function(d) { return x(d.value) + 2; });
    }

    // Value label
    var valueText = bars.append('text')
      .attr('y', barHeight / 2 + 5)
      .attr('class', 'pg-race-value')
      .attr('x', animate ? margin.left + 4 : function(d) { return x(d.value) + 26; });
    if (animate) {
      valueText.transition()
        .duration(raceDuration)
        .ease(d3.easeCubicOut)
        .attr('x', function(d) { return x(d.value) + 26; })
        .textTween(function(d) {
          var i = d3.interpolateNumber(0, d.value);
          return function(t) { return 'NT$' + Math.round(i(t)).toLocaleString('en-US'); };
        });
    } else {
      // 無動畫：直接設最終文字
      valueText.text(function(d) { return 'NT$' + Math.round(d.value).toLocaleString('en-US'); });
    }
  }

  timelineEl.innerHTML = '';
  allFrames.forEach(function(f, i) {
    var dot = document.createElement('button');
    dot.className = 'pg-race-dot' + (i === 0 ? ' active' : '');
    dot.textContent = f.month;
    dot.addEventListener('click', function() {
      timelineEl.querySelectorAll('.pg-race-dot').forEach(function(d) { d.classList.remove('active'); });
      dot.classList.add('active');
      renderFrame(i, true);
    });
    timelineEl.appendChild(dot);
  });

  // 首次渲染不動畫，避免 iOS Safari 切標籤時 transition 卡住造成 bar 齊平
  renderFrame(0, false);

  // 切換到賽跑圖時 re-render·因為切換 rev-view-btn 的 handler 在下面 IIFE，這裡 expose 一個 refit 函數
  window.__revRaceRefit = function() {
    // 若容器可見且 SVG 存在，重新渲染首幀 (不動畫)
    if (container.clientWidth > 0 && allFrames.length > 0) {
      // 找到目前 active 的 dot
      var activeDot = timelineEl.querySelector('.pg-race-dot.active');
      var idx = 0;
      if (activeDot) {
        var dots = timelineEl.querySelectorAll('.pg-race-dot');
        idx = Array.prototype.indexOf.call(dots, activeDot);
      }
      renderFrame(idx, false);
    }
  };

  var playing = false;
  var timer = null;
  playBtn.addEventListener('click', function() {
    if (playing) {
      clearInterval(timer);
      playing = false;
      playBtn.textContent = '▶ 播放';
      return;
    }
    playing = true;
    playBtn.textContent = '⏸ 暫停';
    var idx = 0;
    var dots = timelineEl.querySelectorAll('.pg-race-dot');
    timer = setInterval(function() {
      dots.forEach(function(d) { d.classList.remove('active'); });
      dots[idx].classList.add('active');
      renderFrame(idx, true);
      idx++;
      if (idx >= allFrames.length) {
        clearInterval(timer);
        playing = false;
        playBtn.textContent = '▶ 播放';
      }
    }, 2200);
  });

  // 監聽年度 checkbox 變化，重建賽跑圖
  document.querySelectorAll('input[name="yearToggle"]').forEach(function(cb) {
    cb.addEventListener('change', function() {
      // 重建 frames
      allFrames = buildFrames();
      // 重建 timeline dots
      timelineEl.innerHTML = '';
      allFrames.forEach(function(f, i) {
        var dot = document.createElement('button');
        dot.className = 'pg-race-dot' + (i === 0 ? ' active' : '');
        dot.textContent = f.month;
        dot.addEventListener('click', function() {
          timelineEl.querySelectorAll('.pg-race-dot').forEach(function(d) { d.classList.remove('active'); });
          dot.classList.add('active');
          renderFrame(i, true);
        });
        timelineEl.appendChild(dot);
      });
      // 渲染第一幀 (不動畫)
      if (allFrames.length > 0) {
        renderFrame(0, false);
      } else {
        container.innerHTML = '';
      }
    });
  });
}

// 線條圖 / 賽跑圖切換
(function() {
  var btns = document.querySelectorAll('.rev-view-btn');
  var lineView = document.getElementById('revLineView');
  var raceView = document.getElementById('revRaceView');
  if (!btns.length || !lineView || !raceView) return;

  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      btns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if (btn.dataset.view === 'line') {
        lineView.style.display = '';
        raceView.style.display = 'none';
      } else {
        lineView.style.display = 'none';
        raceView.style.display = '';
        initRevRaceChart();
        // 切到賽跑圖時，延遲重新渲染首幀 (不動畫)
        // 確保容器可見後，bar 寬度依正確的 maxVal 計算
        requestAnimationFrame(function() {
          setTimeout(function() {
            if (window.__revRaceRefit) window.__revRaceRefit();
          }, 100);
        });
      }
    });
  });
})();

// ===== 年度表現 =====
var YEARLY_PERFORMANCE = [
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

(function renderYearlyPerformance() {
  var tbody = document.getElementById('yearlyPerfBody');
  if (!tbody) return;

  function fmtNT(v) { return 'NT$' + Math.round(v).toLocaleString('en-US'); }
  function fmtNTDec(v) { return 'NT$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  // 計算 YoY 差異。invertColor=true 表示增加是壞事（如退貨率、不成立）
  function yoyTag(curr, prev, isPercent, invertColor) {
    if (prev === undefined || prev === null) return '';
    if (isPercent) {
      var diff = curr - prev;
      var sign = diff >= 0 ? '▲' : '▼';
      var cls = invertColor ? (diff <= 0 ? 'up' : 'down') : (diff >= 0 ? 'up' : 'down');
      return '<br><span class="kpi-delta ' + cls + '" style="font-size:0.75rem;">' + sign + ' ' + Math.abs(diff).toFixed(2) + '%</span>';
    } else {
      if (prev === 0) return '';
      var pct = ((curr - prev) / prev * 100);
      var sign2 = pct >= 0 ? '▲' : '▼';
      var cls2 = invertColor ? (pct <= 0 ? 'up' : 'down') : (pct >= 0 ? 'up' : 'down');
      return '<br><span class="kpi-delta ' + cls2 + '" style="font-size:0.75rem;">' + sign2 + ' ' + Math.abs(pct).toFixed(1) + '%</span>';
    }
  }

  var html = '';
  for (var i = 0; i < YEARLY_PERFORMANCE.length; i++) {
    var d = YEARLY_PERFORMANCE[i];
    var prev = i > 0 ? YEARLY_PERFORMANCE[i - 1] : null;

    html += '<tr>';
    html += '<td style="font-weight:600;">' + d.year + '</td>';
    html += '<td>' + fmtNT(d.revenue) + (prev ? yoyTag(d.revenue, prev.revenue) : '') + '</td>';
    html += '<td>' + d.orders.toLocaleString('en-US') + (prev ? yoyTag(d.orders, prev.orders) : '') + '</td>';
    html += '<td>' + d.cvr.toFixed(2) + '%' + (prev ? yoyTag(d.cvr, prev.cvr, true) : '') + '</td>';
    html += '<td>' + fmtNTDec(d.avgOrder) + (prev ? yoyTag(d.avgOrder, prev.avgOrder) : '') + '</td>';
    html += '<td>' + d.invalidOrders.toLocaleString('en-US') + (prev ? yoyTag(d.invalidOrders, prev.invalidOrders, false, true) : '') + '</td>';
    html += '<td>' + fmtNT(d.invalidAmount) + (prev ? yoyTag(d.invalidAmount, prev.invalidAmount, false, true) : '') + '</td>';
    html += '<td>' + d.returnOrders.toLocaleString('en-US') + (prev ? yoyTag(d.returnOrders, prev.returnOrders, false, true) : '') + '</td>';
    html += '<td>' + d.returnRate.toFixed(2) + '%' + (prev ? yoyTag(d.returnRate, prev.returnRate, true, true) : '') + '</td>';
    html += '</tr>';
  }

  tbody.innerHTML = html;
})();

// ===== CURSOR GLOW (desktop only) =====
(function() {
  var glow = document.getElementById('cursorGlow');
  if (!glow) return;
  // Disable on touch devices — only show on real mouse pointer
  var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouchDevice) { glow.style.display = 'none'; return; }
  var visible = false;
  document.addEventListener('mousemove', function(e) {
    if (!visible) { glow.classList.add('visible'); visible = true; }
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
  document.addEventListener('mouseleave', function() {
    glow.classList.remove('visible');
    visible = false;
  });
})();

// ===== HEADER SCROLL EFFECT =====
(function() {
  var header = document.getElementById('siteHeader');
  if (!header) return;
  var lastScroll = 0;
  window.addEventListener('scroll', function() {
    var scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });
})();

// ===== SCROLL FADE-IN ANIMATIONS =====
(function() {
  var elements = document.querySelectorAll('.fade-in-up');
  if (!elements.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  elements.forEach(function(el) { observer.observe(el); });
})();


// ===== 直播主蝦幣 vs 業績走勢 =====
var STREAMER_DATA = {
  "靚靚": {
    color: "#e8a825",
    colorBg: "rgba(232,168,37,0.08)",
    active: true,
    months:  ["04/25","05/25","06/25","07/25","08/25","09/25","10/25","11/25","12/25","01/26","02/26","03/26"],
    revenue: [336608, 419659, 432458, 346822, 524539, 306556, 243695, 351457, 373365, 307606, 366878, 359056],
    coins:   [3874, 30210, 20960, 18248, 22210, 9748, 6046, 22251, 15834, 24167, 14839, 5490]
  },
  "珍妮": {
    color: "#3dbf7a",
    colorBg: "rgba(61,191,122,0.08)",
    active: true,
    months:  ["04/25","05/25","06/25","07/25","08/25","09/25","10/25","11/25","12/25","01/26","02/26","03/26"],
    revenue: [189218, 288450, 444869, 1051585, 422988, 234448, 349019, 344127, 207265, 323967, 512241, 279763],
    coins:   [967, 28604, 20405, 23182, 15499, 7990, 1785, 10917, 13903, 23267, 20769, 1455]
  }
};

var STREAMER_MONTH_LABELS = ["04/25","05/25","06/25","07/25","08/25","09/25","10/25","11/25","12/25","01/26","02/26","03/26"];

// Pre-compute total monthly coins (sum across ALL streamers regardless of toggle)
var TOTAL_MONTHLY_COINS = STREAMER_MONTH_LABELS.map(function(_, i) {
  var sum = 0;
  Object.keys(STREAMER_DATA).forEach(function(name) {
    sum += STREAMER_DATA[name].coins[i];
  });
  return sum;
});

var showTotalCoins = true;
var streamerCoinChartInstance = null;

// Streamer date filter state — indices into STREAMER_MONTH_LABELS
var streamerFilterIndices = null; // null = show all

// Seasonal month classification: peak (red) vs off-season (blue)
// Peak months: 2, 6, 7, 8
var PEAK_MONTHS = [2, 6, 7, 8];
function isPeakMonth(monthLabel) {
  // monthLabel format: "MM/YY" e.g. "04/25"
  var mm = parseInt(monthLabel.split('/')[0], 10);
  return PEAK_MONTHS.indexOf(mm) > -1;
}
function getSeasonColor(monthLabel) {
  return isPeakMonth(monthLabel) ? '#e05555' : '#5b9bd5';
}

function initStreamerCheckboxes() {
  var group = document.getElementById('streamerCheckboxGroup');
  if (!group) return;
  group.innerHTML = '';

  // Per-streamer checkboxes
  Object.keys(STREAMER_DATA).forEach(function(name) {
    var s = STREAMER_DATA[name];
    var label = document.createElement('label');
    label.style.setProperty('--streamer-color', s.color);
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'streamerToggle';
    input.value = name;
    input.checked = s.active;
    input.addEventListener('change', function() {
      STREAMER_DATA[name].active = this.checked;
      updateStreamerChart();
      updateStreamerTable();
    });
    var span = document.createElement('span');
    span.textContent = name;
    label.appendChild(input);
    label.appendChild(span);
    group.appendChild(label);
  });

  // Total coins checkbox
  var totalLabel = document.createElement('label');
  totalLabel.style.setProperty('--streamer-color', '#c4b5dc');
  var totalInput = document.createElement('input');
  totalInput.type = 'checkbox';
  totalInput.name = 'streamerToggle';
  totalInput.value = '總投放';
  totalInput.checked = showTotalCoins;
  totalInput.addEventListener('change', function() {
    showTotalCoins = this.checked;
    updateStreamerChart();
    updateStreamerTable();
  });
  var totalSpan = document.createElement('span');
  totalSpan.textContent = '總蝦幣投放';
  totalLabel.appendChild(totalInput);
  totalLabel.appendChild(totalSpan);
  group.appendChild(totalLabel);

  // Legend
  var legend = document.getElementById('streamerLegend');
  if (legend) {
    legend.innerHTML =
      '<span class="streamer-legend-item"><span class="streamer-legend-line" style="background:var(--color-text-muted);"></span>業績</span>' +
      '<span class="streamer-legend-item"><span class="streamer-legend-dash" style="border-color:var(--color-text-muted);"></span>蝦幣</span>' +
      '<span class="streamer-legend-item"><span class="streamer-legend-bar" style="background:#c4b5dc;"></span>總投放</span>';
  }
}

function getFilteredIndices() {
  return streamerFilterIndices || STREAMER_MONTH_LABELS.map(function(_, i) { return i; });
}

function buildStreamerDatasets() {
  var indices = getFilteredIndices();
  var datasets = [];

  // Total coins bar (behind everything)
  if (showTotalCoins) {
    datasets.push({
      label: '總蝦幣投放',
      data: indices.map(function(i) { return TOTAL_MONTHLY_COINS[i]; }),
      type: 'bar',
      backgroundColor: 'rgba(196,181,220,0.18)',
      borderColor: 'rgba(196,181,220,0.4)',
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: 0.5,
      categoryPercentage: 0.6,
      yAxisID: 'yCoins',
      order: 3
    });
  }

  Object.keys(STREAMER_DATA).forEach(function(name) {
    var s = STREAMER_DATA[name];
    if (!s.active) return;
    datasets.push({
      label: name + ' 業績',
      data: indices.map(function(i) { return s.revenue[i]; }),
      borderColor: s.color,
      backgroundColor: s.colorBg,
      fill: false,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: s.color,
      pointBorderColor: 'rgba(0,0,0,0.1)',
      borderWidth: 2.5,
      yAxisID: 'yRevenue',
      order: 1
    });
    datasets.push({
      label: name + ' 蝦幣',
      data: indices.map(function(i) { return s.coins[i]; }),
      borderColor: s.color,
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: s.color,
      pointBorderColor: 'rgba(0,0,0,0.1)',
      borderWidth: 2,
      borderDash: [6, 4],
      yAxisID: 'yCoins',
      order: 2
    });
  });
  return datasets;
}

function updateStreamerChart() {
  if (!streamerCoinChartInstance) return;
  var indices = getFilteredIndices();
  streamerCoinChartInstance.data.labels = indices.map(function(i) { return STREAMER_MONTH_LABELS[i]; });
  streamerCoinChartInstance.data.datasets = buildStreamerDatasets();
  streamerCoinChartInstance.update();
}

function initStreamerCoinChart() {
  var canvas = document.getElementById('streamerCoinChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var gridColor = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || 'rgba(255,255,255,0.06)';
  var textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || 'rgba(255,255,255,0.45)';

  streamerCoinChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: STREAMER_MONTH_LABELS,
      datasets: buildStreamerDatasets()
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30,25,40,0.95)',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.8)',
          borderColor: 'rgba(196,181,220,0.2)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          callbacks: {
            label: function(ctx) {
              var label = ctx.dataset.label || '';
              var val = ctx.parsed.y;
              return label + '：NT$' + Math.round(val).toLocaleString('en-US');
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } }
        },
        yRevenue: {
          type: 'linear', position: 'left',
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 },
            callback: function(v) { if (v >= 1000000) return (v/1000000).toFixed(1)+'M'; if (v >= 1000) return (v/1000).toFixed(0)+'K'; return v; }
          },
          title: { display: true, text: '業績 (NT$)', color: textColor, font: { size: 11 } }
        },
        yCoins: {
          type: 'linear', position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: textColor, font: { size: 11 },
            callback: function(v) { if (v >= 1000) return (v/1000).toFixed(0)+'K'; return v; }
          },
          title: { display: true, text: '蝦幣投放 (NT$)', color: textColor, font: { size: 11 } }
        }
      }
    }
  });
}

function updateStreamerTable() {
  var tbody = document.getElementById('streamerCoinTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  var indices = getFilteredIndices();

  // Collect all individual streamer revenues to find top 3 (by unique rank)
  var revEntries = [];
  indices.forEach(function(i) {
    Object.keys(STREAMER_DATA).forEach(function(name) {
      var s = STREAMER_DATA[name];
      if (!s.active) return;
      revEntries.push({ key: name + '|' + i, rev: s.revenue[i] });
    });
  });
  revEntries.sort(function(a, b) { return b.rev - a.rev; });
  var top3Keys = {};
  for (var t = 0; t < Math.min(3, revEntries.length); t++) {
    top3Keys[revEntries[t].key] = true;
  }

  indices.forEach(function(i) {
    var month = STREAMER_MONTH_LABELS[i];
    var seasonColor = getSeasonColor(month);
    // Season color only — no text label
    // Individual streamer rows
    Object.keys(STREAMER_DATA).forEach(function(name) {
      var s = STREAMER_DATA[name];
      if (!s.active) return;
      var rev = s.revenue[i];
      var coin = s.coins[i];
      var roi = coin > 0 ? (rev / coin).toFixed(1) + 'x' : '—';
      var pct = rev > 0 ? (coin / rev * 100).toFixed(2) + '%' : '—';
      var isTop3 = top3Keys[name + '|' + i] === true;
      var revStyle = isTop3 ? 'color:#e8a825;font-weight:700;' : '';
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span style="color:' + seasonColor + ';">' + month + '</span></td>' +
        '<td><span style="color:' + s.color + ';font-weight:600;">' + name + '</span></td>' +
        '<td><span style="' + revStyle + '">NT$' + rev.toLocaleString('en-US') + '</span></td>' +
        '<td>NT$' + coin.toLocaleString('en-US') + '</td>' +
        '<td>' + roi + '</td>' +
        '<td>' + pct + '</td>';
      tbody.appendChild(tr);
    });
    // Total row for this month
    if (showTotalCoins) {
      var totalCoin = TOTAL_MONTHLY_COINS[i];
      var totalRev = 0;
      Object.keys(STREAMER_DATA).forEach(function(name) {
        if (STREAMER_DATA[name].active) totalRev += STREAMER_DATA[name].revenue[i];
      });
      var totalRoi = totalCoin > 0 ? (totalRev / totalCoin).toFixed(1) + 'x' : '—';
      var totalPct = totalRev > 0 ? (totalCoin / totalRev * 100).toFixed(2) + '%' : '—';
      var totalTr = document.createElement('tr');
      totalTr.style.cssText = 'background:rgba(196,181,220,0.06);font-weight:600;';
      totalTr.innerHTML =
        '<td><span style="color:' + seasonColor + ';">' + month + '</span></td>' +
        '<td><span style="color:#c4b5dc;font-weight:600;">合計</span></td>' +
        '<td>NT$' + totalRev.toLocaleString('en-US') + '</td>' +
        '<td>NT$' + totalCoin.toLocaleString('en-US') + '</td>' +
        '<td>' + totalRoi + '</td>' +
        '<td>' + totalPct + '</td>';
      tbody.appendChild(totalTr);
    }
  });
}

// Streamer Picker: convert MM/YY label to YYYYMM numeric for createPicker compatibility
function streamerMonthToNum(label) {
  var parts = label.split('/');
  return parseInt('20' + parts[1] + parts[0]);
}

function applyStreamerFilter(from, to) {
  var indices = [];
  STREAMER_MONTH_LABELS.forEach(function(label, i) {
    var num = streamerMonthToNum(label);
    if (num >= from && num <= to) indices.push(i);
  });
  if (indices.length === 0) indices = null; // show all
  streamerFilterIndices = indices;
  updateStreamerChart();
  updateStreamerTable();
}

// Initialize when shopee-live sub-panel is first shown
var streamerChartInitialized = false;
function tryInitStreamerChart() {
  if (streamerChartInitialized) return;
  var canvas = document.getElementById('streamerCoinChart');
  if (canvas && canvas.offsetParent !== null) {
    streamerChartInitialized = true;
    initStreamerCheckboxes();
    initStreamerCoinChart();
    updateStreamerTable();
    // Create date picker for streamer section
    createPicker({
      triggerId: 'streamerPickerTrigger',
      popoverId: 'streamerPickerPopover',
      areaId:    'streamerPickerArea',
      labelId:   'streamerPickerLabel',
      selectedLabelId: 'streamerSelectedLabel',
      applyId:   'streamerRangeApply',
      onApply: function(from, to) {
        applyStreamerFilter(from, to);
      }
    });
  }
}
// Hook into sub-panel switching
var origSwitchSub = switchSalesSubPanel;
switchSalesSubPanel = function(subId) {
  origSwitchSub(subId);
  if (subId === 'sales-shopee-live') {
    setTimeout(tryInitStreamerChart, 100);
  }
};
// Also listen for dropdown item clicks as backup
document.querySelectorAll('.tab-dropdown-item').forEach(function(item) {
  item.addEventListener('click', function() {
    if (item.dataset.sub === 'sales-shopee-live') {
      setTimeout(tryInitStreamerChart, 150);
    }
  });
});
// Try on load in case already active
setTimeout(tryInitStreamerChart, 500);

// ===== META LIVE PANEL =====
// META_LIVE_DATA v3 — ADO 按每筆訂單「下單日」逐筆精確拆分 (2026-04-22)
// 2024/7/29-8/6 session 無下單日欄，用 Created time 拆分；DB1 GMV/Ads 為權威
var META_LIVE_DATA = {
  months: ["12/24","01/25","02/25","03/25","04/25","05/25","06/25","07/25","08/25","09/25","10/25","11/25","12/25","01/26","02/26","03/26"],
  gmv:    [2512239,2129007,1667665,2045910,1436299,1856686,1148138,1750748,1784880,1994413,1567281,1687690,1498333,1952667,1382277,3127433],
  ads:    [98839,69551,187602,364067,159923,258652,183845,213129,244212,410019,357205,311245,281486,344094,100235,103303],
  ado:    [387,249,231,225,280,575,474,938,250,785,799,260,250,696,320,416],
  aov:    [6492,8550,7219,9093,5130,3229,2422,1866,7140,2541,1962,6491,5993,2806,4320,7518],
  roas:   [25.42,30.61,8.89,5.62,8.98,7.18,6.25,8.21,7.31,4.86,4.39,5.42,5.32,5.67,13.79,30.27]
};

var metaLiveChartInstance = null;

function renderMetaLiveChart() {
  var canvas = document.getElementById('metaLiveChart');
  if (!canvas) return;
  if (metaLiveChartInstance) { metaLiveChartInstance.destroy(); metaLiveChartInstance = null; }
  var ctx = canvas.getContext('2d');
  var gridColor = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || 'rgba(255,255,255,0.06)';
  var textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || 'rgba(255,255,255,0.45)';

  metaLiveChartInstance = new Chart(ctx, {
    data: {
      labels: META_LIVE_DATA.months,
      datasets: [
        {
          type: 'bar',
          label: 'GMV',
          data: META_LIVE_DATA.gmv,
          backgroundColor: 'rgba(83,64,110,0.7)',
          borderColor: '#53406e',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'yLeft',
          order: 2
        },
        {
          type: 'line',
          label: '廣告費',
          data: META_LIVE_DATA.ads,
          borderColor: '#e8a825',
          borderWidth: 2,
          borderDash: [6,3],
          pointBackgroundColor: '#e8a825',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.3,
          yAxisID: 'yLeft',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(30,25,40,0.95)',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.8)',
          borderColor: 'rgba(196,181,220,0.2)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          callbacks: {
            label: function(context) {
              var label = context.dataset.label || '';
              var val = context.parsed.y;
              return label + '：NT$' + Math.round(val).toLocaleString('en-US');
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } }
        },
        yLeft: {
          type: 'linear',
          position: 'left',
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { size: 11 },
            callback: function(v) {
              if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
              if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
              return v;
            }
          },
          title: { display: true, text: 'NT$', color: textColor, font: { size: 11 } }
        }
      }
    }
  });
}

function renderMetaLiveTable() {
  var tbody = document.getElementById('metaLiveTableBody');
  if (!tbody) return;
  var html = '';
  var d = META_LIVE_DATA;
  for (var i = d.months.length - 1; i >= 0; i--) {
    var roas = d.roas[i];
    var roasCls = roas >= 10 ? 'kpi-delta up' : roas >= 6 ? '' : 'kpi-delta down';
    html += '<tr>';
    html += '<td style="font-weight:600;">' + d.months[i] + '</td>';
    html += '<td>NT$' + d.gmv[i].toLocaleString('en-US') + '</td>';
    html += '<td>NT$' + d.ads[i].toLocaleString('en-US') + '</td>';
    html += '<td><span class="' + roasCls + '">' + roas.toFixed(1) + 'x</span></td>';
    html += '<td>' + d.ado[i].toLocaleString('en-US') + '</td>';
    html += '<td>NT$' + d.aov[i].toLocaleString('en-US') + '</td>';
    html += '</tr>';
  }
  tbody.innerHTML = html;
}

// Initialize when Meta-live sub-panel is first shown
var metaLiveChartInitialized = false;
function tryInitMetaLiveChart() {
  if (metaLiveChartInitialized) return;
  var canvas = document.getElementById('metaLiveChart');
  if (canvas && canvas.offsetParent !== null) {
    metaLiveChartInitialized = true;
    renderMetaLiveChart();
    renderMetaLiveTable();
  }
}

// Hook into sub-panel switching (extend existing override)
var _origSwitchSubMeta = switchSalesSubPanel;
switchSalesSubPanel = function(subId) {
  _origSwitchSubMeta(subId);
  if (subId === 'sales-meta-live') {
    setTimeout(tryInitMetaLiveChart, 100);
  }
};
document.querySelectorAll('.tab-dropdown-item').forEach(function(item) {
  item.addEventListener('click', function() {
    if (item.dataset.sub === 'sales-meta-live') {
      setTimeout(tryInitMetaLiveChart, 150);
    }
  });
});
// Try on load in case already active
setTimeout(tryInitMetaLiveChart, 600);
