// ===== SPLASH SCREEN — Galaxy Starfield + Milky Way =====
(function() {
  var splash = document.getElementById('splashScreen');
  var mainApp = document.getElementById('mainApp');
  var canvas = document.getElementById('splashParticles');
  if (!splash || !canvas) return;

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var stars = [];
  var nebulae = [];
  var shootingStars = [];
  var mouseX = -999, mouseY = -999;
  var milkyWayCanvas = null; // off-screen pre-rendered galaxy band

  // ===== MOBILE GYROSCOPE PARALLAX =====
  var gyroOffsetX = 0, gyroOffsetY = 0;
  var gyroTargetX = 0, gyroTargetY = 0;
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var gyroMaxShift = 18; // max pixel shift
  var gyroListenerAdded = false;
  var gyroPermissionRequested = false;

  function addGyroListener() {
    if (gyroListenerAdded) return;
    gyroListenerAdded = true;
    window.addEventListener('deviceorientation', function(e) {
      // gamma: left-right tilt (-90..90), beta: front-back tilt (-180..180)
      var gamma = e.gamma || 0;
      var beta = e.beta || 0;
      // Clamp to reasonable range
      gamma = Math.max(-45, Math.min(45, gamma));
      beta = Math.max(-45, Math.min(45, beta));
      // Normalize to -1..1
      gyroTargetX = -(gamma / 45) * gyroMaxShift;
      gyroTargetY = -(beta / 45) * gyroMaxShift;
    }, true);
  }

  function requestGyroPermission() {
    if (gyroPermissionRequested) return;
    gyroPermissionRequested = true;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ — must be triggered by user gesture
      DeviceOrientationEvent.requestPermission().then(function(state) {
        if (state === 'granted') addGyroListener();
      }).catch(function() {
        gyroPermissionRequested = false; // allow retry on failure
      });
    } else {
      addGyroListener();
    }
  }

  // Track whether iOS gyro permission needs handling
  var needsIOSGyroPermission = isTouch && window.DeviceOrientationEvent &&
    typeof DeviceOrientationEvent.requestPermission === 'function';

  if (isTouch && window.DeviceOrientationEvent && !needsIOSGyroPermission) {
    // Android / older iOS — just add listener immediately
    addGyroListener();
  }

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderMilkyWay(); // re-render on resize
  }

  // ===== PRE-RENDER MILKY WAY BAND =====
  function renderMilkyWay() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    milkyWayCanvas = document.createElement('canvas');
    milkyWayCanvas.width = w;
    milkyWayCanvas.height = h;
    var mctx = milkyWayCanvas.getContext('2d');

    // Diagonal band from top-left to bottom-right
    // Use multiple elliptical gradients along a diagonal path
    mctx.save();
    mctx.translate(w * 0.5, h * 0.5);
    mctx.rotate(-0.45); // ~25 degree tilt

    // Main galactic band — wide, soft
    var bandW = Math.max(w, h) * 1.8;
    var bandH = h * 0.35;

    // Layer 1: broad diffuse glow
    var g1 = mctx.createRadialGradient(0, 0, 0, 0, 0, bandH * 0.8);
    g1.addColorStop(0, 'rgba(75, 60, 110, 0.28)');
    g1.addColorStop(0.25, 'rgba(60, 50, 100, 0.18)');
    g1.addColorStop(0.5, 'rgba(45, 40, 85, 0.09)');
    g1.addColorStop(1, 'rgba(20, 15, 40, 0)');
    mctx.fillStyle = g1;
    mctx.fillRect(-bandW / 2, -bandH, bandW, bandH * 2);

    // Layer 2: brighter core along the band center
    var g2 = mctx.createRadialGradient(0, 0, 0, 0, 0, bandH * 0.35);
    g2.addColorStop(0, 'rgba(110, 85, 150, 0.22)');
    g2.addColorStop(0.3, 'rgba(90, 70, 130, 0.14)');
    g2.addColorStop(0.6, 'rgba(70, 55, 110, 0.06)');
    g2.addColorStop(1, 'rgba(50, 40, 90, 0)');
    mctx.fillStyle = g2;
    mctx.fillRect(-bandW / 2, -bandH * 0.5, bandW, bandH);

    // Layer 2b: warm highlight streak in core
    var g2b = mctx.createRadialGradient(0, 0, 0, 0, 0, bandH * 0.18);
    g2b.addColorStop(0, 'rgba(130, 100, 170, 0.12)');
    g2b.addColorStop(0.5, 'rgba(100, 80, 140, 0.05)');
    g2b.addColorStop(1, 'rgba(70, 55, 110, 0)');
    mctx.fillStyle = g2b;
    mctx.fillRect(-bandW / 2, -bandH * 0.25, bandW, bandH * 0.5);

    // Layer 3: scattered nebula knots along the band
    var knotCount = 12;
    for (var k = 0; k < knotCount; k++) {
      var kx = (Math.random() - 0.5) * bandW * 0.8;
      var ky = (Math.random() - 0.5) * bandH * 0.5;
      var kr = Math.random() * 120 + 60;
      var colorChoices = [
        [90, 60, 130],   // purple
        [60, 50, 120],   // deep purple
        [50, 65, 130],   // blue-purple
        [100, 55, 95],   // magenta tint
        [70, 75, 140],   // lavender
        [45, 55, 110]    // deep blue
      ];
      var cc = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      var kOp = Math.random() * 0.1 + 0.05;
      var gk = mctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
      gk.addColorStop(0, 'rgba(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ',' + (kOp * 2) + ')');
      gk.addColorStop(0.4, 'rgba(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ',' + kOp + ')');
      gk.addColorStop(1, 'rgba(' + cc[0] + ',' + cc[1] + ',' + cc[2] + ',0)');
      mctx.fillStyle = gk;
      mctx.fillRect(kx - kr, ky - kr, kr * 2, kr * 2);
    }

    // Layer 4: dense star dust — tiny bright dots in the band
    for (var d = 0; d < 500; d++) {
      var dx = (Math.random() - 0.5) * bandW * 0.85;
      // Gaussian-ish distribution toward center
      var dy = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * bandH * 0.3;
      var dr = Math.random() * 0.6 + 0.2;
      var dop = Math.random() * 0.5 + 0.15;
      mctx.beginPath();
      mctx.arc(dx, dy, dr, 0, Math.PI * 2);
      mctx.fillStyle = 'rgba(200, 195, 230, ' + dop + ')';
      mctx.fill();
    }

    mctx.restore();
  }

  // ===== EMPLOYEE STARS DATA =====
  var employeeStars = [
    // Active employees — bright, with orbiting ring
    { name: 'JING', active: true },
    { name: '靚潔', active: true },
    { name: 'Jerry', active: true },
    { name: '阿嬤', active: true },
    { name: '郁芩', active: true },
    // Inactive employees — dim, no ring
    { name: '佩瑾', active: false },
    { name: 'Emma', active: false },
    { name: '珍妮', active: false },
    { name: '雨恩', active: false },
  ];

  // Generate random positions avoiding center logo zone + mutual spacing
  function randomizeEmployeePositions() {
    // Exclusion zone for center logo (ratio-based)
    var exL = 0.28, exR = 0.72, exT = 0.20, exB = 0.70;
    // Margin from edges
    var margin = 0.06;
    var minDist = 0.18; // minimum ratio-distance between any two employee stars
    var placed = [];

    for (var i = 0; i < employeeStars.length; i++) {
      var attempts = 0, rx, ry, tooClose;
      do {
        rx = margin + Math.random() * (1 - 2 * margin);
        ry = margin + Math.random() * (1 - 2 * margin);
        // Reject if inside center logo zone
        var inCenter = (rx > exL && rx < exR && ry > exT && ry < exB);
        // Reject if too close to already-placed stars
        tooClose = false;
        for (var j = 0; j < placed.length; j++) {
          var dx = rx - placed[j][0], dy = ry - placed[j][1];
          if (Math.sqrt(dx * dx + dy * dy) < minDist) { tooClose = true; break; }
        }
        attempts++;
      } while ((inCenter || tooClose) && attempts < 200);
      employeeStars[i].posRatioX = rx;
      employeeStars[i].posRatioY = ry;
      placed.push([rx, ry]);
    }
  }

  function initField() {
    stars = [];
    nebulae = [];
    var w = window.innerWidth;
    var h = window.innerHeight;

    // --- Stars: 3 layers ---
    // Layer 1: tiny distant stars
    for (var i = 0; i < 400; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 0.8 + 0.3,
        baseOpacity: Math.random() * 0.5 + 0.3,
        twinkle: false,
        color: [220, 225, 255],
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06
      });
    }
    // Layer 2: medium stars (some twinkle)
    for (var i = 0; i < 150; i++) {
      var willTwinkle = Math.random() < 0.6;
      var colorRoll = Math.random();
      var col = colorRoll < 0.35
        ? [200, 215, 255]
        : colorRoll < 0.65
          ? [255, 255, 255]
          : colorRoll < 0.85
            ? [255, 235, 210]
            : [210, 190, 255];
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.8,
        baseOpacity: Math.random() * 0.4 + 0.5,
        twinkle: willTwinkle,
        twinkleSpeed: willTwinkle ? (Math.random() * 0.04 + 0.015) : 0,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleMin: willTwinkle ? (Math.random() * 0.15 + 0.05) : 1,
        color: col,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1
      });
    }
    // Layer 3: bright prominent stars (reduced to 29, since 6 employee stars added)
    for (var i = 0; i < 29; i++) {
      var colorRoll2 = Math.random();
      var col2 = colorRoll2 < 0.3
        ? [180, 200, 255]
        : colorRoll2 < 0.6
          ? [255, 255, 255]
          : colorRoll2 < 0.8
            ? [255, 220, 180]
            : [220, 200, 255];
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 1.5,
        baseOpacity: Math.random() * 0.2 + 0.75,
        twinkle: true,
        twinkleSpeed: Math.random() * 0.06 + 0.02,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleMin: Math.random() * 0.1 + 0.05,
        color: col2,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        hasCross: Math.random() < 0.4
      });
    }

    // --- Employee named stars (random positions, prominent) ---
    randomizeEmployeePositions();
    for (var ei = 0; ei < employeeStars.length; ei++) {
      var emp = employeeStars[ei];
      stars.push({
        x: emp.posRatioX * w,
        y: emp.posRatioY * h,
        r: 2.8,
        baseOpacity: emp.active ? 0.95 : 0.85,
        twinkle: true,
        twinkleSpeed: emp.active ? 0.035 : 0.01,
        twinklePhase: ei * 1.2,
        twinkleMin: emp.active ? 0.6 : 0.78,
        color: emp.active ? [230, 220, 255] : [200, 195, 220],
        vx: 0,
        vy: 0,
        hasCross: emp.active,
        isEmployee: true,
        empName: emp.name,
        empActive: emp.active,
        empIndex: ei,
        orbitPhase: Math.random() * Math.PI * 2
      });
    }

    // --- Floating nebula clouds (animated, on top of milky way) ---
    var nebulaColors = [
      { r: 90, g: 65, b: 120 },
      { r: 60, g: 50, b: 125 },
      { r: 45, g: 60, b: 130 },
      { r: 100, g: 50, b: 90 },
      { r: 35, g: 70, b: 115 }
    ];
    for (var n = 0; n < 5; n++) {
      var nc = nebulaColors[n];
      nebulae.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 200 + 120,
        color: nc,
        opacity: Math.random() * 0.045 + 0.02,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        pulseSpeed: Math.random() * 0.003 + 0.001,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  resize();
  initField();
  window.addEventListener('resize', resize);

  // --- Shooting star ---
  function spawnShootingStar() {
    if (shootingStars.length >= 2) return;
    var cw = window.innerWidth;
    var ch = window.innerHeight;
    shootingStars.push({
      x: Math.random() * cw * 0.7 + cw * 0.1,
      y: Math.random() * ch * 0.25,
      vx: 4 + Math.random() * 5,
      vy: 1.5 + Math.random() * 2.5,
      life: 1,
      decay: 0.01 + Math.random() * 0.008,
      len: 50 + Math.random() * 70
    });
  }

  canvas.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  var animId;
  var frame = 0;

  function draw() {
    var cw = window.innerWidth;
    var ch = window.innerHeight;
    ctx.clearRect(0, 0, cw, ch);
    frame++;

    // --- Smooth gyroscope offset (lerp) ---
    gyroOffsetX += (gyroTargetX - gyroOffsetX) * 0.06;
    gyroOffsetY += (gyroTargetY - gyroOffsetY) * 0.06;

    // --- Draw pre-rendered Milky Way band (shifted by gyro) ---
    if (milkyWayCanvas) {
      ctx.save();
      ctx.translate(gyroOffsetX * 0.5, gyroOffsetY * 0.5);
      ctx.drawImage(milkyWayCanvas, 0, 0);
      ctx.restore();
    }

    // --- Floating nebulae (shifted by gyro) ---
    for (var ni = 0; ni < nebulae.length; ni++) {
      var nb = nebulae[ni];
      nb.x += nb.vx;
      nb.y += nb.vy;
      if (nb.x < -nb.radius) nb.x = cw + nb.radius;
      if (nb.x > cw + nb.radius) nb.x = -nb.radius;
      if (nb.y < -nb.radius) nb.y = ch + nb.radius;
      if (nb.y > ch + nb.radius) nb.y = -nb.radius;

      var pulse = 1 + Math.sin(frame * nb.pulseSpeed + nb.pulsePhase) * 0.15;
      var rr = nb.radius * pulse;
      var nbDrawX = nb.x + gyroOffsetX * 0.4;
      var nbDrawY = nb.y + gyroOffsetY * 0.4;
      var grad = ctx.createRadialGradient(nbDrawX, nbDrawY, 0, nbDrawX, nbDrawY, rr);
      var c = nb.color;
      grad.addColorStop(0, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (nb.opacity * 1.6) + ')');
      grad.addColorStop(0.35, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (nb.opacity * 0.7) + ')');
      grad.addColorStop(1, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(nbDrawX - rr, nbDrawY - rr, rr * 2, rr * 2);
    }

    // --- Stars (shifted by gyro for parallax depth) ---
    for (var si = 0; si < stars.length; si++) {
      var s = stars[si];
      // Parallax depth factor: larger stars shift more
      var depthFactor = s.r > 1.5 ? 1.2 : s.r > 0.8 ? 0.7 : 0.3;
      var starDrawX = s.x + gyroOffsetX * depthFactor;
      var starDrawY = s.y + gyroOffsetY * depthFactor;
      // Employee stars stay fixed — skip mouse repulsion & drift
      if (!s.isEmployee) {
        var dx = s.x - mouseX;
        var dy = s.y - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
          var force = (100 - dist) / 100 * 0.3;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
        }
        s.vx *= 0.988;
        s.vy *= 0.988;
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = cw;
        if (s.x > cw) s.x = 0;
        if (s.y < 0) s.y = ch;
        if (s.y > ch) s.y = 0;
      }

      var op;
      if (s.twinkle) {
        var t = Math.sin(frame * s.twinkleSpeed + s.twinklePhase);
        var factor = s.twinkleMin + (1 - s.twinkleMin) * (t * 0.5 + 0.5);
        op = s.baseOpacity * factor;
      } else {
        op = s.baseOpacity;
      }
      var c = s.color;

      if (s.r > 0.9) {
        ctx.beginPath();
        ctx.arc(starDrawX, starDrawY, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (op * 0.08) + ')';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(starDrawX, starDrawY, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + op + ')';
      ctx.fill();

      if (s.hasCross && op > 0.4) {
        var crossLen = s.r * 4 * op;
        ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (op * 0.25) + ')';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(starDrawX - crossLen, starDrawY);
        ctx.lineTo(starDrawX + crossLen, starDrawY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(starDrawX, starDrawY - crossLen);
        ctx.lineTo(starDrawX, starDrawY + crossLen);
        ctx.stroke();
      }
    }

    // --- Constellation lines (with gyro offset) ---
    for (var i = 0; i < stars.length; i++) {
      if (stars[i].r < 1.5) continue;
      var dfi = stars[i].r > 1.5 ? 1.2 : 0.7;
      for (var j = i + 1; j < stars.length; j++) {
        if (stars[j].r < 1.5) continue;
        var dfj = stars[j].r > 1.5 ? 1.2 : 0.7;
        var dx2 = stars[i].x - stars[j].x;
        var dy2 = stars[i].y - stars[j].y;
        var d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (d < 90) {
          ctx.beginPath();
          ctx.moveTo(stars[i].x + gyroOffsetX * dfi, stars[i].y + gyroOffsetY * dfi);
          ctx.lineTo(stars[j].x + gyroOffsetX * dfj, stars[j].y + gyroOffsetY * dfj);
          ctx.strokeStyle = 'rgba(180, 175, 220, ' + (0.045 * (1 - d / 90)) + ')';
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }
    }

    // --- Employee star decorations: enhanced glow + orbiting ring + name label ---
    for (var si2 = 0; si2 < stars.length; si2++) {
      var es = stars[si2];
      if (!es.isEmployee) continue;

      var edF = es.r > 1.5 ? 1.2 : 0.7;
      var eDrawX = es.x + gyroOffsetX * edF;
      var eDrawY = es.y + gyroOffsetY * edF;

      // Compute current opacity for this star
      var eOp;
      if (es.twinkle) {
        var et = Math.sin(frame * es.twinkleSpeed + es.twinklePhase);
        var eFactor = es.twinkleMin + (1 - es.twinkleMin) * (et * 0.5 + 0.5);
        eOp = es.baseOpacity * eFactor;
      } else {
        eOp = es.baseOpacity;
      }
      var ec = es.color;

      // --- Enhanced 4-point cross rays (like 夜姬-DC3 style) ---
      if (es.empActive) {
        // Bright star core glow
        var coreGlow = ctx.createRadialGradient(eDrawX, eDrawY, 0, eDrawX, eDrawY, es.r * 8);
        coreGlow.addColorStop(0, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',' + (eOp * 0.25) + ')');
        coreGlow.addColorStop(0.3, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',' + (eOp * 0.08) + ')');
        coreGlow.addColorStop(1, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',0)');
        ctx.fillStyle = coreGlow;
        ctx.fillRect(eDrawX - es.r * 8, eDrawY - es.r * 8, es.r * 16, es.r * 16);

        // Prominent cross rays
        var crossLen = es.r * 12 * eOp;
        var crossOpMain = eOp * 0.4;
        var crossOpFade = eOp * 0.08;
        // Horizontal ray
        var hGrad = ctx.createLinearGradient(eDrawX - crossLen, eDrawY, eDrawX + crossLen, eDrawY);
        hGrad.addColorStop(0, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',0)');
        hGrad.addColorStop(0.35, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',' + crossOpFade + ')');
        hGrad.addColorStop(0.5, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',' + crossOpMain + ')');
        hGrad.addColorStop(0.65, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',' + crossOpFade + ')');
        hGrad.addColorStop(1, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',0)');
        ctx.strokeStyle = hGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(eDrawX - crossLen, eDrawY);
        ctx.lineTo(eDrawX + crossLen, eDrawY);
        ctx.stroke();
        // Vertical ray
        var vGrad = ctx.createLinearGradient(eDrawX, eDrawY - crossLen, eDrawX, eDrawY + crossLen);
        vGrad.addColorStop(0, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',0)');
        vGrad.addColorStop(0.35, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',' + crossOpFade + ')');
        vGrad.addColorStop(0.5, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',' + crossOpMain + ')');
        vGrad.addColorStop(0.65, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',' + crossOpFade + ')');
        vGrad.addColorStop(1, 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',0)');
        ctx.strokeStyle = vGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(eDrawX, eDrawY - crossLen);
        ctx.lineTo(eDrawX, eDrawY + crossLen);
        ctx.stroke();
        // Thinner diagonal rays
        var diagLen = crossLen * 0.5;
        ctx.strokeStyle = 'rgba(' + ec[0] + ',' + ec[1] + ',' + ec[2] + ',' + (eOp * 0.12) + ')';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(eDrawX - diagLen, eDrawY - diagLen);
        ctx.lineTo(eDrawX + diagLen, eDrawY + diagLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(eDrawX + diagLen, eDrawY - diagLen);
        ctx.lineTo(eDrawX - diagLen, eDrawY + diagLen);
        ctx.stroke();
      }

      // --- Orbiting ring for ACTIVE employees only ---
      if (es.empActive) {
        var orbitRadius = es.r * 6;
        var ringProgress = ((frame * 0.015) + es.orbitPhase) % (Math.PI * 2);
        // Primary arc (crescent style)
        ctx.beginPath();
        ctx.arc(eDrawX, eDrawY, orbitRadius, ringProgress, ringProgress + Math.PI * 1.1, false);
        ctx.strokeStyle = 'rgba(180, 195, 255, ' + (eOp * 0.55) + ')';
        ctx.lineWidth = 1.0;
        ctx.stroke();
        // Secondary thinner arc opposite side
        ctx.beginPath();
        ctx.arc(eDrawX, eDrawY, orbitRadius + 1.5, ringProgress + Math.PI * 1.2, ringProgress + Math.PI * 1.9, false);
        ctx.strokeStyle = 'rgba(180, 195, 255, ' + (eOp * 0.22) + ')';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // --- Name label ---
      var labelOffsetY = es.empActive ? es.r * 8.5 : es.r * 5;
      var labelY = eDrawY + labelOffsetY;
      var fontSize = es.empActive ? 13 : 12;
      ctx.font = (es.empActive ? '500 ' : '400 ') + fontSize + 'px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (es.empActive) {
        // Bright text with subtle shadow for readability
        ctx.shadowColor = 'rgba(100, 80, 160, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(215, 210, 240, ' + (eOp * 0.9) + ')';
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(215, 210, 240, ' + (eOp * 0.7) + ')';
      }
      ctx.fillText(es.empName, eDrawX, labelY);
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    // --- Shooting stars ---
    if (frame % 150 === 0 && Math.random() < 0.6) spawnShootingStar();
    for (var ss = shootingStars.length - 1; ss >= 0; ss--) {
      var sh = shootingStars[ss];
      sh.x += sh.vx;
      sh.y += sh.vy;
      sh.life -= sh.decay;
      if (sh.life <= 0) { shootingStars.splice(ss, 1); continue; }
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      var tailX = sh.x - sh.vx * sh.len / 5;
      var tailY = sh.y - sh.vy * sh.len / 5;
      ctx.lineTo(tailX, tailY);
      var grad2 = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
      grad2.addColorStop(0, 'rgba(255,255,255,' + (sh.life * 0.8) + ')');
      grad2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad2;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (sh.life * 0.6) + ')';
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }
  draw();

  // --- Dismiss splash (shared logic) ---
  function dismissSplash() {
    splash.classList.add('fade-out');
    mainApp.classList.remove('hidden');
    setTimeout(function() {
      splash.style.display = 'none';
      cancelAnimationFrame(animId);
      animId = null;
    }, 800);
  }

  // --- Click to dismiss ---
  splash.addEventListener('click', function() {
    if (needsIOSGyroPermission && !gyroPermissionRequested) {
      // iOS 13+: first click requests gyro permission, THEN dismisses
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

  // --- Brand logo click → return to splash ---
  document.addEventListener('click', function(e) {
    var link = e.target.closest('#brandHomeLink');
    if (!link) return;
    e.preventDefault();
    splash.style.display = '';
    splash.classList.remove('fade-out');
    mainApp.classList.add('hidden');
    resize();
    initField();
    if (!animId) draw();
  });
})();
