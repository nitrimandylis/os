// ════════════════════════════════════════════════
//  LIVE WALLPAPER — drifting halftone dots, scroll-reactive
//  The old site had a GLSL shader. This is its night-shift cousin.
// ════════════════════════════════════════════════
(function wallpaper() {
  const canvas = document.getElementById("wallpaper");
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w, h, dots;
  const GAP = 46;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let y = GAP / 2; y < h + GAP; y += GAP) {
      for (let x = GAP / 2; x < w + GAP; x += GAP) {
        dots.push({ x, y, seed: Math.random() * Math.PI * 2 });
      }
    }
  }
  resize();
  window.addEventListener("resize", resize);

  const dotCol = "#262626"; // the man(1) rule colour

  // scroll velocity feeds turbulence — same trick, new clothes
  let vel = 0;
  let smooth = 0;
  window.__wallVel = (v) => {
    vel = Math.min(Math.abs(v), 30);
  };
  let lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      vel = Math.min(Math.abs(window.scrollY - lastY) * 0.4, 30);
      lastY = window.scrollY;
    },
    { passive: true },
  );

  // ── defrag: dots pack into a tidy grid, hold, then drift home.
  //    net fragments moved: zero. that's the joke, and it's true. ──
  let defragStart = 0; // 0 = idle
  const D_GATHER = 1400,
    D_HOLD = 1100,
    D_RETURN = 1000;
  window.__defrag = () => {
    if (reduced || defragStart) return false;
    const cols = Math.ceil(Math.sqrt(dots.length * (w / Math.max(h, 1))));
    dots.forEach((d, i) => {
      d.tx = 16 + (i % cols) * 13;
      d.ty = 16 + Math.floor(i / cols) * 13;
    });
    defragStart = performance.now();
    return true;
  };
  const easeInOut = (p) =>
    p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  function defragMix(now) {
    // returns 0..1 = how far toward the packed grid we currently are
    const t = now - defragStart;
    if (t < D_GATHER) return easeInOut(t / D_GATHER);
    if (t < D_GATHER + D_HOLD) return 1;
    if (t < D_GATHER + D_HOLD + D_RETURN)
      return 1 - easeInOut((t - D_GATHER - D_HOLD) / D_RETURN);
    defragStart = 0;
    return 0;
  }

  const t0 = performance.now();
  function draw() {
    smooth += (vel - smooth) * 0.06;
    vel *= 0.9;
    const t = (performance.now() - t0) / 1000;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = dotCol;

    const mix = defragStart ? defragMix(performance.now()) : 0;
    for (const d of dots) {
      const wob =
        Math.sin(t * 0.5 + d.seed + d.x * 0.004) *
        Math.cos(t * 0.3 + d.y * 0.005);
      const r = 1.1 + Math.abs(wob) * 1.6 + smooth * 0.18;
      const ox = Math.sin(t * 0.2 + d.seed) * (3 + smooth * 0.6);
      const oy = Math.cos(t * 0.25 + d.seed * 2) * (3 + smooth * 0.6);
      let px = d.x + ox,
        py = d.y + oy;
      // (d.tx guard: a resize mid-defrag rebuilds dots without targets)
      if (mix > 0 && d.tx !== undefined) {
        px += (d.tx - px) * mix;
        py += (d.ty - py) * mix;
      }
      ctx.beginPath();
      ctx.arc(px, py, mix > 0 ? Math.max(r, 1.4) : r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reduced) requestAnimationFrame(draw);
  }
  draw();
})();
