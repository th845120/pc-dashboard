// ===== THEME TOGGLE =====
(function () {
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  r.setAttribute('data-theme', d);
  if (t) {
    t.innerHTML = d === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    t.addEventListener('click', () => {
      d = d === 'dark' ? 'light' : 'dark';
      r.setAttribute('data-theme', d);
      t.setAttribute('aria-label', d === 'dark' ? '切換淺色模式' : '切換深色模式');
      t.innerHTML = d === 'dark'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
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
        backgroundColor: ['#4ade80', '#fbbf24', '#f87171'],
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
        backgroundColor: ['#4ade80cc', '#fbbf24cc', '#f87171cc'],
        borderColor: ['#4ade80', '#fbbf24', '#f87171'],
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
            color: '#7a7570',
          },
          border: { display: false },
        },
        y: {
          type: 'logarithmic',
          grid: {
            color: 'rgba(120,115,110,0.12)',
          },
          ticks: {
            font: { family: "'Noto Sans TC', sans-serif", size: 11 },
            color: '#7a7570',
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
function animateCounter(el, target, duration = 1200) {
  const start = performance.now();
  const isFloat = String(target).includes('.');
  const decimals = isFloat ? String(target).split('.')[1].length : 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = target * ease;
    el.textContent = isFloat
      ? current.toFixed(decimals)
      : Math.round(current).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// Trigger counters on load
const kpiValues = document.querySelectorAll('.kpi-value');
const kpiData = [
  { el: kpiValues[0], val: 4.99, float: true },
  { el: kpiValues[1], val: 99.75, float: true },
  { el: kpiValues[2], val: 141988 },
  { el: kpiValues[3], val: 366 },
  { el: kpiValues[4], val: 0 },
  { el: kpiValues[5], val: 75 },
  { el: kpiValues[6], val: 16366 },
  { el: kpiValues[7], val: 100 },
  { el: kpiValues[8], val: 275 },
];

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      kpiData.forEach(({ el, val, float }) => {
        if (el) animateCounter(el, val, 1000);
      });
      observer.disconnect();
    }
  });
}, { threshold: 0.2 });

const firstKpi = document.querySelector('.kpi-grid');
if (firstKpi) observer.observe(firstKpi);
