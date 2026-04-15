// ===== TAB SWITCHING =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById('tab-' + target).classList.add('active');
  });
});

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
        data: [16510, 33, 8],
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
        data: [16510, 33, 8],
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
const kpiValues = document.querySelectorAll('.kpi-value');
const kpiData = [
  // 蝦皮 (0-5)
  { el: kpiValues[0], val: 4.99, float: true },
  { el: kpiValues[1], val: 99.75, float: true, suffix: '%' },
  { el: kpiValues[2], val: 141988 },
  { el: kpiValues[3], val: 366 },
  { el: kpiValues[4], val: 0, suffix: '%' },
  { el: kpiValues[5], val: 75, suffix: '%' },
  // Meta (6-8)
  { el: kpiValues[6], val: 16366 },
  { el: kpiValues[7], val: 100, suffix: '%' },
  { el: kpiValues[8], val: 275 },
  // Instagram (9-11)
  { el: kpiValues[9], val: 4213 },
  { el: kpiValues[10], val: 245 },
  { el: kpiValues[11], val: 155 },
  // Google Business Profile (12-13) — 14 is address, skip animation
  { el: kpiValues[12], val: 5.0, float: true },
  { el: kpiValues[13], val: 55 },
];

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

// 顏色：最後一筆紅，其餘品牌紫
function barBg(data) {
  return data.map((_, i) => i === data.length - 1 ? '#e05555' : 'rgba(196,181,220,0.55)');
}
function barBorder(data) {
  return data.map((_, i) => i === data.length - 1 ? '#e05555' : '#c4b5dc');
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
      plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: ctx => ` ${ctx.parsed.y}%` } } },
      scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: v => v + '%' } } },
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

  // ── 跳出率 donut（固定，不隨月份變）──
  upsertChart('salesBounceChart', {
    type: 'doughnut',
    data: {
      labels: ['手機 26.92%', '電腦 73.80%'],
      datasets: [{
        data: [26.92, 73.80],
        backgroundColor: ['#3dbf7a', '#e05555'],
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#b0a6c0', font: { family: "'Noto Sans TC', sans-serif", size: 12 }, padding: 12 } },
        tooltip: { ...sharedTooltip, callbacks: { label: ctx => ` ${ctx.label}` } }
      },
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
  const html = rows.map(function(d) {
    const isLatest = !!d.isLatest;
    const fansVal = d.fans < 0 ? d.fans.toLocaleString() : '+' + d.fans.toLocaleString();
    const fansClass = d.fans < 0 ? 'cell-bad' : '';
    const rowClass = isLatest ? 'highlight-row' : '';
    const cellCls = isLatest ? 'cell-bad' : '';
    const bold = function(v) { return isLatest ? '<strong>' + v + '</strong>' : v; };
    const monthCell = isLatest ? '<strong>' + d.month + '</strong>' : d.month;
    return '<tr class="' + rowClass + '">' +
      '<td>' + monthCell + '</td>' +
      '<td class="' + fansClass + '">' + bold(fansVal) + '</td>' +
      '<td class="' + cellCls + '">' + bold(d.newbuyer) + '</td>' +
      '<td class="' + cellCls + '">' + bold(d.repurchase) + '</td>' +
      '<td class="' + cellCls + '">' + bold(d.cvr) + '</td>' +
      '<td class="' + cellCls + '">' + bold(d.aov) + '</td>' +
      '<td>' + bold(d.mBounce) + '</td>' +
      '<td>' + bold(d.pcBounce) + '</td>' +
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
  upsertChart('salesCvrChart',        { type: 'line', data: { labels: labels, datasets: [mkLine(cvr)]    }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...sharedTooltip, callbacks: { label: function(ctx) { return ' ' + ctx.parsed.y + '%'; } } } }, scales: { x: sharedScaleX, y: { ...sharedScaleY, ticks: { ...sharedScaleY.ticks, callback: function(v) { return v + '%'; } } } }, animation: { duration: 600, easing: 'easeInOutQuart' } } });
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
  function open()  { popover.classList.add('open'); renderArea(); }

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
      } else if (preset === '6m') {
        var idx6 = Math.max(0, ALL_MONTHS.length - 6);
        state.from = parseInt(ALL_MONTHS[idx6]); state.to = 999999;
        updateLabels('近 6 個月');
      } else if (preset === '12m') {
        var idx12 = Math.max(0, ALL_MONTHS.length - 12);
        state.from = parseInt(ALL_MONTHS[idx12]); state.to = 999999;
        updateLabels('近 12 個月');
      } else if (preset === 'custom') {
        state.step = 'from-year';
        state.pendingFrom = null; state.pendingTo = null;
        renderArea();
        return;
      }
      renderArea();
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
