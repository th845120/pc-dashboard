// ===== PLAYGROUND TAB — 互動實驗室 =====
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
    milestoneArea.innerHTML = '<div class="pg-milestone-text">將游標移到上方卡片，查看裡程碑感言 ✨</div>';
    section.appendChild(milestoneArea);
    var milestoneText = milestoneArea.querySelector('.pg-milestone-text');
    var defaultHint = '將游標移到上方卡片，查看裡程碑感言 ✨';

    counters.forEach(function(c, idx) {
      var card = document.createElement('div');
      card.className = 'pg-counter-card';
      card.innerHTML =
        '<div class="pg-counter-value" style="color:' + c.color + ';" data-target="' + c.value + '" data-prefix="' + c.prefix + '" data-suffix="' + c.suffix + '">' +
        c.prefix + '0' + c.suffix + '</div>' +
        '<div class="pg-counter-label">' + c.label + '</div>';
      grid.appendChild(card);

      // Hover events for milestone message
      card.addEventListener('mouseenter', function() {
        milestoneText.style.opacity = '0';
        setTimeout(function() {
          milestoneText.textContent = c.message;
          milestoneText.classList.add('active');
          milestoneText.style.opacity = '1';
        }, 150);
      });
      card.addEventListener('mouseleave', function() {
        milestoneText.style.opacity = '0';
        setTimeout(function() {
          milestoneText.textContent = defaultHint;
          milestoneText.classList.remove('active');
          milestoneText.style.opacity = '1';
        }, 150);
      });
    });

    // Animate with easing
    var els = grid.querySelectorAll('.pg-counter-value');
    els.forEach(function(el) {
      var target = parseFloat(el.dataset.target);
      var prefix = el.dataset.prefix;
      var suffix = el.dataset.suffix;
      var isDecimal = target % 1 !== 0;
      var duration = 2000;
      var start = performance.now();

      function tick(now) {
        var t = Math.min((now - start) / duration, 1);
        // ease-out cubic
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
  }

  // ===== 2. INTERACTIVE RING CHART (D3) =====
  function initRingChart() {
    var container = document.getElementById('pgRingChart');
    var legendEl = document.getElementById('pgRingLegend');
    if (!container || typeof d3 === 'undefined') return;

    var data = [
      { name: '紫水晶', value: 28, color: '#9b59b6' },
      { name: '粉水晶', value: 22, color: '#e91e8c' },
      { name: '白水晶', value: 18, color: '#bdc3c7' },
      { name: '黃水晶', value: 14, color: '#f39c12' },
      { name: '黑曜石', value: 10, color: '#2c3e50' },
      { name: '其他', value: 8, color: '#53406e' },
    ];

    var width = 320, height = 320;
    var radius = Math.min(width, height) / 2;
    var innerRadius = radius * 0.55;

    container.innerHTML = '';
    var svg = d3.select(container)
      .append('svg')
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('class', 'pg-ring-svg')
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    var pie = d3.pie().value(function(d) { return d.value; }).sort(null).padAngle(0.02);
    var arc = d3.arc().innerRadius(innerRadius).outerRadius(radius - 4);
    var arcHover = d3.arc().innerRadius(innerRadius).outerRadius(radius + 8);

    // Center text
    var centerText = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('class', 'pg-ring-center');

    var centerName = centerText.append('tspan')
      .attr('x', 0).attr('dy', '-0.4em')
      .attr('class', 'pg-ring-center-name')
      .text('總計');
    var centerVal = centerText.append('tspan')
      .attr('x', 0).attr('dy', '1.6em')
      .attr('class', 'pg-ring-center-val')
      .text('100%');

    var arcs = svg.selectAll('.pg-arc')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('class', 'pg-arc')
      .attr('fill', function(d) { return d.data.color; })
      .attr('d', arc)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition().duration(200)
          .attr('d', arcHover)
          .style('filter', 'drop-shadow(0 0 12px ' + d.data.color + '88)');
        centerName.text(d.data.name);
        centerVal.text(d.data.value + '%');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition().duration(200)
          .attr('d', arc)
          .style('filter', 'none');
        centerName.text('總計');
        centerVal.text('100%');
      });

    // Entry animation: sweep from 0
    arcs.transition()
      .duration(800)
      .attrTween('d', function(d) {
        var i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
        return function(t) { return arc(i(t)); };
      });

    // Legend
    legendEl.innerHTML = '';
    data.forEach(function(d) {
      var item = document.createElement('div');
      item.className = 'pg-ring-legend-item';
      item.innerHTML = '<span class="pg-ring-legend-dot" style="background:' + d.color + ';"></span>' +
        '<span>' + d.name + '</span><span class="pg-ring-legend-pct">' + d.value + '%</span>';
      legendEl.appendChild(item);
    });
  }

  // ===== 3. BAR CHART RACE =====
  function initRaceChart() {
    var container = document.getElementById('pgRaceChart');
    var timelineEl = document.getElementById('pgRaceTimeline');
    var playBtn = document.getElementById('pgRacePlay');
    if (!container || typeof d3 === 'undefined') return;

    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var years = {
      2024: [null,null,839114,419141,1163383,1168206,1398145,1279539,417360,709423,723213,785941],
      2025: [699028,1140141,1033369,1085720,1299852,1843769,2152000,1342820,789236,1024300,1025103,705297],
      2026: [971098,1562399,782417,null,null,null,null,null,null,null,null,null]
    };

    var colors = { 2024: '#e8a825', 2025: '#3dbf7a', 2026: '#9b59b6' };
    var allFrames = [];

    // Build frames: each month across years
    for (var m = 0; m < 12; m++) {
      var frame = [];
      [2024, 2025, 2026].forEach(function(y) {
        var val = years[y][m];
        if (val !== null && val !== undefined) {
          frame.push({ year: String(y), value: val, color: colors[y] });
        }
      });
      if (frame.length > 0) {
        frame.sort(function(a, b) { return b.value - a.value; });
        allFrames.push({ month: MONTHS[m], data: frame });
      }
    }

    var margin = { top: 30, right: 90, bottom: 10, left: 50 };
    var barHeight = 42;

    function renderFrame(idx) {
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

      // Month label
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

      // Year label
      bars.append('text')
        .attr('x', margin.left - 8)
        .attr('y', barHeight / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('class', 'pg-race-label')
        .text(function(d) { return d.year; });

      // Bars with animation
      bars.append('rect')
        .attr('x', margin.left)
        .attr('y', 0)
        .attr('height', barHeight)
        .attr('rx', 6)
        .attr('fill', function(d) { return d.color; })
        .attr('width', 0)
        .transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr('width', function(d) { return Math.max(0, x(d.value) - margin.left); });

      // Glow effect
      bars.append('rect')
        .attr('x', margin.left)
        .attr('y', 0)
        .attr('height', barHeight)
        .attr('rx', 6)
        .attr('fill', function(d) { return d.color; })
        .attr('opacity', 0.15)
        .attr('filter', 'blur(8px)')
        .attr('width', 0)
        .transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr('width', function(d) { return Math.max(0, x(d.value) - margin.left); });

      // Value labels
      bars.append('text')
        .attr('y', barHeight / 2 + 5)
        .attr('class', 'pg-race-value')
        .attr('x', margin.left + 4)
        .transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr('x', function(d) { return x(d.value) + 6; })
        .textTween(function(d) {
          var i = d3.interpolateNumber(0, d.value);
          return function(t) { return 'NT$' + Math.round(i(t)).toLocaleString('en-US'); };
        });
    }

    // Timeline dots
    timelineEl.innerHTML = '';
    allFrames.forEach(function(f, i) {
      var dot = document.createElement('button');
      dot.className = 'pg-race-dot' + (i === 0 ? ' active' : '');
      dot.textContent = f.month;
      dot.addEventListener('click', function() {
        timelineEl.querySelectorAll('.pg-race-dot').forEach(function(d) { d.classList.remove('active'); });
        dot.classList.add('active');
        renderFrame(i);
      });
      timelineEl.appendChild(dot);
    });

    renderFrame(0);

    // Play button
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
        renderFrame(idx);
        idx++;
        if (idx >= allFrames.length) {
          clearInterval(timer);
          playing = false;
          playBtn.textContent = '▶ 播放';
        }
      }, 900);
    });
  }

  // ===== 4. HEATMAP =====
  function initHeatmap() {
    var container = document.getElementById('pgHeatmap');
    if (!container || typeof d3 === 'undefined') return;

    var months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    var years = ['2024', '2025', '2026'];
    var revenue = {
      2024: [null,null,839114,419141,1163383,1168206,1398145,1279539,417360,709423,723213,785941],
      2025: [699028,1140141,1033369,1085720,1299852,1843769,2152000,1342820,789236,1024300,1025103,705297],
      2026: [971098,1562399,782417,null,null,null,null,null,null,null,null,null]
    };

    var cells = [];
    years.forEach(function(y) {
      months.forEach(function(m, mi) {
        var val = revenue[y][mi];
        cells.push({ year: y, month: m, monthIdx: mi, value: val });
      });
    });

    var cellW = 60, cellH = 50, gap = 3;
    var marginLeft = 50, marginTop = 35;
    var w = marginLeft + months.length * (cellW + gap);
    var h = marginTop + years.length * (cellH + gap);

    var allVals = cells.filter(function(c) { return c.value !== null; }).map(function(c) { return c.value; });
    var colorScale = d3.scaleSequential()
      .domain([d3.min(allVals), d3.max(allVals)])
      .interpolator(d3.interpolateRgbBasis(['#1a1128', '#53406e', '#9b59b6', '#e8a825', '#3dbf7a']));

    container.innerHTML = '';
    var svg = d3.select(container)
      .append('svg')
      .attr('viewBox', '0 0 ' + w + ' ' + h)
      .attr('class', 'pg-heatmap-svg');

    // Month labels
    svg.selectAll('.pg-hm-mlabel')
      .data(months)
      .enter()
      .append('text')
      .attr('x', function(d, i) { return marginLeft + i * (cellW + gap) + cellW / 2; })
      .attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('class', 'pg-hm-label')
      .text(function(d) { return d; });

    // Year labels
    svg.selectAll('.pg-hm-ylabel')
      .data(years)
      .enter()
      .append('text')
      .attr('x', marginLeft - 10)
      .attr('y', function(d, i) { return marginTop + i * (cellH + gap) + cellH / 2 + 5; })
      .attr('text-anchor', 'end')
      .attr('class', 'pg-hm-label')
      .text(function(d) { return d; });

    // Tooltip
    var tooltip = d3.select(container)
      .append('div')
      .attr('class', 'pg-hm-tooltip')
      .style('opacity', 0);

    // Cells
    svg.selectAll('.pg-hm-cell')
      .data(cells)
      .enter()
      .append('rect')
      .attr('x', function(d) { return marginLeft + d.monthIdx * (cellW + gap); })
      .attr('y', function(d) {
        var yi = years.indexOf(d.year);
        return marginTop + yi * (cellH + gap);
      })
      .attr('width', cellW)
      .attr('height', cellH)
      .attr('rx', 6)
      .attr('fill', function(d) { return d.value !== null ? colorScale(d.value) : 'var(--color-surface-2)'; })
      .attr('class', 'pg-hm-cell')
      .attr('opacity', 0)
      .on('mouseenter', function(event, d) {
        if (d.value === null) return;
        d3.select(this).style('filter', 'brightness(1.3) drop-shadow(0 0 8px ' + colorScale(d.value) + '88)');
        tooltip
          .style('opacity', 1)
          .html('<strong>' + d.year + '年 ' + d.month + '</strong><br>NT$' + d.value.toLocaleString('en-US'));
        var rect = container.getBoundingClientRect();
        var mouseX = event.clientX - rect.left;
        var mouseY = event.clientY - rect.top;
        tooltip.style('left', mouseX + 'px').style('top', (mouseY - 60) + 'px');
      })
      .on('mouseleave', function() {
        d3.select(this).style('filter', 'none');
        tooltip.style('opacity', 0);
      })
      .transition()
      .duration(400)
      .delay(function(d, i) { return i * 25; })
      .attr('opacity', 1);
  }

  // ===== 5. PARTICLES =====
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

    // Create particles
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

    canvas.addEventListener('mousemove', function(e) {
      var rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    function draw() {
      var w = canvas.width / dpr;
      var h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      particles.forEach(function(p) {
        // Mouse repulsion
        var dx = p.x - mouseX;
        var dy = p.y - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          var force = (120 - dist) / 120 * 0.8;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(155, 89, 182, ' + p.opacity + ')';
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(155, 89, 182, ' + (p.opacity * 0.15) + ')';
        ctx.fill();
      });

      // Draw connections
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
