// ===== SPLASH SCREEN — Galaxy Starfield =====
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

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function initField() {
    stars = [];
    nebulae = [];
    var w = window.innerWidth;
    var h = window.innerHeight;

    // --- Stars: 3 layers ---
    // Layer 1: tiny distant stars (most numerous)
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
        ? [200, 215, 255]  // blue-white
        : colorRoll < 0.65
          ? [255, 255, 255] // pure white
          : colorRoll < 0.85
            ? [255, 235, 210] // warm
            : [210, 190, 255]; // lavender
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
    // Layer 3: bright prominent stars (strong twinkle)
    for (var i = 0; i < 35; i++) {
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
        hasCross: Math.random() < 0.4 // diffraction spike cross
      });
    }

    // --- Nebula clouds ---
    var nebulaColors = [
      { r: 83, g: 64, b: 110 },
      { r: 55, g: 45, b: 115 },
      { r: 35, g: 55, b: 125 },
      { r: 95, g: 45, b: 85 },
      { r: 30, g: 65, b: 105 },
      { r: 70, g: 40, b: 100 }
    ];
    for (var n = 0; n < 6; n++) {
      var nc = nebulaColors[n % nebulaColors.length];
      nebulae.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 280 + 180,
        color: nc,
        opacity: Math.random() * 0.055 + 0.025,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        pulseSpeed: Math.random() * 0.003 + 0.001,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }
  initField();

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

    // --- Nebulae ---
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
      var grad = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, rr);
      var c = nb.color;
      grad.addColorStop(0, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (nb.opacity * 1.6) + ')');
      grad.addColorStop(0.35, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (nb.opacity * 0.7) + ')');
      grad.addColorStop(1, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(nb.x - rr, nb.y - rr, rr * 2, rr * 2);
    }

    // --- Stars ---
    for (var si = 0; si < stars.length; si++) {
      var s = stars[si];

      // Mouse repulsion
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

      // Twinkle calculation
      var op;
      if (s.twinkle) {
        var t = Math.sin(frame * s.twinkleSpeed + s.twinklePhase);
        // Map sin [-1,1] to [twinkleMin, 1]
        var factor = s.twinkleMin + (1 - s.twinkleMin) * (t * 0.5 + 0.5);
        op = s.baseOpacity * factor;
      } else {
        op = s.baseOpacity;
      }
      var c = s.color;

      // Star glow (for medium+ stars)
      if (s.r > 0.9) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (op * 0.08) + ')';
        ctx.fill();
      }

      // Star core
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + op + ')';
      ctx.fill();

      // Diffraction cross for bright stars
      if (s.hasCross && op > 0.4) {
        var crossLen = s.r * 4 * op;
        ctx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (op * 0.25) + ')';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x - crossLen, s.y);
        ctx.lineTo(s.x + crossLen, s.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - crossLen);
        ctx.lineTo(s.x, s.y + crossLen);
        ctx.stroke();
      }
    }

    // --- Faint constellation lines (only between nearby bright stars) ---
    for (var i = 0; i < stars.length; i++) {
      if (stars[i].r < 1.5) continue;
      for (var j = i + 1; j < stars.length; j++) {
        if (stars[j].r < 1.5) continue;
        var dx2 = stars[i].x - stars[j].x;
        var dy2 = stars[i].y - stars[j].y;
        var d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (d < 90) {
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          ctx.strokeStyle = 'rgba(180, 175, 220, ' + (0.045 * (1 - d / 90)) + ')';
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }
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
      // Head glow
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (sh.life * 0.6) + ')';
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }
  draw();

  // --- Click to dismiss ---
  splash.addEventListener('click', function() {
    splash.classList.add('fade-out');
    mainApp.classList.remove('hidden');
    setTimeout(function() {
      splash.style.display = 'none';
      cancelAnimationFrame(animId);
    }, 800);
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
