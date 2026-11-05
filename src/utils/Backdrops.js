// 🧊 Ice Cave backdrop: a cold blue gradient, a soft glow of ice light, layered dark-blue
// silhouettes (distant peaks, nearer spires, hanging icicles) that scroll at different speeds,
// and gently drifting snow.
//
// Speed: the silhouettes and glows are drawn ONCE into small textures when the level starts,
// so each frame only has to place a handful of pictures (instead of re-drawing hundreds of triangles).

// A tiny seeded random generator, so the cave looks identical every time you play
function makeRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Where the ice spikes go along a layer: [{ x, w, h, lean }]
function planSpikes(width, { minH, maxH, minW, maxW }, rand) {
  const spikes = [];
  let x = -60;
  while (x < width + 60) {
    const w = minW + rand() * (maxW - minW);
    const h = minH + rand() * (maxH - minH);
    const lean = (rand() - 0.5) * w * 0.4;                    // spikes lean a little, so they look natural
    spikes.push({ x, w, h, lean });
    x += w * (0.5 + rand() * 0.35);                           // neighbours overlap slightly
  }
  return spikes;
}

// Bakes one silhouette layer into a few wide textures and places them on screen.
// up = spikes standing on the baseline (peaks), otherwise hanging from it (icicles).
function bakeLayer(scene, name, { color, alpha, width, maxH, up, spikes, baseline, scrollX, scrollY }) {
  const CHUNK = 1024;                 // keeps every texture a safe size for phones
  const pad = 6;                      // a thin solid strip along the base, so there is never a gap
  const h = Math.ceil(maxH) + pad;
  const chunks = Math.ceil(width / CHUNK);
  const baseInTexture = up ? h - pad : pad;
  const imageY = baseline - baseInTexture;

  for (let c = 0; c < chunks; c++) {
    const key = `${name}_${c}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);

    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    spikes.forEach(sp => {
      const x0 = sp.x - c * CHUNK;                           // spikes that cross a chunk edge are drawn in both chunks: no seams
      if (x0 + sp.w < -2 || x0 > CHUNK + 2) return;
      const tipY = up ? baseInTexture - sp.h : baseInTexture + sp.h;
      g.fillTriangle(x0, baseInTexture, x0 + sp.w, baseInTexture, x0 + sp.w / 2 + sp.lean, tipY);
    });
    g.fillRect(0, up ? baseInTexture - 1 : 0, CHUNK, pad + 1);
    g.generateTexture(key, CHUNK, h);
    g.destroy();

    scene.add.image(c * CHUNK, imageY, key).setOrigin(0, 0).setAlpha(alpha).setScrollFactor(scrollX, scrollY);
  }
}

// A soft round glow, drawn once as a smooth gradient picture
function addGlow(scene, key, x, y, w, h, color, alpha) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, 256, 256);
  const ctx = tex.getContext();
  const rgb = `${(color >> 16) & 255},${(color >> 8) & 255},${color & 255}`;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  tex.refresh();
  return scene.add.image(x, y, key).setDisplaySize(w, h).setAlpha(alpha).setScrollFactor(0);
}

function ensureSnowTexture(scene) {
  if (scene.textures.exists("snowdot")) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillCircle(3, 3, 3);
  g.generateTexture("snowdot", 6, 6);
  g.destroy();
}

export function drawIceCaveBackdrop(scene, { colors, worldWidth, worldHeight }) {
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const maxScrollX = Math.max(0, worldWidth - camW);
  const maxScrollY = Math.max(0, worldHeight - camH);
  const random = makeRandom(20241031);

  // 1) Cold blue gradient, fixed to the screen: deep navy above, icy glow below
  const sky = scene.add.graphics();
  sky.fillGradientStyle(colors[0], colors[1], colors[2], colors[3], 1);
  sky.fillRect(-20, -20, camW + 40, camH + 40);
  sky.setScrollFactor(0);


  // 2) Soft ice-light glows
  addGlow(scene, "iceglow_a", camW * 0.30, camH * 0.72, 760, 280, 0xbff0ff, 0.30);
  addGlow(scene, "iceglow_b", camW * 0.78, camH * 0.60, 620, 240, 0x8fd8ff, 0.27);


  // 3) Silhouette layers: far = lighter and slower, near = darker and faster.
  //    Each layer is as wide as it needs for its own scroll speed, and anchored so it always
  //    touches the bottom (or top) edge of the screen however far the camera moves.
  const widthFor = (sx) => camW + 300 + sx * maxScrollX;
  const bottomBase = (sy) => camH + sy * maxScrollY + 24;

  const layers = [
    // [name, scrollX, scrollY, color, alpha, spikes config, up, baseline]
    ["ice_far_peaks",   0.12, 0.08, 0x2a6db5, 0.55, { minH: 150, maxH: 270, minW: 120, maxW: 230 }, true,  bottomBase(0.08)],
    ["ice_far_icicles", 0.18, 0.10, 0x1d4f8f, 0.60, { minH: 50,  maxH: 130, minW: 50,  maxW: 110 }, false, -24],
    ["ice_mid_spires",  0.30, 0.18, 0x103a70, 0.85, { minH: 90,  maxH: 210, minW: 70,  maxW: 150 }, true,  bottomBase(0.18)],
    ["ice_near_spires", 0.50, 0.30, 0x06142f, 1.00, { minH: 50,  maxH: 150, minW: 50,  maxW: 120 }, true,  bottomBase(0.30)],
    ["ice_near_icicles",0.42, 0.26, 0x050f24, 1.00, { minH: 90,  maxH: 210, minW: 40,  maxW: 100 }, false, -24],
  ];
  layers.forEach(([name, sx, sy, color, alpha, cfg, up, baseline]) => {
    const width = widthFor(sx);
    bakeLayer(scene, name, { color, alpha, width, maxH: cfg.maxH, up, spikes: planSpikes(width, cfg, random), baseline, scrollX: sx, scrollY: sy });
  });


  // 4) Drifting snow (fixed to the screen, so it falls the same wherever you are)
  ensureSnowTexture(scene);
  const snow = scene.add.particles(0, 0, "snowdot", {
    x: { min: 0, max: camW },
    y: -10,
    lifespan: 7500,
    speedY: { min: 35, max: 80 },
    speedX: { min: -14, max: 14 },
    scale: { min: 0.35, max: 1 },
    alpha: { start: 0.85, end: 0.1 },
    frequency: 210,
    quantity: 1,
    advance: 6000            // start with the snow already falling
  });
  snow.setScrollFactor(0);

}

// A bubble: a thin see-through ring with a small shine, drawn once
function ensureBubbleTexture(scene) {
  if (scene.textures.exists("bubble")) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xbfefff, 0.25);
  g.fillCircle(8, 8, 7);
  g.lineStyle(1.5, 0xe6fbff, 0.9);
  g.strokeCircle(8, 8, 7);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(5.5, 5.5, 2);
  g.generateTexture("bubble", 16, 16);
  g.destroy();
}

// 🌊 Deep Sea backdrop: bright water near the surface fading to deep blue, slanted light rays,
// rocky ridges and kelp forests that scroll at different speeds, and bubbles rising to the surface.
// Built the same way as the Ice Cave: the layers are baked into textures once, when the level starts.
export function drawDeepSeaBackdrop(scene, { colors, worldWidth, worldHeight }) {
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const maxScrollX = Math.max(0, worldWidth - camW);
  const maxScrollY = Math.max(0, worldHeight - camH);
  const random = makeRandom(20251103);

  // 1) Water gradient, fixed to the screen: lighter above, deep blue below
  const water = scene.add.graphics();
  water.fillGradientStyle(colors[0], colors[1], colors[2], colors[3], 1);
  water.fillRect(-20, -20, camW + 40, camH + 40);
  water.setScrollFactor(0);

  // 2) Sunlight from the surface, and slanted light rays that slowly fade in and out
  addGlow(scene, "seaglow", camW * 0.5, -40, camW * 1.3, 260, 0x9fe8ff, 0.35);

  const rays = scene.add.graphics().setScrollFactor(0.05, 0);
  for (let i = 0; i < 6; i++) {
    const x = (i + 0.3) * (camW / 5) + random() * 60;
    const top = 26 + random() * 30;
    const bottom = 110 + random() * 90;
    rays.fillStyle(0xd8f6ff, 0.05 + random() * 0.04);
    rays.fillTriangle(x - top / 2, -10, x + top / 2, -10, x + 140 + bottom / 2, camH * 0.95);
    rays.fillTriangle(x - top / 2, -10, x + 140 - bottom / 2, camH * 0.95, x + 140 + bottom / 2, camH * 0.95);
  }
  scene.tweens.add({ targets: rays, alpha: 0.55, duration: 3200, yoyo: true, repeat: -1, ease: "Sine.InOut" });

  // 3) Silhouettes: far rocky ridges, then kelp forests (tall thin "spikes" that lean a little, like weed)
  const widthFor = (sx) => camW + 300 + sx * maxScrollX;
  const bottomBase = (sy) => camH + sy * maxScrollY + 24;

  const layers = [
    // [name, scrollX, scrollY, color, alpha, spikes config, baseline]
    ["sea_far_ridges", 0.12, 0.08, 0x0a4c7a, 0.70, { minH: 90, maxH: 200, minW: 160, maxW: 300 }, bottomBase(0.08)],
    ["sea_far_kelp",   0.22, 0.12, 0x0b5a5a, 0.55, { minH: 90, maxH: 220, minW: 14,  maxW: 30  }, bottomBase(0.12)],
    ["sea_mid_rocks",  0.32, 0.18, 0x06304f, 0.90, { minH: 60, maxH: 140, minW: 90,  maxW: 180 }, bottomBase(0.18)],
    ["sea_near_kelp",  0.48, 0.28, 0x053b2c, 0.95, { minH: 70, maxH: 190, minW: 16,  maxW: 34  }, bottomBase(0.28)],
  ];
  layers.forEach(([name, sx, sy, color, alpha, cfg, baseline]) => {
    const width = widthFor(sx);
    bakeLayer(scene, name, { color, alpha, width, maxH: cfg.maxH, up: true, spikes: planSpikes(width, cfg, random), baseline, scrollX: sx, scrollY: sy });
  });

  // 4) Small bubbles rising from the bottom of the screen, wobbling a little on the way up
  ensureBubbleTexture(scene);
  const bubbles = scene.add.particles(0, 0, "bubble", {
    x: { min: 0, max: camW },
    y: camH + 10,
    lifespan: 9000,
    speedY: { min: -70, max: -35 },
    speedX: { min: -8, max: 8 },
    scale: { min: 0.3, max: 0.9 },
    alpha: { start: 0.9, end: 0 },
    frequency: 160,
    quantity: 1,
    advance: 8000            // start with bubbles already on their way up
  });
  bubbles.setScrollFactor(0);
}

// A soft round puff (used for fog), drawn once and reused
function ensureSoftTexture(scene, key, color) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 256, 256);
  const ctx = tex.getContext();
  const rgb = `${(color >> 16) & 255},${(color >> 8) & 255},${color & 255}`;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.5, `rgba(${rgb},0.45)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  tex.refresh();
}

// A firefly: a small yellow-green dot with a soft halo
function ensureFireflyTexture(scene) {
  if (scene.textures.exists("firefly")) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xd8ff6a, 0.25);
  g.fillCircle(6, 6, 6);
  g.fillStyle(0xf2ffb0, 1);
  g.fillCircle(6, 6, 2);
  g.generateTexture("firefly", 12, 12);
  g.destroy();
}

// 🦉 Night Owl backdrop: a dark night sky with stars and a moon, fog drifting along the top,
// layers of dark pine silhouettes that scroll at different speeds, owls blinking in the trees,
// and fireflies. Built the same way as the other backdrops: the trees are baked into textures once.
export function drawNightForestBackdrop(scene, { colors, worldWidth, worldHeight }) {
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const maxScrollX = Math.max(0, worldWidth - camW);
  const maxScrollY = Math.max(0, worldHeight - camH);
  const random = makeRandom(20261104);

  // 1) Night sky, fixed to the screen
  const sky = scene.add.graphics();
  sky.fillGradientStyle(colors[0], colors[1], colors[2], colors[3], 1);
  sky.fillRect(-20, -20, camW + 40, camH + 40);
  sky.setScrollFactor(0);

  // 2) Stars and the moon (they barely move: they are very far away)
  const stars = scene.add.graphics().setScrollFactor(0.02, 0);
  for (let i = 0; i < 70; i++) {
    stars.fillStyle(0xffffff, 0.3 + random() * 0.6);
    stars.fillCircle(random() * (camW + 200), random() * camH * 0.55, random() < 0.15 ? 1.6 : 0.9);
  }
  addGlow(scene, "moonglow", camW * 0.78, 78, 220, 220, 0xcfd8ff, 0.35);
  const moon = scene.add.graphics().setScrollFactor(0);
  moon.fillStyle(0xf3f1dc, 1);
  moon.fillCircle(camW * 0.78, 78, 26);
  moon.fillStyle(0xd9d6bd, 1);
  moon.fillCircle(camW * 0.78 - 8, 72, 5);
  moon.fillCircle(camW * 0.78 + 9, 86, 3.5);

  // 3) Pine forest: far trees are lighter (hazy) and slow, near trees almost black and faster
  const widthFor = (sx) => camW + 300 + sx * maxScrollX;
  const bottomBase = (sy) => camH + sy * maxScrollY + 24;

  const layers = [
    // [name, scrollX, scrollY, color, alpha, spikes config, baseline]
    ["forest_far",  0.12, 0.08, 0x1f2c4a, 0.95, { minH: 170, maxH: 300, minW: 60, maxW: 120 }, bottomBase(0.08)],
    ["forest_mid",  0.28, 0.16, 0x111a2e, 1.00, { minH: 150, maxH: 270, minW: 55, maxW: 110 }, bottomBase(0.16)],
    ["forest_near", 0.48, 0.28, 0x060a13, 1.00, { minH: 110, maxH: 230, minW: 45, maxW: 95  }, bottomBase(0.28)],
  ];
  layers.forEach(([name, sx, sy, color, alpha, cfg, baseline]) => {
    const width = widthFor(sx);
    bakeLayer(scene, name, { color, alpha, width, maxH: cfg.maxH, up: true, spikes: planSpikes(width, cfg, random), baseline, scrollX: sx, scrollY: sy });

    // 🦉 Owls: pairs of yellow eyes in the far and middle trees that blink now and then
    if (name === "forest_near") return;
    for (let x = 300 + random() * 300; x < width - 100; x += 700 + random() * 600) {
      const eyes = scene.add.graphics().setScrollFactor(sx, sy);
      eyes.fillStyle(0xffd23f, name === "forest_far" ? 0.55 : 0.85);
      eyes.fillCircle(-5, 0, 2.6);
      eyes.fillCircle(5, 0, 2.6);
      eyes.x = x;
      eyes.y = baseline - 150 - random() * 90;
      scene.tweens.add({
        targets: eyes, scaleY: 0.1, duration: 90, yoyo: true,
        repeat: -1, repeatDelay: 2500 + random() * 4000, delay: random() * 3000
      });
    }
  });

  // 4) Fog along the top: a soft pale band, plus big puffs that drift slowly sideways
  const band = scene.add.graphics().setScrollFactor(0);
  band.fillGradientStyle(0x9aa6c4, 0x9aa6c4, 0x9aa6c4, 0x9aa6c4, 0.32, 0.32, 0, 0);
  band.fillRect(-20, -20, camW + 40, camH * 0.42);

  ensureSoftTexture(scene, "fogpuff", 0xb6c0dc);
  for (let i = 0; i < 9; i++) {
    const puff = scene.add.image(i * (camW / 7) - 60 + random() * 80, 20 + random() * 70, "fogpuff")
      .setDisplaySize(340 + random() * 220, 110 + random() * 60)
      .setAlpha(0.18 + random() * 0.14)
      .setScrollFactor(0);
    scene.tweens.add({
      targets: puff, x: puff.x + 60 + random() * 60, duration: 9000 + random() * 6000,
      yoyo: true, repeat: -1, ease: "Sine.InOut"
    });
  }

  // 5) Fireflies drifting and glowing on and off near the forest floor
  ensureFireflyTexture(scene);
  const fireflies = scene.add.particles(0, 0, "firefly", {
    x: { min: 0, max: camW },
    y: { min: camH * 0.45, max: camH - 30 },
    lifespan: 5000,
    speedX: { min: -12, max: 12 },
    speedY: { min: -10, max: 6 },
    scale: { min: 0.7, max: 1.2 },
    alpha: { values: [0, 1, 0.3, 1, 0] },
    frequency: 380,
    quantity: 1,
    advance: 5000
  });
  fireflies.setScrollFactor(0);
}

// Bakes a layer into a few wide textures, like bakeLayer, but lets the caller draw anything.
// draw(g, left, chunkW) draws the layer shifted by -left; whatever falls outside the chunk is cut off.
function bakeChunks(scene, name, { width, h, imageY, alpha, scrollX, scrollY, draw }) {
  const CHUNK = 1024;
  const chunks = Math.ceil(width / CHUNK);
  for (let c = 0; c < chunks; c++) {
    const key = `${name}_${c}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g, c * CHUNK, CHUNK);
    g.generateTexture(key, CHUNK, h);
    g.destroy();
    scene.add.image(c * CHUNK, imageY, key).setOrigin(0, 0).setAlpha(alpha).setScrollFactor(scrollX, scrollY);
  }
}

// One crystal shard: a long six-sided gem with a pointed tip, a lighter facet on one side,
// a bright outline and a small shine. dir = -1 grows up from the ground, +1 hangs down from the ceiling.
function drawShard(g, { x, y, angle, length: L, width: W, dir }, colors) {
  const ax = Math.sin(angle), ay = dir * Math.cos(angle);        // along the crystal, base -> tip
  const px = Math.cos(angle), py = -dir * Math.sin(angle);       // across it
  const at = (v, u) => ({ x: x + px * v + ax * u, y: y + py * v + ay * u });

  const outline = [at(-W / 2, 0), at(-W / 2, 0.72 * L), at(0, L), at(W / 2, 0.72 * L), at(W / 2, 0)];
  const facet   = [at(0, 0), at(0, L), at(W / 2, 0.72 * L), at(W / 2, 0)];

  g.fillStyle(colors.body, 1);
  g.fillPoints(outline, true);
  g.fillStyle(colors.facet, 1);
  g.fillPoints(facet, true);
  g.lineStyle(1.5, colors.edge, 0.9);
  g.strokePoints(outline, true);
  const s1 = at(-W / 4, 0.15 * L), s2 = at(-W / 4, 0.6 * L);   // shine
  g.lineStyle(2, 0xffffff, 0.45);
  g.lineBetween(s1.x, s1.y, s2.x, s2.y);
}

// Where the crystal clusters go along a layer: [{ x, shards, size }], each cluster a fan of 3-6 shards
function planClusters(width, { minL, maxL, minGap, maxGap, minW, maxW }, rand) {
  const clusters = [];
  for (let x = 80 + rand() * 160; x < width + 60; x += minGap + rand() * (maxGap - minGap)) {
    const count = 3 + Math.floor(rand() * 4);
    const shards = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1) - 0.5;                                    // -0.5 .. 0.5 across the fan
      const centre = 1 - Math.abs(t) * 1.1;                               // the middle shard is the tallest
      shards.push({
        dx: t * 34 + (rand() - 0.5) * 8,
        angle: t * 0.85 + (rand() - 0.5) * 0.2,
        length: (minL + rand() * (maxL - minL)) * (0.55 + 0.45 * centre),
        width: (minW + rand() * (maxW - minW)) * (0.7 + 0.3 * centre)
      });
    }
    clusters.push({ x, shards, size: maxL });
  }
  return clusters;
}

// A tiny four-pointed sparkle
function ensureSparkleTexture(scene) {
  if (scene.textures.exists("sparkle")) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xd9b8ff, 0.35);
  g.fillCircle(6, 6, 5);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(6, 0, 4.8, 6, 7.2, 6);
  g.fillTriangle(6, 12, 4.8, 6, 7.2, 6);
  g.fillTriangle(0, 6, 6, 4.8, 6, 7.2);
  g.fillTriangle(12, 6, 6, 4.8, 6, 7.2);
  g.generateTexture("sparkle", 12, 12);
  g.destroy();
}

// 💎 Crystal Cave backdrop: a deep purple cave with rocky walls, stalactites and crystals hanging
// from the ceiling, clusters of glowing purple crystals growing from the floor (each with a soft
// light that slowly pulses), and tiny sparkles floating in the air.
// Built the same way as the other backdrops: the rocks and crystals are baked into textures once.
export function drawCrystalCaveBackdrop(scene, { colors, worldWidth, worldHeight }) {
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const maxScrollX = Math.max(0, worldWidth - camW);
  const maxScrollY = Math.max(0, worldHeight - camH);
  const random = makeRandom(20261105);

  // 1) Deep purple cave, fixed to the screen, with a faint purple light in the middle
  const cave = scene.add.graphics();
  cave.fillGradientStyle(colors[0], colors[1], colors[2], colors[3], 1);
  cave.fillRect(-20, -20, camW + 40, camH + 40);
  cave.setScrollFactor(0);
  addGlow(scene, "cavelight", camW * 0.5, camH * 0.55, camW * 1.2, camH * 0.9, 0x7a3cff, 0.22);

  const widthFor = (sx) => camW + 300 + sx * maxScrollX;
  const bottomBase = (sy) => camH + sy * maxScrollY + 24;

  // 2) Rock layers: far cave wall, stalactites on the ceiling, and nearer rocks on the floor.
  //    [name, scrollX, scrollY, color, spikes config, up, baseline]
  const rocks = [
    ["crystal_far_rocks",   0.10, 0.06, 0x1d0f36, { minH: 120, maxH: 260, minW: 140, maxW: 280 }, true,  bottomBase(0.06)],
    ["crystal_stalactites", 0.30, 0.18, 0x0f0720, { minH: 40,  maxH: 130, minW: 40,  maxW: 100 }, false, -24],
    ["crystal_mid_rocks",   0.34, 0.20, 0x130a26, { minH: 50,  maxH: 140, minW: 90,  maxW: 190 }, true,  bottomBase(0.20)],
  ];
  const crystals = [
    // [name, scrollX, scrollY, colours, alpha, cluster config, dir, baseline, glow]
    ["crystal_far",     0.18, 0.10, "dim",    0.95, { minL: 45, maxL: 100, minGap: 200, maxGap: 340, minW: 13, maxW: 20 }, -1, bottomBase(0.10), false],
    ["crystal_ceiling", 0.30, 0.18, "bright", 0.85, { minL: 28, maxL: 65,  minGap: 240, maxGap: 420, minW: 10, maxW: 16 },  1, -18,              true ],
    ["crystal_near",    0.42, 0.24, "bright", 1.00, { minL: 75, maxL: 165, minGap: 240, maxGap: 400, minW: 20, maxW: 32 }, -1, bottomBase(0.24) - 12, true ],
  ];
  const palettes = {
    dim:    { body: 0x4a2486, facet: 0x6a3fb8, edge: 0x9f7ae6 },
    bright: { body: 0x8a3ffc, facet: 0xc39bff, edge: 0xf3e6ff },
  };

  const addRocks = ([name, sx, sy, color, cfg, up, baseline]) => {
    const width = widthFor(sx);
    bakeLayer(scene, name, { color, alpha: 1, width, maxH: cfg.maxH, up, spikes: planSpikes(width, cfg, random), baseline, scrollX: sx, scrollY: sy });
  };

  ensureSoftTexture(scene, "crystalglow", 0xa25bff);
  const addCrystals = ([name, sx, sy, paletteName, alpha, cfg, dir, baseline, glow]) => {
    const width = widthFor(sx);
    const clusters = planClusters(width, cfg, random);
    const pad = 4;
    const h = Math.ceil(cfg.maxL) + pad * 2;
    const baseInTexture = dir < 0 ? h - pad : pad;
    const imageY = baseline - baseInTexture;

    // 💡 A soft light behind each cluster (added first, so the crystals sit in front of it), pulsing slowly
    if (glow) {
      clusters.forEach(cl => {
        const light = scene.add.image(cl.x, baseline + dir * cl.size * 0.55, "crystalglow")
          .setDisplaySize(cl.size * 2.6, cl.size * 2.0)
          .setScrollFactor(sx, sy)
          .setBlendMode("ADD")
          .setAlpha(0.35);
        scene.tweens.add({
          targets: light, alpha: 0.7, duration: 1600 + random() * 1600,
          yoyo: true, repeat: -1, ease: "Sine.InOut", delay: random() * 1500
        });
      });
    }

    bakeChunks(scene, name, {
      width, h, imageY, alpha, scrollX: sx, scrollY: sy,
      draw: (g, left, chunkW) => {
        clusters.forEach(cl => {
          if (cl.x + cfg.maxL < left - 4 || cl.x - cfg.maxL > left + chunkW + 4) return;   // nowhere near this chunk
          cl.shards.forEach(sh => drawShard(g, {
            x: cl.x + sh.dx - left, y: baseInTexture, angle: sh.angle, length: sh.length, width: sh.width, dir
          }, palettes[paletteName]));
        });
      }
    });
  };

  // Back to front: far wall, far crystals, ceiling (stalactites then hanging crystals), floor rocks, near crystals
  addRocks(rocks[0]);
  addCrystals(crystals[0]);
  addRocks(rocks[1]);
  addCrystals(crystals[1]);
  addRocks(rocks[2]);
  addCrystals(crystals[2]);

  // 3) Tiny sparkles floating up through the cave and twinkling
  ensureSparkleTexture(scene);
  const sparkles = scene.add.particles(0, 0, "sparkle", {
    x: { min: 0, max: camW },
    y: { min: camH * 0.2, max: camH },
    lifespan: 4500,
    speedY: { min: -18, max: -6 },
    speedX: { min: -6, max: 6 },
    scale: { min: 0.5, max: 1.1 },
    alpha: { values: [0, 1, 0.2, 0.9, 0] },
    rotate: { min: 0, max: 90 },
    frequency: 240,
    quantity: 1,
    advance: 4500
  });
  sparkles.setScrollFactor(0);
}
