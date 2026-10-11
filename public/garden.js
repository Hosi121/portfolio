(() => {
  "use strict";

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Keep existing section URLs useful even when their entries are folded away.
  function revealLinkedSection() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); }
    catch { return; }
    const section = document.getElementById(id)?.closest("details");
    if (section) section.open = true;
  }
  revealLinkedSection();
  window.addEventListener("hashchange", revealLinkedSection);

  let closedBeforePrint = [];
  window.addEventListener("beforeprint", () => {
    closedBeforePrint = [...document.querySelectorAll(".archive details:not([open])")];
    closedBeforePrint.forEach((section) => { section.open = true; });
  });
  window.addEventListener("afterprint", () => {
    closedBeforePrint.forEach((section) => { section.open = false; });
  });

  // Only deliberate disclosure clicks get a short pulse, never URL or print changes.
  let lastPulse = -Infinity;
  document.querySelector(".archive")?.addEventListener("click", (event) => {
    const summary = event.target instanceof Element ? event.target.closest("summary") : null;
    if (!summary || !event.isTrusted || event.defaultPrevented || document.hidden || motion.matches || typeof navigator.vibrate !== "function") return;
    const now = performance.now();
    if (now - lastPulse < 100) return;
    lastPulse = now;
    try { navigator.vibrate(12); }
    catch { /* Optional device feedback must not interfere with native disclosure controls. */ }
  });

  function createGarden() {
    const canvas = document.querySelector("#garden-canvas");
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const W = 720;
    const H = 260;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * ratio;
    canvas.height = H * ratio;
    ctx.scale(ratio, ratio);

    // Create a new composition on each page load; keep it still during interaction.
    const random = Math.random;
    const between = (min, max) => min + random() * (max - min);
    const pick = (items) => items[Math.floor(random() * items.length)];
    const palette = pick([
      { paint: [34, 348, 350, 272, 249], flowers: ["#a77589", "#9380a5", "#b28b84", "#ae9669"], leaf: "#7b8568", ribbon: "#a1778a" },
      { paint: [38, 25, 350, 283, 267], flowers: ["#b48978", "#9e7586", "#b99e6c", "#a58d9e"], leaf: "#80846b", ribbon: "#a18671" },
      { paint: [35, 285, 330, 259, 240], flowers: ["#9884a9", "#7c8b9e", "#b58c9c", "#a28f74"], leaf: "#788675", ribbon: "#92809c" },
    ]);
    const mirrored = random() > 0.5;

    const paint = document.createElement("canvas");
    // Paint is intentionally softer; reserve the full pixel density for the letters.
    paint.width = W;
    paint.height = H;
    const brush = paint.getContext("2d");
    if (!brush) return;
    if (mirrored) { brush.translate(W, 0); brush.scale(-1, 1); }

    // Parallel, uneven pigment ridges give each stroke a dry, impasto-like edge.
    function stroke(x, y, length, width, angle, hue, saturation, lightness) {
      brush.save();
      brush.translate(x, y);
      brush.rotate(angle);
      const shape = new Path2D();
      const wave = (t) => Math.sin(t * 6.5 + 0.4) * width * 0.18;
      const edge = (t) => (0.65 + Math.sin(t * Math.PI) * 0.35) * width * 0.5;
      shape.moveTo(0, wave(0) - edge(0));
      for (let n = 0; n <= 100; n++) {
        const t = n / 100;
        shape.lineTo(t * length, wave(t) - edge(t) + (random() - 0.5) * 3);
      }
      // Bristle tips stop at different places, leaving a rough, tapered edge.
      for (let n = 0; n <= 30; n++) {
        const t = n / 30;
        shape.lineTo(length - random() * 22 - t * 10, wave(1) - edge(1) + t * edge(1) * 2);
      }
      for (let n = 100; n >= 0; n--) {
        const t = n / 100;
        shape.lineTo(t * length, wave(t) + edge(t) + (random() - 0.5) * 2);
      }
      for (let n = 0; n <= 25; n++) {
        const t = n / 25;
        shape.lineTo(random() * 15, wave(0) + edge(0) - t * edge(0) * 2);
      }
      shape.closePath();
      brush.fillStyle = `hsl(${hue} ${saturation}% ${lightness}%)`;
      brush.fill(shape);
      brush.clip(shape);

      for (let i = 0; i < width * 4; i++) {
        const start = random() * length * 0.65 - length * 0.12;
        const end = start + length * (0.15 + random() * 0.9);
        const offset = (random() - 0.5) * width * 1.3;
        const shade = lightness + (random() - 0.48) * 19;
        brush.lineWidth = 0.25 + random() * 1.6;
        brush.strokeStyle = `hsl(${hue + random() * 8} ${saturation}% ${shade}% / ${0.2 + random() * 0.6})`;
        brush.beginPath();
        brush.moveTo(start, offset + wave(start / length));
        for (let step = 1; step <= 20; step++) {
          const px = start + (end - start) * step / 20;
          brush.lineTo(px, offset + wave(px / length) + Math.sin(step * 0.6 + i) * 0.65);
        }
        brush.stroke();
        if (i % 4 === 0) {
          brush.strokeStyle = `hsl(${hue} ${saturation * 0.5}% 98% / 0.48)`;
          brush.lineWidth = 0.35;
          brush.translate(0, -0.7);
          brush.stroke();
          brush.translate(0, 0.7);
        }
      }
      brush.restore();
    }

    stroke(between(36, 49), between(191, 204), between(610, 630), 66, between(-0.02, 0.01), palette.paint[0], 31, 90);
    stroke(between(61, 80), between(196, 208), between(555, 585), 46, between(-0.04, -0.01), palette.paint[1], 43, 87);
    stroke(between(38, 55), between(213, 225), between(580, 603), 36, between(-0.035, -0.015), palette.paint[2], 43, 84);
    stroke(between(95, 120), between(236, 245), between(530, 554), 30, between(-0.03, -0.02), palette.paint[3], 25, 84);
    stroke(between(262, 282), 251, between(328, 350), 12, -0.03, palette.paint[4], 19, 88);

    const mask = document.createElement("canvas");
    mask.width = W;
    mask.height = H;
    const ink = mask.getContext("2d", { willReadFrequently: true });
    if (!ink) return;
    if (mirrored) { ink.translate(W, 0); ink.scale(-1, 1); }

    const ellipse = (x, y, rx, ry, angle = 0) => {
      ink.beginPath();
      ink.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
      ink.fill();
    };
    const line = (points, color, width) => {
      ink.strokeStyle = color;
      ink.lineWidth = width;
      ink.beginPath();
      ink.moveTo(...points[0]);
      for (const point of points.slice(1)) ink.lineTo(...point);
      ink.stroke();
    };

    function flower(x, y, size, petals, color) {
      // Clear a silhouette before adding petals, so overlapping blooms stay distinct.
      ink.globalCompositeOperation = "destination-out";
      ellipse(x, y, size * 1.02, size * 1.02);
      ink.globalCompositeOperation = "source-over";
      ink.fillStyle = color;
      const rotation = between(0, Math.PI);
      for (let n = 0; n < petals; n++) {
        const angle = n * Math.PI * 2 / petals + rotation;
        ink.globalAlpha = 0.7 + (n % 3) * 0.15;
        ellipse(x + Math.cos(angle) * size * 0.6, y + Math.sin(angle) * size * 0.6, size * 0.52, size * (petals > 8 ? 0.22 : 0.33), angle);
      }
      ink.globalAlpha = 1;
      ink.fillStyle = "#9d8664";
      ellipse(x, y, size * 0.25, size * 0.25);
    }

    // All stems converge at one ribbon: a gathered bouquet rather than a flowerbed.
    ink.save();
    ink.translate(between(257, 298), between(86, 95));
    ink.rotate(between(-0.13, 0.13));
    const knot = { x: between(3, 20), y: 116 };
    const stems = [
      [-69, -11], [-36, -42], [6, -49], [49, -32], [82, 2],
      [-87, 25], [-40, 2], [10, -2], [50, 18], [-50, 43], [-6, 38], [31, 50],
    ].filter((_, i) => i < 9 || random() > 0.3).map(([x, y]) => ({
      x: x + between(-7, 7), y: y + between(-7, 7),
      size: between(18, 26), petals: pick([6, 8, 11]), color: pick(palette.flowers),
    }));

    for (const stem of stems) {
      line([[stem.x, stem.y], [stem.x * 0.5 + knot.x * 0.5, 77], [knot.x, knot.y], [knot.x - stem.x * 0.14, between(140, 150)]], palette.leaf, between(1.8, 2.7));
      ink.fillStyle = palette.leaf;
      ellipse(stem.x * 0.5 + knot.x * 0.5 + (stem.x < 0 ? -9 : 9), 76, between(11, 17), between(3.5, 5), stem.x < 0 ? 0.7 : -0.7);
    }
    for (const side of [-1, 1]) {
      line([[knot.x, knot.y], [side * 66, 57], [side * 104, -14]], palette.leaf, 2);
      for (let i = 0; i < 5; i++) {
        const x = side * (71 + i * 7);
        const y = 53 - i * 15;
        ink.fillStyle = palette.leaf;
        ellipse(x + side * 8, y, 13, 5, side * -0.7);
        ellipse(x - side * 6, y - 6, 10, 4, side * 0.5);
      }
    }
    for (const bloom of stems.sort((a, b) => a.y - b.y)) {
      flower(bloom.x, bloom.y, bloom.size, bloom.petals, bloom.color);
    }
    ink.strokeStyle = palette.ribbon;
    ink.lineWidth = 2.8;
    ink.beginPath();
    ink.moveTo(knot.x, knot.y);
    ink.bezierCurveTo(knot.x - 34, knot.y - 23, knot.x - 28, knot.y + 15, knot.x, knot.y);
    ink.bezierCurveTo(knot.x + 34, knot.y - 23, knot.x + 28, knot.y + 15, knot.x, knot.y);
    ink.stroke();
    line([[knot.x, knot.y], [knot.x - 14, knot.y + 22], [knot.x - 19, knot.y + 17]], palette.ribbon, 2.7);
    line([[knot.x, knot.y], [knot.x + 12, knot.y + 23], [knot.x + 16, knot.y + 17]], palette.ribbon, 2.7);
    ink.restore();

    // A little songbird, its wing and belly separated by lighter character density.
    function bird(x, y, scale, flipped = false) {
      ink.save();
      ink.translate(x, y);
      ink.scale(flipped ? -scale : scale, scale);
      ink.fillStyle = "#5b6660";
      ink.beginPath();
      ink.moveTo(-22, 8);
      ink.lineTo(-55, -7);
      ink.lineTo(-43, 15);
      ink.lineTo(-19, 22);
      ink.fill();
      ellipse(-2, 7, 28, 20, -0.3);
      ellipse(20, -11, 13, 13);
      ink.beginPath();
      ink.moveTo(31, -13);
      ink.lineTo(43, -8);
      ink.lineTo(30, -5);
      ink.fill();
      ink.fillStyle = "#7e8580";
      ellipse(-8, 5, 19, 11, -0.45);
      ink.globalAlpha = 0.45;
      ink.fillStyle = "#d2bcac";
      ellipse(9, 14, 13, 10, -0.4);
      ink.globalAlpha = 1;
      ink.globalCompositeOperation = "destination-out";
      ellipse(23, -14, 2.6, 2.6);
      ink.globalCompositeOperation = "source-over";
      line([[-2, 23], [-5, 36], [-12, 38]], "#737568", 2);
      line([[9, 23], [8, 36], [15, 38]], "#737568", 2);
      ink.restore();
    }

    const birdX = between(501, 558);
    const birdY = between(91, 117);
    const birdSize = between(1.05, 1.32);
    const perchY = birdY + 38 * birdSize;
    line([[birdX - 67, perchY + 5], [birdX, perchY], [birdX + 68, perchY + 3]], "#8b8873", 2.1);
    bird(birdX, birdY, birdSize, random() > 0.25);
    if (random() > 0.35) bird(between(602, 635), between(170, 180), between(0.55, 0.7), true);

    const pixels = ink.getImageData(0, 0, W, H).data;
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const glyphs = [];
    const chars = ".,:;+*x%#";
    const cellX = 3.6;
    const cellY = 4.6;
    for (let row = 0; row * cellY < H; row++) {
      for (let col = 0; col * cellX < W; col++) {
        const x = col * cellX;
        const y = row * cellY;
        const i = (Math.floor(y) * W + Math.floor(x)) * 4;
        const alpha = pixels[i + 3] / 255;
        if (alpha < 0.12 || alpha < bayer[(row % 4) * 4 + col % 4] / 20) continue;
        glyphs.push({ x, y, char: chars[Math.min(8, Math.floor(alpha * 5 + random() * 4))], color: `rgb(${pixels[i]} ${pixels[i + 1]} ${pixels[i + 2]})` });
      }
    }

    // A few loose seeds make the edge feel printed rather than geometrically cut.
    for (let i = 0; i < 90; i++) {
      const x = 51 + random() * 600;
      const y = 158 + random() * 74;
      glyphs.push({ x, y, char: random() > 0.8 ? "+" : ".", color: "#a5989a" });
    }

    let pointer = null;
    let frame = 0;
    const precise = window.matchMedia("(hover: hover) and (pointer: fine)");

    function draw() {
      frame = 0;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(paint, 0, 0, W, H);
      ctx.font = "5.6px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const glyph of glyphs) {
        let dx = 0;
        let dy = 0;
        if (pointer) {
          const distance = Math.hypot(glyph.x - pointer.x, glyph.y - pointer.y);
          const strength = Math.max(0, 1 - distance / 58);
          dx = (glyph.x - pointer.x) * strength * 0.13;
          dy = (glyph.y - pointer.y) * strength * 0.13;
        }
        ctx.fillStyle = glyph.color;
        ctx.fillText(glyph.char, glyph.x + dx, glyph.y + dy);
      }
    }

    // After setup, render only on input: no perpetual loop, video, or polling.
    function schedule() {
      if (!frame) frame = requestAnimationFrame(draw);
    }
    canvas.addEventListener("pointermove", (event) => {
      if (motion.matches || !precise.matches) return;
      const rect = canvas.getBoundingClientRect();
      pointer = { x: (event.clientX - rect.left) / rect.width * W, y: (event.clientY - rect.top) / rect.height * H };
      schedule();
    }, { passive: true });
    const reset = () => { pointer = null; schedule(); };
    canvas.addEventListener("pointerleave", reset);
    motion.addEventListener("change", reset);
    document.addEventListener("visibilitychange", () => {
      pointer = null;
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else schedule();
    });

    draw();
    canvas.parentElement.dataset.ready = "";
  }

  // Give the text its first paint before spending time on decorative artwork.
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(createGarden, { timeout: 500 });
  } else {
    requestAnimationFrame(() => setTimeout(createGarden, 0));
  }
})();
