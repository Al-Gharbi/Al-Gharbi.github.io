/* ═══════════════════════════════════════════════════════
   CANVAS · Hex grid · Particle network · Data packets
   - Pauses while the tab is hidden.
   - Fewer nodes on small screens.
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }
  const ctx = canvas.getContext('2d');

  /* ── Config ─────────────────────────────────────────── */
  const SMALL = window.innerWidth < 768;
  const CFG = {
    nodeCount:   SMALL ? 26 : 55,
    nodeSpeed:   0.22,
    linkDist:    160,
    linkOpacity: 0.12,
    nodeR:       2,
    packetCount: SMALL ? 5 : 12,
    packetSpeed: 1.5,
    hexSize:     38,
    hexOpacity:  0.025,
    cyan: '0,200,240',
    grn:  '0,232,122',
    amb:  '255,176,32',
    vio:  '155,141,245',
  };

  /* ── State ───────────────────────────────────────────── */
  let W, H, nodes = [], packets = [];
  let respawnAt = [];                 // timestamps at which a packet should be re-created
  let mouseX = -9999, mouseY = -9999;
  const hexOffset = { x: 0, y: 0 };
  let rafId = 0;

  /* ── Resize ──────────────────────────────────────────── */
  let resizeTimer;
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initNodes();
  }

  /* ── Nodes ───────────────────────────────────────────── */
  function pickColor() {
    const c = [CFG.cyan, CFG.cyan, CFG.cyan, CFG.grn, CFG.amb, CFG.vio];
    return c[Math.floor(Math.random() * c.length)];
  }

  function initNodes() {
    nodes = [];
    for (let i = 0; i < CFG.nodeCount; i++) {
      nodes.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * CFG.nodeSpeed,
        vy: (Math.random() - 0.5) * CFG.nodeSpeed,
        r:  CFG.nodeR * (0.6 + Math.random() * 0.8),
        clr: pickColor(),
        pulse: Math.random() * Math.PI * 2,
      });
    }
    packets = [];
    respawnAt = [];
    for (let i = 0; i < CFG.packetCount; i++) spawnPacket();
  }

  /* ── Packets ─────────────────────────────────────────── */
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function spawnPacket() {
    const src = nodes[Math.floor(Math.random() * nodes.length)];
    let best = null, bestD = Infinity;
    for (const n of nodes) {
      if (n === src) continue;
      const d = dist(src, n);
      if (d < CFG.linkDist && d < bestD) { best = n; bestD = d; }
    }
    if (!best) { respawnAt.push(performance.now() + 400); return; }
    packets.push({
      src, dst: best, progress: 0,
      speed: (0.006 + Math.random() * 0.01) * CFG.packetSpeed,
      clr: src.clr,
      size: 2 + Math.random() * 2,
    });
  }

  /* ── Hex grid ────────────────────────────────────────── */
  function drawHex(cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i - 30);
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  function drawHexGrid() {
    const s = CFG.hexSize, w = s * Math.sqrt(3), h = s * 2;
    const ox = hexOffset.x % w, oy = hexOffset.y % (h * 0.75);
    ctx.save();
    ctx.strokeStyle = 'rgba(' + CFG.cyan + ',' + CFG.hexOpacity + ')';
    ctx.lineWidth = 0.6;
    const cols = Math.ceil(W / w) + 2, rows = Math.ceil(H / (h * 0.75)) + 2;
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        drawHex(ox + col * w + (row % 2 === 0 ? 0 : w / 2), oy + row * h * 0.75, s * 0.95);
      }
    }
    ctx.restore();
  }

  /* ── Frame ───────────────────────────────────────────── */
  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    drawHexGrid();

    hexOffset.x += 0.04 + (mouseX / W - 0.5) * 0.015;
    hexOffset.y += 0.02 + (mouseY / H - 0.5) * 0.015;

    // Nodes
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy; n.pulse += 0.025;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    }

    // Links
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = dist(nodes[i], nodes[j]);
        if (d < CFG.linkDist) {
          const a = (1 - d / CFG.linkDist) * CFG.linkOpacity;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(' + CFG.cyan + ',' + a.toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Node dots + soft glow
    for (const n of nodes) {
      const pulse = 0.5 + 0.5 * Math.sin(n.pulse);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * (1 + pulse * 0.3), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + n.clr + ',' + (0.55 + pulse * 0.35) + ')';
      ctx.fill();
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
      grad.addColorStop(0, 'rgba(' + n.clr + ',0.12)');
      grad.addColorStop(1, 'rgba(' + n.clr + ',0)');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Packets (iterate backwards so removal is safe)
    for (let i = packets.length - 1; i >= 0; i--) {
      const pk = packets[i];
      pk.progress += pk.speed;
      if (pk.progress >= 1) {
        packets.splice(i, 1);
        respawnAt.push(now + Math.random() * 800);
        continue;
      }
      const t = pk.progress;
      const x = lerp(pk.src.x, pk.dst.x, t), y = lerp(pk.src.y, pk.dst.y, t);
      const op = t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 1;
      ctx.beginPath();
      ctx.arc(x, y, pk.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + pk.clr + ',' + (0.9 * op).toFixed(3) + ')';
      ctx.fill();
      const trailLen = 12;
      for (let k = 1; k <= trailLen; k++) {
        const tt = Math.max(0, t - k * 0.008);
        const ta = ((trailLen - k) / trailLen) * 0.35 * op;
        const tr = pk.size * ((trailLen - k) / trailLen);
        ctx.beginPath();
        ctx.arc(lerp(pk.src.x, pk.dst.x, tt), lerp(pk.src.y, pk.dst.y, tt), Math.max(0.4, tr), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + pk.clr + ',' + ta.toFixed(3) + ')';
        ctx.fill();
      }
    }

    // Respawn due packets (no timers: nothing leaks while the tab is hidden)
    if (respawnAt.length) {
      const due = respawnAt.filter(t => t <= now);
      if (due.length) {
        respawnAt = respawnAt.filter(t => t > now);
        due.forEach(spawnPacket);
      }
    }

    // Mouse glow
    if (mouseX > 0) {
      const g = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 90);
      g.addColorStop(0, 'rgba(' + CFG.cyan + ',0.03)');
      g.addColorStop(1, 'rgba(' + CFG.cyan + ',0)');
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 90, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    rafId = requestAnimationFrame(draw);
  }

  function start() { if (!rafId) rafId = requestAnimationFrame(draw); }
  function stop()  { cancelAnimationFrame(rafId); rafId = 0; }

  /* ── Init ────────────────────────────────────────────── */
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
  document.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

  resize();
  start();
})();
