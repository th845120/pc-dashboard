// ===== SPLASH SCREEN =====
(function() {
  var splash = document.getElementById('splashScreen');
  var mainApp = document.getElementById('mainApp');
  var canvas = document.getElementById('splashParticles');
  if (!splash || !canvas) return;

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var particles = [];
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

  var COUNT = 120;
  var w = window.innerWidth;
  var h = window.innerHeight;
  for (var i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2.2 + 0.8,
      opacity: Math.random() * 0.5 + 0.2
    });
  }

  canvas.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  var animId;
  function draw() {
    var cw = window.innerWidth;
    var ch = window.innerHeight;
    ctx.clearRect(0, 0, cw, ch);

    particles.forEach(function(p) {
      var dx = p.x - mouseX;
      var dy = p.y - mouseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140 && dist > 0) {
        var force = (140 - dist) / 140 * 0.7;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = cw;
      if (p.x > cw) p.x = 0;
      if (p.y < 0) p.y = ch;
      if (p.y > ch) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(155, 89, 182, ' + p.opacity + ')';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(155, 89, 182, ' + (p.opacity * 0.12) + ')';
      ctx.fill();
    });

    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx2 = particles[i].x - particles[j].x;
        var dy2 = particles[i].y - particles[j].y;
        var d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(155, 89, 182, ' + (0.12 * (1 - d / 110)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }
  draw();

  // Click anywhere to dismiss
  splash.addEventListener('click', function() {
    splash.classList.add('fade-out');
    mainApp.classList.remove('hidden');
    setTimeout(function() {
      splash.style.display = 'none';
      cancelAnimationFrame(animId);
    }, 800);
  });
})();
