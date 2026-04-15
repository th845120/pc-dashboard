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

function initSalesCharts() {
  if (salesChartsInitialized) return;
  salesChartsInitialized = true;

const salesMonths = ['202412','202501','202502','202503','202504','202505','202506','202507','202508','202509','202510','202511','202512','202601','202602','202603'];

const salesFansData     = [4733, 6214, 2310, 749, 1600, 9610, 3979, 3237, 3139, 1845, 685, 2038, 2673, 2215, 4712, -253];
const salesNewBuyerData = [139, 153, 229, 189, 193, 213, 248, 159, 150, 122, 129, 113, 84, 95, 98, 87];
const salesRepurchase   = [11.48, 12.55, 14.70, 21.71, 21.72, 20.73, 28.38, 28.76, 25.71, 16.03, 23.81, 18.95, 24.54, 22.43, 34.07, 29.53];
const salesCvr          = [0.52, 0.54, 0.71, 1.01, 1.04, 0.72, 0.52, 0.50, 0.58, 0.40, 0.33, 0.44, 0.42, 0.47, 0.65, 0.44];
const salesAov          = [3173, 3351, 3869, 3896, 3962, 4312, 4930, 8135, 5597, 3994, 4909, 5280, 5209, 5904, 4041, 3837];

// 共用顏色函式：最後一筆（202603）標紅，其餘用品牌紫/藍
function barColors(data, goodUp = true) {
  return data.map((v, i) => {
    if (i === data.length - 1) return 'rgba(224,85,85,0.85)';
    return 'rgba(196,181,220,0.55)';
  });
}
function barBorderColors(data) {
  return data.map((v, i) => i === data.length - 1 ? '#e05555' : '#c4b5dc');
}

// 共用 line dataset
function lineDataset(data) {
  const colors = data.map((v, i) => i === data.length - 1 ? '#e05555' : '#c4b5dc');
  return {
    data,
    borderColor: '#c4b5dc',
    backgroundColor: 'rgba(196,181,220,0.08)',
    tension: 0.35,
    fill: true,
    pointRadius: data.map((_, i) => i === data.length - 1 ? 6 : 3),
    pointBackgroundColor: colors,
    pointBorderColor: colors,
    borderWidth: 2,
  };
}

// 共用 scale 設定
const sharedScales = {
  x: {
    grid: { display: false },
    ticks: { font: { family: "'Noto Sans TC', sans-serif", size: 10 }, color: '#b0a6c0', maxRotation: 45 },
    border: { display: false },
  },
  y: {
    grid: { color: 'rgba(180,170,200,0.1)' },
    ticks: { font: { family: "'Noto Sans TC', sans-serif", size: 11 }, color: '#b0a6c0' },
    border: { display: false },
  }
};

const sharedOptions = (yLabel = '') => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      bodyFont: { family: "'Noto Sans TC', sans-serif", size: 13 },
      padding: 10,
    }
  },
  scales: {
    ...sharedScales,
    y: {
      ...sharedScales.y,
      title: yLabel ? { display: true, text: yLabel, color: '#b0a6c0', font: { size: 11 } } : undefined,
    }
  },
  animation: { duration: 900, easing: 'easeInOutQuart' }
});

// 粉絲增長（包含負值 → bar chart）
const fansBars = salesFansData.map((v, i) => i === salesFansData.length - 1 ? '#e05555' : (v >= 0 ? '#c4b5dc' : '#e05555'));
const salesFansCtx = document.getElementById('salesFansChart');
if (salesFansCtx) {
  new Chart(salesFansCtx, {
    type: 'bar',
    data: {
      labels: salesMonths,
      datasets: [{ data: salesFansData, backgroundColor: fansBars, borderRadius: 5, borderSkipped: false }]
    },
    options: {
      ...sharedOptions(),
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y.toLocaleString()} 人` }, bodyFont: { family: "'Noto Sans TC', sans-serif", size: 13 }, padding: 10 } },
      scales: { ...sharedOptions().scales, y: { ...sharedOptions().scales.y, ticks: { ...sharedOptions().scales.y.ticks, callback: v => (v > 0 ? '+' : '') + v.toLocaleString() } } }
    }
  });
}

// 新客增長（bar）
const salesNewBuyerCtx = document.getElementById('salesNewBuyerChart');
if (salesNewBuyerCtx) {
  new Chart(salesNewBuyerCtx, {
    type: 'bar',
    data: {
      labels: salesMonths,
      datasets: [{ data: salesNewBuyerData, backgroundColor: barColors(salesNewBuyerData), borderColor: barBorderColors(salesNewBuyerData), borderWidth: 1.5, borderRadius: 5, borderSkipped: false }]
    },
    options: { ...sharedOptions('人'), plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} 人` }, bodyFont: { family: "'Noto Sans TC', sans-serif", size: 13 }, padding: 10 } } }
  });
}

// 複購率（line）
const salesRepurchaseCtx = document.getElementById('salesRepurchaseChart');
if (salesRepurchaseCtx) {
  new Chart(salesRepurchaseCtx, {
    type: 'line',
    data: { labels: salesMonths, datasets: [lineDataset(salesRepurchase)] },
    options: { ...sharedOptions('%'), plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}%` }, bodyFont: { family: "'Noto Sans TC', sans-serif", size: 13 }, padding: 10 } } }
  });
}

// 轉換率（line）
const salesCvrCtx = document.getElementById('salesCvrChart');
if (salesCvrCtx) {
  new Chart(salesCvrCtx, {
    type: 'line',
    data: { labels: salesMonths, datasets: [lineDataset(salesCvr)] },
    options: { ...sharedOptions('%'), plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}%` }, bodyFont: { family: "'Noto Sans TC', sans-serif", size: 13 }, padding: 10 } } }
  });
}

// 平均客單價（line）
const salesAovCtx = document.getElementById('salesAovChart');
if (salesAovCtx) {
  new Chart(salesAovCtx, {
    type: 'line',
    data: { labels: salesMonths, datasets: [lineDataset(salesAov)] },
    options: { ...sharedOptions('NT$'), plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` NT$${ctx.parsed.y.toLocaleString()}` }, bodyFont: { family: "'Noto Sans TC', sans-serif", size: 13 }, padding: 10 } } }
  });
}

// 跳出率對比 donut（手機 vs 電腦）
const salesBounceCtx = document.getElementById('salesBounceChart');
if (salesBounceCtx) {
  new Chart(salesBounceCtx, {
    type: 'doughnut',
    data: {
      labels: ['手機跳出率', '電腦跳出率'],
      datasets: [{ data: [26.92, 73.80], backgroundColor: ['#3dbf7a', '#e05555'], borderColor: 'transparent', borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#b0a6c0', font: { family: "'Noto Sans TC', sans-serif", size: 12 }, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}：${ctx.parsed}%` }, bodyFont: { family: "'Noto Sans TC', sans-serif", size: 13 }, padding: 10 }
      },
      animation: { duration: 900, easing: 'easeInOutQuart' }
    }
  });
}

}

// 監聽 Tab 切換，切到銷售數據時才初始化
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tab === 'sales') {
      // 給 DOM 一個 frame 時間讓 canvas 出現
      requestAnimationFrame(() => setTimeout(initSalesCharts, 50));
    }
  });
});
