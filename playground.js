// ===== PLAYGROUND TAB — 里程碑 =====
(function() {
  var initialized = false;

  function initPlayground() {
    if (initialized) return;
    initialized = true;
    initCounters();
    initParticles();
  }

  // Listen for tab switch
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (btn.dataset.tab === 'playground') {
        requestAnimationFrame(function() { setTimeout(initPlayground, 80); });
      }
    });
  });

  // ===== 1. ANIMATED COUNTERS =====
  function initCounters() {
    var counters = [
      { label: '累計營業額', value: 61181971, prefix: 'NT$', suffix: '', color: 'var(--color-primary)',
        message: '這是聚寶水晶從成立到現在，累積的營業額哦！感謝你對公司的付出，未來讓我們一起繼續加油 ヾ(´︶`*)ﾉ♬' },
      { label: '累計訂單數', value: 26269, prefix: '', suffix: ' 筆', color: '#3dbf7a',
        message: '這是聚寶水晶從成立到現在，總共出貨的訂單數量！不知不覺已經服務了好多客人，我們把一條條用心挑選的水晶交付到客人手上，真的很有成就感，也辛苦出貨夥伴了，看到他記得跟他說聲「辛苦了」哦 :)' },
      { label: '粉絲總數', value: 162750, prefix: '', suffix: ' 人', color: '#e8a825',
        message: '這是我們全網的粉絲數哦！我們不期望這個數字變得多大，只希望珍惜每一個與聚寶水晶相遇的客人哦  (❁´◡`❁)' },
    ];

    var grid = document.getElementById('pgCounterGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Build milestone message area below grid
    var section = grid.parentElement;
    var existingMsg = section.querySelector('.pg-milestone-area');
    if (existingMsg) existingMsg.remove();
    var milestoneArea = document.createElement('div');
    milestoneArea.className = 'pg-milestone-area';
    var isTouchHint = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    var defaultHint = isTouchHint ? '點擊上方卡片，查看裡程碑感言 ✨' : '將游標移到上方卡片，查看裡程碑感言 ✨';
    milestoneArea.innerHTML = '<div class="pg-milestone-text">' + defaultHint + '</div>';
    section.appendChild(milestoneArea);
    var milestoneText = milestoneArea.querySelector('.pg-milestone-text');

    // Shared timer for all cards
    var msTimer = null;
    function showMessage(msg, isActive) {
      if (msTimer) clearTimeout(msTimer);
      milestoneText.style.opacity = '0';
      msTimer = setTimeout(function() {
        milestoneText.textContent = msg;
        if (isActive) milestoneText.classList.add('active');
        else milestoneText.classList.remove('active');
        milestoneText.style.opacity = '1';
        msTimer = null;
      }, 200);
    }

    var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    var pinnedMsg = null;

    counters.forEach(function(c, idx) {
      var card = document.createElement('div');
      card.className = 'pg-counter-card';
      card.innerHTML =
        '<div class="pg-counter-value" style="color:' + c.color + ';" data-target="' + c.value + '" data-prefix="' + c.prefix + '" data-suffix="' + c.suffix + '">' +
        c.prefix + '0' + c.suffix + '</div>' +
        '<div class="pg-counter-label">' + c.label + '</div>';
      grid.appendChild(card);

      if (!isTouchDevice) {
        card.addEventListener('mouseenter', function() {
          showMessage(c.message, true);
        });
        card.addEventListener('mouseleave', function() {
          if (!pinnedMsg) {
            showMessage(defaultHint, false);
          } else {
            showMessage(pinnedMsg, true);
          }
        });
      }
      card.addEventListener('click', function() {
        if (pinnedMsg === c.message) {
          pinnedMsg = null;
          showMessage(defaultHint, false);
        } else {
          pinnedMsg = c.message;
          showMessage(c.message, true);
        }
      });
    });

    // Pre-calculate the fitted font size for each counter based on final value
    function calcFitSize(el, text) {
      var card = el.closest('.pg-counter-card');
      if (!card) return 44;
      var cardW = card.clientWidth - 48;
      // Use a hidden span to measure
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

    // Animate with easing
    var els = grid.querySelectorAll('.pg-counter-value');
    els.forEach(function(el) {
      var target = parseFloat(el.dataset.target);
      var prefix = el.dataset.prefix;
      var suffix = el.dataset.suffix;
      var isDecimal = target % 1 !== 0;
      var duration = 2000;

      // Pre-calculate final text and font size BEFORE animation starts
      var finalText = isDecimal
        ? prefix + target.toFixed(2) + suffix
        : prefix + target.toLocaleString('en-US') + suffix;
      var fitSize = calcFitSize(el, finalText);
      el.style.fontSize = fitSize + 'px';

      var start = performance.now();
      function tick(now) {
        var t = Math.min((now - start) / duration, 1);
        var ease = 1 - Math.pow(1 - t, 3);
        var current = target * ease;
        if (isDecimal) {
          el.textContent = prefix + current.toFixed(2) + suffix;
        } else {
          el.textContent = prefix + Math.round(current).toLocaleString('en-US') + suffix;
        }
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });

    // Re-fit on resize
    window.addEventListener('resize', function() {
      els.forEach(function(el) {
        var target = parseFloat(el.dataset.target);
        var prefix = el.dataset.prefix;
        var suffix = el.dataset.suffix;
        var isDecimal = target % 1 !== 0;
        var finalText = isDecimal
          ? prefix + target.toFixed(2) + suffix
          : prefix + target.toLocaleString('en-US') + suffix;
        el.style.fontSize = calcFitSize(el, finalText) + 'px';
      });
    });
  }

  // ===== 2. PARTICLES =====
  function initParticles() {
    var canvas = document.getElementById('pgParticles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var particles = [];
    var mouseX = 0, mouseY = 0;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var COUNT = 80;
    for (var i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width / dpr,
        y: Math.random() * canvas.height / dpr,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    canvas.parentElement.addEventListener('mousemove', function(e) {
      var rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    function draw() {
      var w = canvas.width / dpr;
      var h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      particles.forEach(function(p) {
        var dx = p.x - mouseX;
        var dy = p.y - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          var force = (120 - dist) / 120 * 0.8;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(155, 89, 182, ' + p.opacity + ')';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(155, 89, 182, ' + (p.opacity * 0.15) + ')';
        ctx.fill();
      });

      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(155, 89, 182, ' + (0.15 * (1 - d / 100)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }
    draw();
  }
})();
