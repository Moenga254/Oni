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

// ─── Grasslands ──────────────────────────────────────────────────────────────────────────────

// Height of a gentle rolling hill line at world position gx (several waves added together)
function hillHeight(gx, base, amp, seed) {
  return base
    + Math.sin(gx / 310 + seed) * amp
    + Math.sin(gx / 127 + seed * 2.3) * amp * 0.45
    + Math.sin(gx / 53 + seed * 3.7) * amp * 0.12;
}

// A fluffy cumulus cloud: a shaded flat bottom, white puffs on top and a soft highlight.
// It is drawn a little below the texture's bottom edge, so the bottom comes out flat.
// colors: { shadow, body, light, lightSide } (lightSide -1..1 moves the highlight towards the sun)
const DAY_CLOUD = { shadow: 0xc9d7ea, body: 0xe9f1fa, light: 0xffffff, lightSide: -0.12 };
function makeCloudTexture(scene, key, w, h, rand, colors = DAY_CLOUD) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const base = h;
  const puffs = [];
  const count = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const middle = 1 - Math.abs(t - 0.5) * 1.3;                       // puffs are biggest in the middle
    const r = h * (0.22 + 0.24 * middle + rand() * 0.08);
    puffs.push({ x: w * (0.14 + t * 0.72) + (rand() - 0.5) * 10, y: base - r * 0.55 - middle * h * 0.12, r });
  }
  g.fillStyle(colors.shadow, 1);                                       // shaded underside
  puffs.forEach(p => g.fillCircle(p.x, p.y + p.r * 0.3, p.r));
  g.fillStyle(colors.body, 1);                                         // body
  puffs.forEach(p => g.fillCircle(p.x, p.y, p.r * 0.95));
  g.fillStyle(colors.light, 1);                                        // sunlit tops
  puffs.forEach(p => g.fillCircle(p.x + p.r * colors.lightSide, p.y - p.r * 0.14, p.r * 0.78));
  g.generateTexture(key, w, base);
  g.destroy();
}

// ☀️ Grasslands backdrop: a deep blue sky fading to a pale horizon, a warm sun, hazy snow-capped
// mountains, rolling hills with trees at two distances, fluffy clouds drifting at two depths,
// and a few birds flying past. Built like the other backdrops: hills and trees are baked once.
export function drawGrasslandsBackdrop(scene, { colors, worldWidth, worldHeight }) {
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const maxScrollX = Math.max(0, worldWidth - camW);
  const maxScrollY = Math.max(0, worldHeight - camH);
  const random = makeRandom(20261107);
  const widthFor = (sx) => camW + 300 + sx * maxScrollX;
  const bottomBase = (sy) => camH + sy * maxScrollY + 24;

  // 1) Sky, fixed to the screen
  const sky = scene.add.graphics();
  sky.fillGradientStyle(colors[0], colors[1], colors[2], colors[3], 1);
  sky.fillRect(-20, -20, camW + 40, camH + 40);
  sky.setScrollFactor(0);

  // 2) Sun with a big warm glow
  addGlow(scene, "sunglow", camW * 0.8, camH * 0.17, 520, 420, 0xfff1c4, 0.55);
  const sun = scene.add.graphics().setScrollFactor(0);
  sun.fillStyle(0xfffbe8, 0.5);
  sun.fillCircle(camW * 0.8, camH * 0.17, 38);
  sun.fillStyle(0xfffdf4, 1);
  sun.fillCircle(camW * 0.8, camH * 0.17, 28);

  // 3) Far clouds (small, pale, barely moving)
  for (let i = 0; i < 4; i++) makeCloudTexture(scene, `cloud_small_${i}`, 150 + random() * 60, 52 + random() * 14, random);
  for (let i = 0; i < 4; i++) makeCloudTexture(scene, `cloud_big_${i}`, 230 + random() * 90, 78 + random() * 22, random);
  const addClouds = (prefix, sx, minY, maxY, scaleMin, scaleMax, alpha, spacing) => {
    const width = widthFor(sx);
    for (let x = random() * spacing; x < width; x += spacing * (0.7 + random() * 0.6)) {
      const cloud = scene.add.image(x, minY + random() * (maxY - minY), `${prefix}_${Math.floor(random() * 4)}`)
        .setScale(scaleMin + random() * (scaleMax - scaleMin))
        .setAlpha(alpha)
        .setScrollFactor(sx, 0.05);
      scene.tweens.add({ targets: cloud, x: cloud.x + 40 + random() * 50, duration: 14000 + random() * 10000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    }
  };
  addClouds("cloud_small", 0.05, 40, 120, 0.6, 0.9, 0.8, 260);

  // 4) Hazy blue mountains with snow on their peaks
  {
    const sx = 0.08, sy = 0.05, width = widthFor(sx);
    const peaks = planSpikes(width, { minH: 120, maxH: 210, minW: 240, maxW: 420 }, random);
    const h = 220;
    bakeChunks(scene, "grass_mountains", {
      width, h, imageY: bottomBase(sy) - h, alpha: 1, scrollX: sx, scrollY: sy,
      draw: (g, left, chunkW) => {
        peaks.forEach(p => {
          const x0 = p.x - left;
          if (x0 + p.w < -2 || x0 > chunkW + 2) return;
          const tipX = x0 + p.w / 2 + p.lean, tipY = h - p.h;
          g.fillStyle(0x8fb3d4, 1);
          g.fillTriangle(x0, h, x0 + p.w, h, tipX, tipY);
          g.fillStyle(0x7ea3c6, 1);                                       // shaded side
          g.fillTriangle(tipX, tipY, x0 + p.w, h, tipX + p.w * 0.12, h);
          const k = 0.22;                                                  // snow cap: the top 22%
          g.fillStyle(0xf4f8fc, 1);
          g.fillTriangle(tipX + (x0 - tipX) * k, tipY + p.h * k, tipX + (x0 + p.w - tipX) * k, tipY + p.h * k, tipX, tipY);
        });
      }
    });
  }

  // 5) Near clouds (big and bright), in front of the mountains
  addClouds("cloud_big", 0.14, 30, 150, 0.8, 1.15, 0.95, 420);

  // 6) Rolling hills with trees: far ones hazy and pale, near ones rich green
  const hillLayers = [
    // [name, scrollX, scrollY, hill colour, tree colour, base height, amplitude, seed, tree spacing]
    ["grass_far_hills",  0.2,  0.12, 0x8cc47a, 0x6fa864, 110, 26, 1.3, 60],
    ["grass_near_hills", 0.36, 0.22, 0x5fa843, 0x3f7f2c, 70,  22, 4.1, 46],
  ];
  hillLayers.forEach(([name, sx, sy, color, treeColor, base, amp, seed, treeGap]) => {
    const width = widthFor(sx);
    const h = Math.ceil(base + amp * 1.6 + 60);
    const trees = [];
    for (let gx = random() * treeGap; gx < width; gx += treeGap * (0.4 + random() * 1.6)) {
      if (random() < 0.35) continue;                                       // gaps between groves
      trees.push({ gx, size: 9 + random() * 9, round: random() < 0.6 });
    }
    bakeChunks(scene, name, {
      width, h, imageY: bottomBase(sy) - h, alpha: 1, scrollX: sx, scrollY: sy,
      draw: (g, left, chunkW) => {
        // trees first, so the hill covers their bottoms
        trees.forEach(t => {
          const x = t.gx - left;
          if (x < -30 || x > chunkW + 30) return;
          const groundY = h - hillHeight(t.gx, base, amp, seed);
          g.fillStyle(0x5a4030, 1);
          g.fillRect(x - 1.5, groundY - t.size * 0.9, 3, t.size);
          g.fillStyle(treeColor, 1);
          if (t.round) {
            g.fillCircle(x, groundY - t.size * 1.3, t.size * 0.75);
            g.fillCircle(x - t.size * 0.45, groundY - t.size * 0.95, t.size * 0.55);
            g.fillCircle(x + t.size * 0.45, groundY - t.size * 0.95, t.size * 0.55);
            g.fillStyle(0xffffff, 0.12);
            g.fillCircle(x - t.size * 0.2, groundY - t.size * 1.5, t.size * 0.35);
          } else {
            g.fillTriangle(x - t.size * 0.6, groundY - t.size * 0.5, x + t.size * 0.6, groundY - t.size * 0.5, x, groundY - t.size * 2.4);
          }
        });
        g.fillStyle(color, 1);
        const pts = [{ x: -4, y: h }];
        for (let lx = -4; lx <= chunkW + 4; lx += 8) pts.push({ x: lx, y: h - hillHeight(left + lx, base, amp, seed) });
        pts.push({ x: chunkW + 4, y: h });
        g.fillPoints(pts, true);
        g.fillStyle(0xffffff, 0.08);                                         // light catching the hilltops
        const rim = [];
        for (let lx = -4; lx <= chunkW + 4; lx += 8) rim.push({ x: lx, y: h - hillHeight(left + lx, base, amp, seed) });
        for (let i = rim.length - 1; i >= 0; i--) rim.push({ x: rim[i].x, y: rim[i].y + 6 });
        g.fillPoints(rim, true);
      }
    });
  });

  // 7) A few birds flapping across the sky now and then
  for (let i = 0; i < 3; i++) {
    const bird = scene.add.graphics().setScrollFactor(0);
    bird.lineStyle(2, 0x2c3e50, 0.8);
    bird.beginPath(); bird.moveTo(-7, -2); bird.lineTo(0, 2); bird.lineTo(7, -2); bird.strokePath();
    const y = 50 + random() * 90;
    bird.setPosition(-30, y);
    scene.tweens.add({ targets: bird, scaleY: 0.3, duration: 220, yoyo: true, repeat: -1 });
    scene.tweens.add({
      targets: bird, x: camW + 30, y: y - 20 + random() * 40, duration: 16000 + random() * 8000,
      repeat: -1, delay: i * 5000 + random() * 3000, repeatDelay: 4000 + random() * 6000
    });
  }
}

// 🌱 A grass-topped platform: layered soil with pebbles, a thick grass cap with blades sticking up,
// and (on the ground) a few flowers. Floating ones get a rounded underside and dangling roots.
// Returns how far the grass sticks up above the platform's top, so the caller can place the picture.
export function bakeGrassPlatform(scene, key, w, h, floating, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(9000 + seed * 131);
  const over = 10;                         // room above the platform for grass blades and flowers
  const under = floating ? 8 : 0;          // room below for roots
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const top = over;

  // Soil: three bands, darker further down
  const soil = [0x8b5a2b, 0x76491f, 0x5f3a19];
  const bandH = h / 3;
  soil.forEach((c, i) => {
    g.fillStyle(c, 1);
    if (floating && i === 2) g.fillRoundedRect(0, top + bandH * i, w, bandH + 1, { tl: 0, tr: 0, bl: 6, br: 6 });
    else g.fillRect(0, top + bandH * i, w, bandH + 1);
  });
  // Pebbles
  for (let i = 0; i < w / 18; i++) {
    g.fillStyle(rand() < 0.5 ? 0x9c8a74 : 0x6f6255, 1);
    g.fillEllipse(4 + rand() * (w - 8), top + 9 + rand() * (h - 12), 3 + rand() * 4, 2 + rand() * 2.5);
  }
  // Roots dangling under floating platforms
  if (floating) {
    g.lineStyle(1.5, 0x5a3a1c, 1);
    for (let x = 10 + rand() * 12; x < w - 8; x += 16 + rand() * 18) {
      g.beginPath(); g.moveTo(x, top + h - 2);
      g.lineTo(x + (rand() - 0.5) * 6, top + h + 3 + rand() * 4);
      g.strokePath();
    }
  }

  // Grass cap: a thick green strip with a wavy lower edge and a light top line
  g.fillStyle(0x4c9a2a, 1);
  g.fillRect(0, top, w, 7);
  for (let x = 0; x <= w; x += 6) g.fillCircle(x, top + 7, 2.5 + rand() * 2);
  g.fillStyle(0x6cc24a, 1);
  g.fillRect(0, top, w, 3);
  if (floating) {                          // rounded grassy ends
    g.fillStyle(0x4c9a2a, 1);
    g.fillCircle(0, top + 4, 4);
    g.fillCircle(w, top + 4, 4);
  }

  // Grass blades
  for (let x = 1; x < w - 1; x += 2 + rand() * 3) {
    const bh = 3 + rand() * 6;
    const lean = (rand() - 0.5) * 3;
    g.fillStyle(rand() < 0.5 ? 0x5fb53a : 0x3f8a26, 1);
    g.fillTriangle(x - 1.3, top + 2, x + 1.3, top + 2, x + lean, top + 2 - bh);
  }

  // Flowers on the ground
  if (!floating) {
    const petals = [0xffffff, 0xffe066, 0xff8fb1, 0xc39bff];
    for (let x = 12 + rand() * 30; x < w - 8; x += 30 + rand() * 60) {
      const fh = 5 + rand() * 3;
      g.lineStyle(1, 0x3f8a26, 1);
      g.lineBetween(x, top + 2, x, top + 2 - fh);
      g.fillStyle(petals[Math.floor(rand() * petals.length)], 1);
      g.fillCircle(x, top + 2 - fh, 2.2);
      g.fillStyle(0xffc533, 1);
      g.fillCircle(x, top + 2 - fh, 0.9);
    }
  }

  g.generateTexture(key, w, over + h + under);
  g.destroy();
  return over;
}

// 🪵 A wooden plank platform (for the moving platforms on the Grasslands)
export function bakeWoodPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(7000 + seed * 53);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x6b4423, 1);
  g.fillRoundedRect(0, 0, w, h, 4);
  g.fillStyle(0x9a6435, 1);
  g.fillRoundedRect(1, 1, w - 2, h - 5, 3);
  g.fillStyle(0xb37a45, 1);
  g.fillRect(2, 2, w - 4, 3);                        // light top edge
  g.lineStyle(1, 0x5a3a1c, 0.8);
  for (let x = 18 + rand() * 6; x < w - 8; x += 20 + rand() * 8) g.lineBetween(x, 2, x, h - 5);   // plank joins
  g.lineStyle(1, 0x7d5129, 0.7);
  for (let i = 0; i < 3; i++) {                       // wood grain
    const y = 6 + rand() * (h - 13);
    g.lineBetween(4 + rand() * 10, y, w - 4 - rand() * 10, y);
  }
  g.fillStyle(0x3a2a1a, 1);                           // nails
  [5, w - 5].forEach(x => { g.fillCircle(x, 5, 1.2); g.fillCircle(x, h - 8, 1.2); });
  g.generateTexture(key, w, h);
  g.destroy();
}

// ─── Sky Kingdom ─────────────────────────────────────────────────────────────────────────────

// Clouds lit by a low evening sun on the right: purple shadows, peach bodies, golden edges
const SUNSET_CLOUD = { shadow: 0x8a5a8c, body: 0xf0a07c, light: 0xffd9a0, lightSide: 0.18 };

// A long bank of cloud (the "sea of clouds" below the kingdom), filled solid underneath
function bakeCloudBank(scene, name, { width, h, top, imageY, scrollX, scrollY, colors, rand }) {
  const puffs = [];
  for (let gx = -40; gx < width + 80; gx += 26 + rand() * 30) puffs.push({ gx, r: 26 + rand() * 30, dy: (rand() - 0.5) * 18 });
  bakeChunks(scene, name, {
    width, h, imageY, alpha: 1, scrollX, scrollY,
    draw: (g, left, chunkW) => {
      const near = puffs.filter(p => p.gx - left > -70 && p.gx - left < chunkW + 70);
      g.fillStyle(colors.shadow, 1);
      g.fillRect(0, top + 30, chunkW, h - top - 30);
      near.forEach(p => g.fillCircle(p.gx - left, top + p.r * 0.9 + p.dy + 10, p.r));
      g.fillStyle(colors.body, 1);
      near.forEach(p => g.fillCircle(p.gx - left, top + p.r * 0.9 + p.dy, p.r * 0.92));
      g.fillStyle(colors.light, 1);
      near.forEach(p => g.fillCircle(p.gx - left + p.r * 0.2, top + p.r * 0.75 + p.dy, p.r * 0.6));
    }
  });
}

// 🏰 Sky Kingdom backdrop: an evening sky from deep indigo to glowing gold, a big setting sun,
// thin pink streaks of high cloud, distant floating islands with castles, sunset-lit clouds,
// a sea of clouds below and birds flying past. Built like the other backdrops (baked once).
export function drawSkyKingdomBackdrop(scene, { colors, worldWidth, worldHeight }) {
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const maxScrollX = Math.max(0, worldWidth - camW);
  const maxScrollY = Math.max(0, worldHeight - camH);
  const random = makeRandom(20261108);
  const widthFor = (sx) => camW + 300 + sx * maxScrollX;
  const bottomBase = (sy) => camH + sy * maxScrollY + 24;

  // 1) Evening sky, fixed to the screen: indigo -> rose -> orange -> gold, in three bands
  const sky = scene.add.graphics().setScrollFactor(0);
  const bands = [[colors[0], colors[1], 0, 0.38], [colors[1], colors[2], 0.38, 0.7], [colors[2], colors[3], 0.7, 1.05]];
  bands.forEach(([a, b, from, to]) => {
    sky.fillGradientStyle(a, a, b, b, 1);
    sky.fillRect(-20, camH * from - (from === 0 ? 20 : 0), camW + 40, camH * (to - from) + (from === 0 ? 20 : 1));
  });

  // 2) The first stars, faint, at the very top
  const stars = scene.add.graphics().setScrollFactor(0.01, 0);
  for (let i = 0; i < 30; i++) {
    stars.fillStyle(0xffffff, 0.15 + random() * 0.35);
    stars.fillCircle(random() * (camW + 100), random() * camH * 0.22, random() < 0.2 ? 1.3 : 0.8);
  }

  // 3) The setting sun with a wide warm glow
  const sunX = camW * 0.72, sunY = camH * 0.6;
  addGlow(scene, "sunset_glow_wide", sunX, sunY, camW * 1.3, camH * 0.9, 0xff9a4a, 0.45);
  addGlow(scene, "sunset_glow", sunX, sunY, 300, 300, 0xffd27a, 0.7);
  const sun = scene.add.graphics().setScrollFactor(0);
  sun.fillStyle(0xfff3c4, 1);
  sun.fillCircle(sunX, sunY, 46);

  // 4) Thin streaks of high cloud, pink underneath, drifting very slowly
  const streaks = scene.add.graphics().setScrollFactor(0.03, 0);
  for (let i = 0; i < 9; i++) {
    const x = random() * (camW + 200), y = 40 + random() * camH * 0.35, w = 120 + random() * 220;
    streaks.fillStyle(0xffb3a7, 0.22 + random() * 0.15);
    streaks.fillEllipse(x, y, w, 5 + random() * 5);
    streaks.fillStyle(0xffe1c4, 0.25);
    streaks.fillEllipse(x + 10, y - 2, w * 0.7, 3);
  }
  scene.tweens.add({ targets: streaks, x: 60, duration: 30000, yoyo: true, repeat: -1, ease: "Sine.InOut" });

  // 5) Far-off floating islands, some with castles, in hazy purple
  {
    const sx = 0.1, sy = 0.05, width = widthFor(sx), h = 230;
    const islands = [];
    for (let gx = 120 + random() * 200; gx < width; gx += 260 + random() * 320) {
      islands.push({ gx, w: 70 + random() * 130, y: 70 + random() * 100, castle: random() < 0.55, seed: random() });
    }
    bakeChunks(scene, "sky_far_islands", {
      width, h, imageY: camH * 0.12 + sy * maxScrollY * 0.3, alpha: 0.9, scrollX: sx, scrollY: sy,
      draw: (g, left, chunkW) => {
        islands.forEach(is => {
          const x = is.gx - left;
          if (x + is.w < -40 || x - 40 > chunkW) return;
          const top = is.y;
          // rock underneath, pointing down, and a flat grassy top
          g.fillStyle(0x6a4a7e, 1);
          g.fillTriangle(x, top, x + is.w, top, x + is.w * 0.45, top + is.w * 0.6);
          g.fillTriangle(x + is.w * 0.15, top, x + is.w * 0.7, top, x + is.w * 0.3, top + is.w * 0.8);
          g.fillStyle(0x7d5a8c, 1);
          g.fillRect(x - 2, top - 5, is.w + 4, 7);
          if (is.castle) {
            // a little castle: walls, towers with pointed roofs and a flag
            const cx = x + is.w * 0.5, base = top - 4, cw = Math.min(70, is.w * 0.6);
            g.fillStyle(0x5c4070, 1);
            g.fillRect(cx - cw / 2, base - 18, cw, 18);
            for (let bx = cx - cw / 2; bx < cx + cw / 2 - 3; bx += 7) g.fillRect(bx, base - 22, 4, 4);   // battlements
            [[cx - cw / 2, 30], [cx + cw / 2 - 8, 30], [cx - 5, 44]].forEach(([tx, th]) => {
              g.fillRect(tx, base - th, 10, th);
              g.fillTriangle(tx - 2, base - th, tx + 12, base - th, tx + 5, base - th - 14);
            });
            g.lineStyle(1, 0x5c4070, 1);
            g.lineBetween(cx, base - 58, cx, base - 66);
            g.fillStyle(0xffc46b, 0.9);
            g.fillTriangle(cx, base - 66, cx + 7, base - 64, cx, base - 62);
            g.fillStyle(0xffd27a, 0.8);                                    // lit windows
            g.fillRect(cx - 2, base - 30, 3, 4);
            g.fillRect(cx - cw / 2 + 3, base - 20, 3, 4);
          }
        });
      }
    });
  }

  // 6) Sunset-lit clouds at two depths, drifting slowly
  for (let i = 0; i < 4; i++) makeCloudTexture(scene, `sun_cloud_small_${i}`, 150 + random() * 60, 50 + random() * 14, random, SUNSET_CLOUD);
  for (let i = 0; i < 4; i++) makeCloudTexture(scene, `sun_cloud_big_${i}`, 230 + random() * 90, 76 + random() * 20, random, SUNSET_CLOUD);
  const addClouds = (prefix, sx, minY, maxY, scaleMin, scaleMax, alpha, spacing) => {
    const width = widthFor(sx);
    for (let x = random() * spacing; x < width; x += spacing * (0.7 + random() * 0.6)) {
      const cloud = scene.add.image(x, minY + random() * (maxY - minY), `${prefix}_${Math.floor(random() * 4)}`)
        .setScale(scaleMin + random() * (scaleMax - scaleMin))
        .setAlpha(alpha)
        .setScrollFactor(sx, 0.05);
      scene.tweens.add({ targets: cloud, x: cloud.x + 40 + random() * 50, duration: 15000 + random() * 10000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    }
  };
  addClouds("sun_cloud_small", 0.06, 50, 150, 0.6, 0.9, 0.85, 300);

  // 7) The sea of clouds below: a far bank in shadow, then a nearer, brighter bank
  bakeCloudBank(scene, "sky_cloud_sea_far", {
    width: widthFor(0.2), h: 170, top: 20, imageY: bottomBase(0.12) - 170 + 10, scrollX: 0.2, scrollY: 0.12, rand: random,
    colors: { shadow: 0x6a4a7a, body: 0xa86f86, light: 0xd08f8c }
  });
  addClouds("sun_cloud_big", 0.28, camH * 0.26, camH * 0.36, 0.7, 0.9, 0.7, 560);
  bakeCloudBank(scene, "sky_cloud_sea_near", {
    width: widthFor(0.42), h: 140, top: 10, imageY: bottomBase(0.24) - 140 + 30, scrollX: 0.42, scrollY: 0.24, rand: random,
    colors: { shadow: 0x7e5486, body: 0xd88e84, light: 0xf0b592 }   // a little softer than the floating clouds
  });

  // 8) Birds, dark against the sunset
  for (let i = 0; i < 4; i++) {
    const bird = scene.add.graphics().setScrollFactor(0);
    bird.lineStyle(2, 0x3a2340, 0.85);
    bird.beginPath(); bird.moveTo(-7, -2); bird.lineTo(0, 2); bird.lineTo(7, -2); bird.strokePath();
    const y = 60 + random() * 110;
    bird.setPosition(camW + 30, y);
    scene.tweens.add({ targets: bird, scaleY: 0.3, duration: 240, yoyo: true, repeat: -1 });
    scene.tweens.add({
      targets: bird, x: -30, y: y - 25 + random() * 50, duration: 15000 + random() * 8000,
      repeat: -1, delay: i * 3500 + random() * 3000, repeatDelay: 3000 + random() * 6000
    });
  }
}

// 🏝️ A piece of floating sky island (the Sky Kingdom ground): grass lit gold by the sunset on top,
// layered rock below with cracks, darker cliff edges and a few hanging vines.
// Returns how far the grass sticks up above the platform's top.
export function bakeSkyIslandPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(5000 + seed * 97);
  const over = 8;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const top = over;

  const rock = [0x9a6448, 0x83503c, 0x6b3f36];
  const bandH = h / 3;
  rock.forEach((c, i) => { g.fillStyle(c, 1); g.fillRect(0, top + bandH * i, w, bandH + 1); });
  g.fillStyle(0x4f2f36, 0.55);                              // shaded cliff edges
  g.fillRect(0, top, 4, h);
  g.fillRect(w - 4, top, 4, h);
  g.lineStyle(1, 0x55323a, 0.8);                            // cracks
  for (let x = 14 + rand() * 20; x < w - 10; x += 30 + rand() * 40) {
    const y = top + 9 + rand() * (h - 14);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4 + rand() * 5, y + 3); g.lineTo(x + 8 + rand() * 6, y + 1); g.strokePath();
  }

  // Grass, lit warm gold on top
  g.fillStyle(0x6f9a36, 1);
  g.fillRect(0, top, w, 7);
  for (let x = 0; x <= w; x += 6) g.fillCircle(x, top + 7, 2 + rand() * 2);
  g.fillStyle(0xc9d65a, 1);
  g.fillRect(0, top, w, 2.5);
  for (let x = 1; x < w - 1; x += 2 + rand() * 3) {
    g.fillStyle(rand() < 0.5 ? 0x8fb440 : 0xd4d86a, 1);
    g.fillTriangle(x - 1.2, top + 2, x + 1.2, top + 2, x + (rand() - 0.5) * 3, top + 2 - (3 + rand() * 5));
  }

  // Vines hanging over the edges
  g.lineStyle(1.5, 0x5f8a2e, 1);
  [3, w - 3].forEach(vx => {
    g.beginPath(); g.moveTo(vx, top + 4);
    g.lineTo(vx + (rand() - 0.5) * 3, top + 10 + rand() * (h - 12));
    g.strokePath();
  });

  g.generateTexture(key, w, over + h);
  g.destroy();
  return over;
}

// 🏛️ A floating marble slab with gold trim (the Sky Kingdom's small platforms)
export function bakeMarblePlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(3000 + seed * 61);
  const under = 7;                                         // gold ornaments hanging underneath
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  g.fillStyle(0xb9a68a, 1);                                // underside shadow
  g.fillRoundedRect(1, 3, w - 2, h - 3, 4);
  g.fillStyle(0xeee3cf, 1);                                // marble face
  g.fillRoundedRect(0, 0, w, h - 4, 4);
  g.lineStyle(1, 0xcdbd9f, 1);                             // stone blocks
  g.lineBetween(2, h / 2, w - 2, h / 2);
  for (let x = 14 + rand() * 8; x < w - 6; x += 20 + rand() * 6) g.lineBetween(x, 5, x, h - 5);
  g.lineStyle(1, 0xd8cab2, 0.8);                           // marble veins
  for (let i = 0; i < 2; i++) {
    const x = 6 + rand() * (w - 20);
    g.beginPath(); g.moveTo(x, 6); g.lineTo(x + 5, 9); g.lineTo(x + 9, 7); g.strokePath();
  }
  g.fillStyle(0xe0a82e, 1);                                // gold trim along the top
  g.fillRect(0, 0, w, 4);
  g.fillStyle(0xffe08a, 1);
  g.fillRect(1, 0, w - 2, 1.5);
  g.fillStyle(0xe0a82e, 1);                                // little gold ornaments underneath
  for (let x = 10; x < w - 6; x += 18) g.fillTriangle(x - 4, h - 1, x + 4, h - 1, x, h + under - 1);

  g.generateTexture(key, w, h + under);
  g.destroy();
}

// ☁️ A small fluffy cloud to stand on (the Sky Kingdom's moving platforms).
// Returns how far the puffs stick up above the platform's top.
export function bakeCloudPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(8000 + seed * 41);
  const over = 8;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const puffs = [];
  for (let x = 10; x <= w - 10; x += 14) puffs.push({ x: x + (rand() - 0.5) * 4, r: 9 + rand() * 4 });
  g.fillStyle(SUNSET_CLOUD.shadow, 1);
  puffs.forEach(p => g.fillCircle(p.x, over + h - p.r * 0.6, p.r));
  g.fillStyle(0xfbe3d4, 1);
  g.fillRoundedRect(2, over, w - 4, h * 0.6, 8);
  puffs.forEach(p => g.fillCircle(p.x, over + 6, p.r * 0.85));
  g.fillStyle(0xffffff, 1);
  puffs.forEach(p => g.fillCircle(p.x + p.r * 0.2, over + 3, p.r * 0.5));
  g.generateTexture(key, w, over + h + 4);
  g.destroy();
  return over;
}

// ─── Magma Falls ─────────────────────────────────────────────────────────────────────────────

// A glowing line of lava: a wide orange stroke with a hot yellow core
function lavaLine(g, pts, width) {
  g.lineStyle(width, 0xff4a0a, 1);
  g.strokePoints(pts, false);
  g.lineStyle(Math.max(1, width * 0.4), 0xffc23a, 1);
  g.strokePoints(pts, false);
}

// 🌋 Magma Falls backdrop: a black sky glowing red and orange near the ground, smoking volcanoes with
// lava pouring down their sides, dark cliffs with falls of magma, jagged rocks, rising embers and falling ash.
// Built like the other backdrops: the landscape is baked once; only smoke, glows and particles move.
export function drawVolcanoBackdrop(scene, { colors, worldWidth, worldHeight }) {
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const maxScrollX = Math.max(0, worldWidth - camW);
  const maxScrollY = Math.max(0, worldHeight - camH);
  const random = makeRandom(20261109);
  const widthFor = (sx) => camW + 300 + sx * maxScrollX;
  const bottomBase = (sy) => camH + sy * maxScrollY + 24;

  // 1) Sky, fixed to the screen: black -> deep red -> orange, in three bands
  const sky = scene.add.graphics().setScrollFactor(0);
  [[colors[0], colors[1], 0, 0.45], [colors[1], colors[2], 0.45, 0.8], [colors[2], colors[3], 0.8, 1.05]].forEach(([a, b, from, to]) => {
    sky.fillGradientStyle(a, a, b, b, 1);
    sky.fillRect(-20, camH * from - (from === 0 ? 20 : 0), camW + 40, camH * (to - from) + (from === 0 ? 20 : 1));
  });
  addGlow(scene, "magma_horizon", camW / 2, camH * 0.95, camW * 1.5, camH * 0.7, 0xff4a00, 0.4);

  // 2) Far volcanoes: dark cones with glowing craters and rivers of lava running down
  const sx1 = 0.08, sy1 = 0.05, w1 = widthFor(sx1), h1 = 260;
  const volcanoes = [];
  for (let gx = 160 + random() * 200; gx < w1; gx += 420 + random() * 380) {
    volcanoes.push({ gx, base: 260 + random() * 160, height: 150 + random() * 90, crater: 40 + random() * 30, seed: random() });
  }
  bakeChunks(scene, "volcano_far", {
    width: w1, h: h1, imageY: bottomBase(sy1) - h1, alpha: 1, scrollX: sx1, scrollY: sy1,
    draw: (g, left, chunkW) => {
      volcanoes.forEach(v => {
        const x = v.gx - left;
        if (x + v.base < -20 || x - v.base > chunkW + 20) return;
        const top = h1 - v.height;
        g.fillStyle(0x2a0d0a, 1);
        g.fillPoints([{ x: x - v.base / 2, y: h1 }, { x: x - v.crater / 2, y: top }, { x: x + v.crater / 2, y: top }, { x: x + v.base / 2, y: h1 }], true);
        g.fillStyle(0x1c0807, 1);                                          // shaded side
        g.fillPoints([{ x, y: top }, { x: x + v.crater / 2, y: top }, { x: x + v.base / 2, y: h1 }, { x: x + v.base * 0.12, y: h1 }], true);
        g.fillStyle(0xff6a1a, 1);                                          // glowing crater
        g.fillEllipse(x, top + 1, v.crater * 0.9, 7);
        g.fillStyle(0xffd060, 1);
        g.fillEllipse(x, top + 1, v.crater * 0.5, 3);
        // two rivers of lava winding down the slope
        [-1, 1].forEach((side, k) => {
          const pts = [];
          let px = x + side * v.crater * 0.25, py = top + 2;
          const steps = 7;
          for (let s = 0; s <= steps; s++) {
            pts.push({ x: px, y: py });
            px += side * (v.base * 0.35 / steps) + Math.sin((s + k) * 1.7 + v.seed * 9) * 5;
            py += v.height / steps;
          }
          lavaLine(g, pts, 3.2 - k * 0.6);
        });
      });
    }
  });

  // Smoke rising from each crater (soft dark puffs that grow and fade as they go up)
  ensureSoftTexture(scene, "smokepuff", 0x3a2a28);
  const imageY1 = bottomBase(sy1) - h1;
  volcanoes.forEach((v, i) => {
    for (let k = 0; k < 3; k++) {
      const puff = scene.add.image(v.gx, imageY1 + h1 - v.height - 10, "smokepuff").setScrollFactor(sx1, sy1);
      const startY = puff.y;
      const loop = () => {
        puff.setPosition(v.gx + (random() - 0.5) * 10, startY).setDisplaySize(50, 40).setAlpha(0.55);
        scene.tweens.add({
          targets: puff, y: startY - 140 - random() * 60, x: puff.x + 30 + random() * 30,
          displayWidth: 170, displayHeight: 120, alpha: 0, duration: 5200 + random() * 1800,
          onComplete: loop
        });
      };
      scene.time.delayedCall(k * 1800 + i * 500, loop);
    }
  });

  // 3) Dark cliffs with falls of magma pouring down them
  const sx2 = 0.2, sy2 = 0.12, w2 = widthFor(sx2), h2 = 300;
  const cliffs = [];
  for (let gx = 80 + random() * 160; gx < w2; gx += 340 + random() * 300) {
    cliffs.push({ gx, w: 110 + random() * 80, height: 170 + random() * 110, falls: 1 + Math.floor(random() * 2) });
  }
  const imageY2 = bottomBase(sy2) - h2;
  bakeChunks(scene, "volcano_cliffs", {
    width: w2, h: h2, imageY: imageY2, alpha: 1, scrollX: sx2, scrollY: sy2,
    draw: (g, left, chunkW) => {
      cliffs.forEach(c => {
        const x = c.gx - left;
        if (x + c.w < -20 || x - 20 > chunkW) return;
        const top = h2 - c.height;
        g.fillStyle(0x140605, 1);
        g.fillPoints([
          { x: x - 10, y: h2 }, { x: x, y: top + 20 }, { x: x + c.w * 0.3, y: top }, { x: x + c.w * 0.7, y: top + 8 },
          { x: x + c.w, y: top + 26 }, { x: x + c.w + 12, y: h2 }
        ], true);
        for (let f = 0; f < c.falls; f++) {                               // the magma falls
          const fx = x + c.w * (0.32 + f * 0.36);
          const fTop = top + 6 + f * 4;
          g.fillStyle(0xff4a0a, 1);
          g.fillRect(fx - 6, fTop, 12, h2 - fTop);
          g.fillStyle(0xff8a1a, 1);
          g.fillRect(fx - 3.5, fTop, 7, h2 - fTop);
          g.fillStyle(0xffd060, 1);
          g.fillRect(fx - 1.2, fTop, 2.4, h2 - fTop);
          g.fillStyle(0xff6a1a, 1);                                       // lip where it pours over
          g.fillEllipse(fx, fTop, 18, 6);
        }
      });
    }
  });
  // A pulsing glow on every fall, so the magma looks hot and alive
  cliffs.forEach(c => {
    for (let f = 0; f < c.falls; f++) {
      const fx = c.gx + c.w * (0.32 + f * 0.36);
      const glow = scene.add.image(fx, imageY2 + h2 - c.height * 0.45, "magma_horizon")
        .setDisplaySize(70, c.height * 1.1).setAlpha(0.35).setScrollFactor(sx2, sy2).setBlendMode("ADD");
      scene.tweens.add({ targets: glow, alpha: 0.6, duration: 700 + random() * 600, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    }
  });

  // 4) Near jagged rocks, black with a red rim of light from the lava below
  {
    const sx = 0.36, sy = 0.22, width = widthFor(sx), h = 170;
    const spikes = planSpikes(width, { minH: 50, maxH: 150, minW: 50, maxW: 130 }, random);
    bakeChunks(scene, "volcano_near_rocks", {
      width, h, imageY: bottomBase(sy) - h, alpha: 1, scrollX: sx, scrollY: sy,
      draw: (g, left, chunkW) => {
        spikes.forEach(sp => {
          const x0 = sp.x - left;
          if (x0 + sp.w < -2 || x0 > chunkW + 2) return;
          const tipX = x0 + sp.w / 2 + sp.lean, tipY = h - sp.h;
          g.fillStyle(0x0c0403, 1);
          g.fillTriangle(x0, h, x0 + sp.w, h, tipX, tipY);
          g.lineStyle(1.5, 0xff4a0a, 0.5);                                 // red rim light
          g.lineBetween(x0, h, tipX, tipY);
        });
        g.fillStyle(0x0c0403, 1);
        g.fillRect(0, h - 8, chunkW, 8);
      }
    });
  }

  // 5) Embers rising and ash falling
  if (!scene.textures.exists("magma_ember")) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xff7a1a, 0.35); g.fillCircle(5, 5, 5);
    g.fillStyle(0xffd060, 1);    g.fillCircle(5, 5, 1.8);
    g.generateTexture("magma_ember", 10, 10);
    g.clear(); g.fillStyle(0x7a6a66, 0.9); g.fillCircle(2, 2, 1.6);
    g.generateTexture("magma_ash", 4, 4);
    g.destroy();
  }
  scene.add.particles(0, 0, "magma_ember", {
    x: { min: 0, max: camW }, y: camH + 10, lifespan: 6000,
    speedY: { min: -70, max: -30 }, speedX: { min: -15, max: 15 },
    scale: { min: 0.5, max: 1.2 }, alpha: { values: [0, 1, 0.5, 0.9, 0] },
    frequency: 120, advance: 5000
  }).setScrollFactor(0);
  scene.add.particles(0, 0, "magma_ash", {
    x: { min: 0, max: camW }, y: -10, lifespan: 9000,
    speedY: { min: 18, max: 40 }, speedX: { min: -12, max: 6 },
    scale: { min: 0.6, max: 1.3 }, alpha: { start: 0.7, end: 0 },
    frequency: 160, advance: 8000
  }).setScrollFactor(0);
}

// 🪨 A basalt platform: dark columns of rock, a slightly lighter top edge and glowing cracks of lava.
// Ground pieces also glow hot along the bottom (they sit next to lava). Returns how far it sticks up.
export function bakeBasaltPlatform(scene, key, w, h, seed, ground) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(4000 + seed * 89);
  const over = 3;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const top = over;

  g.fillStyle(0x2b2420, 1);
  g.fillRect(0, top, w, h);
  g.lineStyle(1, 0x1a1512, 1);                                   // basalt columns
  for (let x = 6 + rand() * 8; x < w - 4; x += 9 + rand() * 9) g.lineBetween(x, top + 4, x + (rand() - 0.5) * 3, top + h);
  if (ground) {                                                  // hot glow near the bottom
    g.fillStyle(0x6a1a08, 0.8);
    g.fillRect(0, top + h - 8, w, 8);
    g.fillStyle(0xa8300a, 0.6);
    g.fillRect(0, top + h - 3, w, 3);
  }
  g.fillStyle(0x4a3c34, 1);                                      // top edge
  g.fillRect(0, top, w, 4);
  g.fillStyle(0x6a564a, 1);
  g.fillRect(0, top, w, 1.5);
  for (let x = 0; x < w; x += 7) {                               // rough, rocky top
    g.fillStyle(0x4a3c34, 1);
    g.fillTriangle(x, top + 1, x + 7, top + 1, x + 3 + rand() * 2, top - 1 - rand() * 2);
  }
  // glowing cracks
  for (let x = 12 + rand() * 20; x < w - 10; x += 28 + rand() * 40) {
    const pts = [{ x, y: top + 3 }];
    let px = x, py = top + 3;
    for (let s = 0; s < 3; s++) { px += (rand() - 0.5) * 10; py += 3 + rand() * (h / 4); pts.push({ x: px, y: Math.min(py, top + h - 2) }); }
    g.lineStyle(2.4, 0xff4a0a, 0.9);
    g.strokePoints(pts, false);
    g.lineStyle(1, 0xffc23a, 1);
    g.strokePoints(pts, false);
  }
  // sides a little darker, so each piece reads as a solid block
  g.fillStyle(0x000000, 0.25);
  g.fillRect(0, top, 3, h);
  g.fillRect(w - 3, top, 3, h);

  g.generateTexture(key, w, over + h);
  g.destroy();
  return over;
}

// ⚠️ A collapsing platform: paler, already-fractured rock with glowing seams, so it reads as unsafe
export function bakeCrumblePlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(6000 + seed * 37);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x6a4632, 1);
  g.fillRoundedRect(0, 0, w, h, 3);
  g.fillStyle(0x8a5e42, 1);
  g.fillRect(0, 0, w, 4);
  g.fillStyle(0xa87452, 1);
  g.fillRect(0, 0, w, 1.5);
  g.fillStyle(0x4a2e20, 1);                                      // chipped underside
  for (let x = 4; x < w - 4; x += 10 + rand() * 6) g.fillTriangle(x, h - 1, x + 8, h - 1, x + 4, h + 4);
  g.lineStyle(1.5, 0xff8a1a, 0.9);                               // seams between the blocks
  for (let x = 18 + rand() * 6; x < w - 10; x += 22 + rand() * 8) {
    g.beginPath(); g.moveTo(x, 2); g.lineTo(x + (rand() - 0.5) * 6, h / 2); g.lineTo(x + (rand() - 0.5) * 6, h - 1); g.strokePath();
  }
  g.generateTexture(key, w, h + 5);
  g.destroy();
}

// ⬛ An obsidian slab with a vein of lava (the Magma Falls moving platforms)
export function bakeObsidianPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(2000 + seed * 71);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x120c10, 1);
  g.fillRoundedRect(0, 0, w, h, 4);
  g.fillStyle(0x3a2c36, 1);                                      // glassy shine along the top
  g.fillRect(3, 1, w - 6, 3);
  g.fillStyle(0x5a4656, 0.6);
  g.fillTriangle(8, 4, 26, 4, 14, h - 6);
  const pts = [];
  for (let x = 6; x <= w - 6; x += 12) pts.push({ x, y: h * 0.6 + (rand() - 0.5) * 5 });
  g.lineStyle(2.4, 0xff4a0a, 0.9);
  g.strokePoints(pts, false);
  g.lineStyle(1, 0xffc23a, 1);
  g.strokePoints(pts, false);
  g.generateTexture(key, w, h);
  g.destroy();
}

// ─── Toxic Swamp ─────────────────────────────────────────────────────────────────────────────

// A bare, dead tree: a trunk with crooked branches, optionally with moss hanging from them
function deadTree(g, x, baseY, height, color, rand, moss) {
  const trunkW = 5 + height * 0.04;
  g.fillStyle(color, 1);
  g.fillTriangle(x - trunkW, baseY, x + trunkW, baseY, x + (rand() - 0.5) * 8, baseY - height);
  g.lineStyle(Math.max(1.5, trunkW * 0.5), color, 1);
  const tips = [];
  for (let b = 0; b < 4; b++) {
    const by = baseY - height * (0.35 + b * 0.15);
    const side = b % 2 ? 1 : -1;
    const len = height * (0.25 - b * 0.03) * (0.7 + rand() * 0.6);
    const ex = x + side * len, ey = by - len * (0.3 + rand() * 0.5);
    g.beginPath(); g.moveTo(x, by); g.lineTo((x + ex) / 2, ey + len * 0.15); g.lineTo(ex, ey); g.strokePath();
    tips.push({ x: ex, y: ey });
  }
  if (moss) {
    g.lineStyle(1.2, moss, 0.9);
    tips.forEach(t => {
      for (let m = 0; m < 3; m++) {
        const mx = t.x - m * 4 * Math.sign(t.x - x || 1);
        g.lineBetween(mx, t.y + 2, mx + (rand() - 0.5) * 3, t.y + 10 + rand() * 18);
      }
    });
  }
}

// ☣️ Toxic Swamp backdrop: a murky green sky with a sickly sun, factories pouring green smoke, two
// layers of dead trees (the nearer ones dripping with moss), toxic haze drifting low, reeds, leaking
// waste barrels and glowing spores. Built like the other backdrops: the scenery is baked once.
export function drawSwampBackdrop(scene, { colors, worldWidth, worldHeight }) {
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const maxScrollX = Math.max(0, worldWidth - camW);
  const maxScrollY = Math.max(0, worldHeight - camH);
  const random = makeRandom(20261110);
  const widthFor = (sx) => camW + 300 + sx * maxScrollX;
  const bottomBase = (sy) => camH + sy * maxScrollY + 24;

  // 1) Murky sky, fixed to the screen, in three bands
  const sky = scene.add.graphics().setScrollFactor(0);
  [[colors[0], colors[1], 0, 0.45], [colors[1], colors[2], 0.45, 0.8], [colors[2], colors[3], 0.8, 1.05]].forEach(([a, b, from, to]) => {
    sky.fillGradientStyle(a, a, b, b, 1);
    sky.fillRect(-20, camH * from - (from === 0 ? 20 : 0), camW + 40, camH * (to - from) + (from === 0 ? 20 : 1));
  });

  // 2) A sickly sun seen through the smog
  addGlow(scene, "swamp_sun_glow", camW * 0.25, camH * 0.22, 360, 300, 0xc8e85a, 0.3);
  const sun = scene.add.graphics().setScrollFactor(0);
  sun.fillStyle(0xe0f08a, 0.55);
  sun.fillCircle(camW * 0.25, camH * 0.22, 30);

  // 3) Factories on the horizon: blocks with smokestacks and pipes, a few windows lit green
  const sx1 = 0.07, sy1 = 0.05, w1 = widthFor(sx1), h1 = 200;
  const factories = [];
  for (let gx = 200 + random() * 300; gx < w1; gx += 700 + random() * 500) {
    const stacks = [];
    const bw = 120 + random() * 90;
    for (let s = 0; s < 2 + Math.floor(random() * 2); s++) stacks.push({ dx: 15 + random() * (bw - 30), h: 80 + random() * 70 });
    factories.push({ gx, bw, bh: 50 + random() * 40, stacks });
  }
  const imageY1 = bottomBase(sy1) - h1;
  bakeChunks(scene, "swamp_factories", {
    width: w1, h: h1, imageY: imageY1, alpha: 1, scrollX: sx1, scrollY: sy1,
    draw: (g, left, chunkW) => {
      factories.forEach(f => {
        const x = f.gx - left;
        if (x + f.bw < -20 || x - 20 > chunkW) return;
        g.fillStyle(0x1a2412, 1);
        g.fillRect(x, h1 - f.bh, f.bw, f.bh);
        for (let r = 0; r < f.bw; r += 30) g.fillTriangle(x + r, h1 - f.bh, x + r + 30, h1 - f.bh, x + r + 30, h1 - f.bh - 14);   // saw-tooth roof
        f.stacks.forEach(s => {
          g.fillRect(x + s.dx - 5, h1 - f.bh - s.h, 10, s.h);
          g.fillStyle(0x6a7a2a, 1); g.fillRect(x + s.dx - 6, h1 - f.bh - s.h + 8, 12, 3);   // warning stripe
          g.fillStyle(0x1a2412, 1);
        });
        g.fillStyle(0xb4ff2a, 0.7);                                         // lit windows
        for (let wx = x + 10; wx < x + f.bw - 10; wx += 18) if ((wx * 7) % 3 < 2) g.fillRect(wx, h1 - f.bh * 0.55, 6, 5);
        g.fillStyle(0x1a2412, 1);
        g.fillRect(x + f.bw, h1 - 18, 40, 6);                                // a pipe leaking into the swamp
        g.fillStyle(0xa6e22e, 0.9);
        g.fillRect(x + f.bw + 36, h1 - 12, 3, 12);
      });
    }
  });
  // Green smoke rising from every stack
  ensureSoftTexture(scene, "smogpuff", 0x5a6a2a);
  factories.forEach((f, i) => f.stacks.forEach((s, k) => {
    const sx = f.gx + s.dx, sy = imageY1 + h1 - f.bh - s.h;
    const puff = scene.add.image(sx, sy, "smogpuff").setScrollFactor(sx1, sy1);
    const loop = () => {
      puff.setPosition(sx, sy).setDisplaySize(30, 24).setAlpha(0.6);
      scene.tweens.add({
        targets: puff, y: sy - 110 - random() * 50, x: sx + 40 + random() * 40,
        displayWidth: 140, displayHeight: 90, alpha: 0, duration: 5600 + random() * 1800, onComplete: loop
      });
    };
    scene.time.delayedCall(i * 700 + k * 1300, loop);
  }));

  // 4) Far dead trees
  {
    const sx = 0.16, sy = 0.1, width = widthFor(sx), h = 260;
    const trees = [];
    for (let gx = random() * 80; gx < width; gx += 60 + random() * 110) trees.push({ gx, height: 110 + random() * 120, seed: random() });
    bakeChunks(scene, "swamp_far_trees", {
      width, h, imageY: bottomBase(sy) - h, alpha: 1, scrollX: sx, scrollY: sy,
      draw: (g, left, chunkW) => {
        trees.forEach(t => {
          const x = t.gx - left;
          if (x < -80 || x > chunkW + 80) return;
          deadTree(g, x, h, t.height, 0x26341a, makeRandom(Math.floor(t.seed * 1e6)), null);
        });
        g.fillStyle(0x26341a, 1);
        g.fillRect(0, h - 12, chunkW, 12);
      }
    });
  }

  // 5) Toxic haze drifting low over the water
  ensureSoftTexture(scene, "toxic_haze", 0xa6e22e);
  for (let i = 0; i < 7; i++) {
    const haze = scene.add.image((i + 0.5) * camW / 6, camH * (0.62 + random() * 0.12), "toxic_haze")
      .setDisplaySize(300 + random() * 200, 70 + random() * 40).setAlpha(0.12 + random() * 0.08)
      .setScrollFactor(0).setBlendMode("ADD");
    scene.tweens.add({ targets: haze, x: haze.x + 60 + random() * 50, duration: 9000 + random() * 6000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  }

  // 6) Nearer dead trees, darker, with moss hanging from the branches
  {
    const sx = 0.3, sy = 0.18, width = widthFor(sx), h = 320;
    const trees = [];
    for (let gx = 40 + random() * 120; gx < width; gx += 160 + random() * 220) trees.push({ gx, height: 170 + random() * 120, seed: random() });
    bakeChunks(scene, "swamp_near_trees", {
      width, h, imageY: bottomBase(sy) - h, alpha: 1, scrollX: sx, scrollY: sy,
      draw: (g, left, chunkW) => {
        trees.forEach(t => {
          const x = t.gx - left;
          if (x < -120 || x > chunkW + 120) return;
          deadTree(g, x, h, t.height, 0x141c0e, makeRandom(Math.floor(t.seed * 1e6)), 0x4a6a1e);
        });
      }
    });
  }

  // 7) Reeds and cattails, with leaking toxic barrels here and there
  {
    const sx = 0.45, sy = 0.26, width = widthFor(sx), h = 120;
    const reeds = [];
    for (let gx = 0; gx < width; gx += 6 + random() * 10) reeds.push({ gx, height: 30 + random() * 70, lean: (random() - 0.5) * 10, head: random() < 0.3 });
    const barrels = [];
    for (let gx = 200 + random() * 300; gx < width; gx += 500 + random() * 500) barrels.push({ gx, tilt: random() < 0.5 });
    bakeChunks(scene, "swamp_reeds", {
      width, h, imageY: bottomBase(sy) - h, alpha: 1, scrollX: sx, scrollY: sy,
      draw: (g, left, chunkW) => {
        reeds.forEach(r => {
          const x = r.gx - left;
          if (x < -10 || x > chunkW + 10) return;
          g.lineStyle(2, 0x3a3014, 1);
          g.lineBetween(x, h, x + r.lean, h - r.height);
          if (r.head) {
            g.fillStyle(0x4a2e14, 1);
            g.fillRoundedRect(x + r.lean - 2.5, h - r.height + 4, 5, 14, 2.5);
          }
        });
        barrels.forEach(b => {
          const x = b.gx - left;
          if (x < -40 || x > chunkW + 40) return;
          const by = h - 26;
          g.fillStyle(0x5a3a1e, 1);                                         // rusty barrel
          g.fillRoundedRect(x - 12, by, 24, 26, 3);
          g.fillStyle(0xa6e22e, 1);                                         // hazard band
          g.fillRect(x - 12, by + 9, 24, 6);
          g.fillStyle(0x2a1a0c, 1);
          g.fillCircle(x, by + 12, 2.2);
          g.fillStyle(0xb4ff2a, 0.9);                                       // ooze spilling out
          g.fillEllipse(x + 16, h - 2, 26, 5);
          g.fillRect(x + 9, by + 4, 3, 18);
        });
        g.fillStyle(0x1c240e, 1);
        g.fillRect(0, h - 6, chunkW, 6);
      }
    });
  }

  // 8) Glowing spores drifting up
  if (!scene.textures.exists("spore")) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xb4ff2a, 0.3); g.fillCircle(5, 5, 5);
    g.fillStyle(0xeaffa0, 1);   g.fillCircle(5, 5, 1.6);
    g.generateTexture("spore", 10, 10);
    g.destroy();
  }
  scene.add.particles(0, 0, "spore", {
    x: { min: 0, max: camW }, y: { min: camH * 0.3, max: camH },
    lifespan: 6000, speedY: { min: -20, max: -6 }, speedX: { min: -10, max: 10 },
    scale: { min: 0.5, max: 1.1 }, alpha: { values: [0, 0.9, 0.3, 0.8, 0] },
    frequency: 260, advance: 5000
  }).setScrollFactor(0);
}

// 🟫 A mud bank (Toxic Swamp ground): brown mud with darker clumps and roots, a mossy top with tufts,
// and a few glowing toxic mushrooms. Returns how far the moss sticks up above the platform's top.
export function bakeMudPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(1500 + seed * 83);
  const over = 8;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const top = over;

  [[0x5a3e24, 0], [0x4a3420, h / 3], [0x3a2818, (h * 2) / 3]].forEach(([c, y]) => { g.fillStyle(c, 1); g.fillRect(0, top + y, w, h / 3 + 1); });
  for (let i = 0; i < w / 14; i++) {                                    // clumps
    g.fillStyle(rand() < 0.5 ? 0x2e2014 : 0x6a4a2c, 0.8);
    g.fillEllipse(4 + rand() * (w - 8), top + 8 + rand() * (h - 10), 4 + rand() * 6, 2 + rand() * 3);
  }
  g.lineStyle(1.2, 0x2a1c10, 0.9);                                       // roots
  for (let x = 10 + rand() * 20; x < w - 10; x += 30 + rand() * 40) {
    g.beginPath(); g.moveTo(x, top + 6); g.lineTo(x + (rand() - 0.5) * 8, top + 14); g.lineTo(x + (rand() - 0.5) * 10, top + h - 4); g.strokePath();
  }
  g.fillStyle(0x2f4a16, 1);                                              // moss cap
  g.fillRect(0, top, w, 6);
  for (let x = 0; x <= w; x += 6) g.fillCircle(x, top + 6, 2 + rand() * 2);
  g.fillStyle(0x5a7a22, 1);
  g.fillRect(0, top, w, 2);
  for (let x = 1; x < w - 1; x += 3 + rand() * 4) {                      // tufts
    g.fillStyle(rand() < 0.5 ? 0x4a6a1e : 0x6a8a2a, 1);
    g.fillTriangle(x - 1.2, top + 2, x + 1.2, top + 2, x + (rand() - 0.5) * 3, top + 2 - (2 + rand() * 5));
  }
  for (let x = 20 + rand() * 40; x < w - 10; x += 60 + rand() * 90) {    // glowing toxic mushrooms
    g.fillStyle(0xd8d0b0, 1); g.fillRect(x - 1, top - 4, 2, 5);
    g.fillStyle(0xa6e22e, 1); g.fillEllipse(x, top - 5, 8, 4);
    g.fillStyle(0xeaffa0, 1); g.fillCircle(x - 1.5, top - 6, 0.9);
  }
  g.generateTexture(key, w, over + h);
  g.destroy();
  return over;
}

// 🪵 A mossy log (the Toxic Swamp's floating platforms)
export function bakeMossyLogPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(1700 + seed * 59);
  const over = 4;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const top = over;
  g.fillStyle(0x4a3420, 1);
  g.fillRoundedRect(0, top, w, h, h / 2);
  g.fillStyle(0x6a4a2c, 1);
  g.fillRoundedRect(2, top + 2, w - 4, h * 0.45, h / 3);
  g.lineStyle(1, 0x2e2014, 0.9);                                         // bark lines
  for (let i = 0; i < 3; i++) {
    const y = top + 5 + i * (h - 8) / 3;
    g.lineBetween(6 + rand() * 10, y, w - 6 - rand() * 10, y + (rand() - 0.5) * 2);
  }
  g.fillStyle(0x8a6a44, 1);                                              // cut end rings
  g.fillEllipse(4, top + h / 2, 7, h - 2);
  g.lineStyle(1, 0x4a3420, 1);
  g.strokeEllipse(4, top + h / 2, 4, h * 0.5);
  g.fillStyle(0x3a5a18, 1);                                              // moss on top
  for (let x = 8; x < w - 6; x += 5 + rand() * 6) g.fillEllipse(x, top + 1, 7 + rand() * 6, 4);
  g.fillStyle(0x6a8a2a, 1);
  for (let x = 10; x < w - 8; x += 9 + rand() * 9) g.fillCircle(x, top, 1.4);
  g.generateTexture(key, w, over + h);
  g.destroy();
  return over;
}

// 🔩 A rusty metal plate with rivets (the Toxic Swamp's moving platforms)
export function bakeRustyPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(1900 + seed * 47);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x3a3428, 1);
  g.fillRoundedRect(0, 0, w, h, 3);
  g.fillStyle(0x5a5040, 1);
  g.fillRect(2, 2, w - 4, 4);
  for (let i = 0; i < 6; i++) {                                           // rust patches
    g.fillStyle(rand() < 0.5 ? 0x7a4a22 : 0x8a5a2a, 0.8);
    g.fillEllipse(6 + rand() * (w - 12), 6 + rand() * (h - 10), 8 + rand() * 12, 3 + rand() * 4);
  }
  g.fillStyle(0xa6e22e, 0.8);                                             // toxic drip off the edge
  g.fillRect(w - 14, h - 2, 3, 4);
  g.fillStyle(0x1e1a14, 1);                                               // rivets
  for (let x = 6; x < w - 4; x += 16) { g.fillCircle(x, 4, 1.4); g.fillCircle(x, h - 4, 1.4); }
  g.generateTexture(key, w, h + 2);
  g.destroy();
}

// 🪵 A rotten plank (the Toxic Swamp's breaking platforms): pale, split wood with green mould
export function bakeRottenPlankPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(2100 + seed * 31);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x6a5236, 1);
  g.fillRect(0, 0, w, h - 3);
  g.fillStyle(0x8a6c48, 1);
  g.fillRect(0, 0, w, 4);
  g.lineStyle(1, 0x4a3822, 1);                                            // grain and splits
  for (let i = 0; i < 3; i++) { const y = 6 + i * 4; g.lineBetween(3, y, w - 3 - rand() * 20, y + (rand() - 0.5) * 2); }
  g.fillStyle(0x4a3822, 1);                                               // ragged broken ends
  g.fillTriangle(0, h - 3, 0, 4, 5, h - 6);
  g.fillTriangle(w, 2, w, h - 3, w - 6, h / 2);
  for (let i = 0; i < 4; i++) {                                           // mould
    g.fillStyle(0x6a9a22, 0.75);
    g.fillEllipse(8 + rand() * (w - 16), 3 + rand() * (h - 8), 8 + rand() * 10, 3 + rand() * 3);
  }
  g.fillStyle(0x3a2a18, 1);                                               // splinters hanging under it
  for (let x = 6; x < w - 4; x += 12 + rand() * 6) g.fillTriangle(x, h - 3, x + 5, h - 3, x + 2, h + 3);
  g.generateTexture(key, w, h + 4);
  g.destroy();
}

// 🛶 A small raft of lashed logs (the Toxic Swamp's sinking platforms), stained green at the waterline
export function bakeRaftPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(2300 + seed * 43);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const logs = 2;
  for (let i = 0; i < logs; i++) {
    const y = i * (h / logs);
    g.fillStyle(i ? 0x5a4026 : 0x6a4a2c, 1);
    g.fillRoundedRect(0, y, w, h / logs + 1, h / (logs * 2));
    g.fillStyle(0x8a6a44, 0.7);
    g.fillRect(4, y + 1.5, w - 8, 1.5);
  }
  g.fillStyle(0x6a9a22, 0.8);                                             // green stain at the waterline
  g.fillRect(0, h - 3, w, 3);
  g.lineStyle(2, 0x3a2a14, 1);                                            // rope lashings
  [10, w / 2, w - 10].forEach(x => g.lineBetween(x, 0, x + (rand() - 0.5) * 2, h));
  g.generateTexture(key, w, h);
  g.destroy();
}

// ─── Lost Sands ──────────────────────────────────────────────────────────────────────────────

// Ancient ruin pieces, drawn standing on baseY: a column (whole or broken), an arch, an obelisk,
// a temple front with steps, or a half-buried statue head
function ruinPiece(g, kind, x, baseY, s, light, dark, rand) {
  g.fillStyle(light, 1);
  if (kind === "column" || kind === "broken") {
    const h = kind === "column" ? 120 * s : (50 + rand() * 50) * s, w = 16 * s;
    g.fillRect(x - w / 2, baseY - h, w, h);
    g.fillStyle(dark, 1);
    g.fillRect(x + w / 6, baseY - h, w / 3, h);                          // shaded side
    for (let f = -w / 3; f < w / 2; f += w / 3) g.fillRect(x + f, baseY - h, 1, h);   // fluting
    g.fillStyle(light, 1);
    g.fillRect(x - w * 0.8, baseY - 8 * s, w * 1.6, 8 * s);              // base
    if (kind === "column") g.fillRect(x - w * 0.8, baseY - h - 7 * s, w * 1.6, 7 * s);   // capital
    else g.fillTriangle(x - w / 2, baseY - h, x + w / 2, baseY - h, x + w / 4, baseY - h - 9 * s);   // broken top
  } else if (kind === "arch") {
    const w = 80 * s, h = 110 * s, t = 16 * s;
    g.fillRect(x - w / 2, baseY - h, t, h);
    g.fillRect(x + w / 2 - t, baseY - h, t, h);
    g.fillRect(x - w / 2 - 4 * s, baseY - h - 14 * s, w + 8 * s, 16 * s);
    g.fillStyle(dark, 1);
    g.fillRect(x + w / 2 - t * 0.4, baseY - h, t * 0.4, h);
    g.fillRect(x - w / 2 - 4 * s, baseY - h + 1, w + 8 * s, 3 * s);
  } else if (kind === "obelisk") {
    const w = 18 * s, h = 140 * s;
    g.fillPoints([{ x: x - w / 2, y: baseY }, { x: x - w / 3, y: baseY - h }, { x: x + w / 3, y: baseY - h }, { x: x + w / 2, y: baseY }], true);
    g.fillTriangle(x - w / 3, baseY - h, x + w / 3, baseY - h, x, baseY - h - 14 * s);
    g.fillStyle(dark, 1);
    g.fillPoints([{ x, y: baseY }, { x, y: baseY - h - 14 * s }, { x: x + w / 3, y: baseY - h }, { x: x + w / 2, y: baseY }], true);
    g.fillStyle(0x7a4a26, 1);
    for (let k = 0; k < 4; k++) g.fillRect(x - 3 * s, baseY - h * (0.3 + k * 0.15), 5 * s, 3 * s);   // glyphs
  } else if (kind === "temple") {
    const w = 150 * s, h = 80 * s;
    for (let st = 0; st < 3; st++) g.fillRect(x - w / 2 - (3 - st) * 8 * s, baseY - (st + 1) * 6 * s, w + (3 - st) * 16 * s, 6 * s);   // steps
    const colTop = baseY - 18 * s - h;
    for (let c = 0; c < 5; c++) { g.fillStyle(light, 1); g.fillRect(x - w / 2 + 8 * s + c * (w - 26 * s) / 4, colTop, 10 * s, h); g.fillStyle(dark, 1); g.fillRect(x - w / 2 + 14 * s + c * (w - 26 * s) / 4, colTop, 4 * s, h); }
    g.fillStyle(light, 1);
    g.fillRect(x - w / 2 - 6 * s, colTop - 12 * s, w + 12 * s, 12 * s);
    g.fillTriangle(x - w / 2 - 6 * s, colTop - 12 * s, x + w / 2 + 6 * s, colTop - 12 * s, x, colTop - 40 * s);
    g.fillStyle(dark, 1);
    g.fillTriangle(x - w / 3, colTop - 14 * s, x + w / 3, colTop - 14 * s, x, colTop - 32 * s);
  } else {                                                                 // half-buried statue head
    const r = 30 * s;
    g.fillCircle(x, baseY - r * 0.4, r);
    g.fillRect(x - r * 1.15, baseY - r * 1.2, r * 2.3, r * 0.5);           // headdress band
    g.fillTriangle(x - r * 1.15, baseY - r * 0.7, x - r * 1.5, baseY + 4, x - r * 0.7, baseY);
    g.fillTriangle(x + r * 1.15, baseY - r * 0.7, x + r * 1.5, baseY + 4, x + r * 0.7, baseY);
    g.fillStyle(dark, 1);
    g.fillRect(x - r * 0.45, baseY - r * 0.55, r * 0.3, r * 0.12);         // closed eyes
    g.fillRect(x + r * 0.15, baseY - r * 0.55, r * 0.3, r * 0.12);
    g.fillRect(x - r * 0.08, baseY - r * 0.5, r * 0.16, r * 0.4);          // nose
    g.fillStyle(light, 1);
  }
}

// 🏜️ Lost Sands backdrop: a burning orange-to-gold sky with a blazing sun, pyramids on the horizon,
// rolling dunes, ancient ruins (temples, arches, columns, obelisks, statue heads) half buried in sand,
// vultures circling, and sand blowing on the wind. Built like the other backdrops: baked once.
export function drawDesertBackdrop(scene, { colors, worldWidth, worldHeight }) {
  const camW = scene.cameras.main.width;
  const camH = scene.cameras.main.height;
  const maxScrollX = Math.max(0, worldWidth - camW);
  const maxScrollY = Math.max(0, worldHeight - camH);
  const random = makeRandom(20261111);
  const widthFor = (sx) => camW + 300 + sx * maxScrollX;
  const bottomBase = (sy) => camH + sy * maxScrollY + 24;

  // 1) Sky, fixed to the screen: burnt orange -> amber -> gold -> pale gold at the horizon
  const sky = scene.add.graphics().setScrollFactor(0);
  [[colors[0], colors[1], 0, 0.4], [colors[1], colors[2], 0.4, 0.75], [colors[2], colors[3], 0.75, 1.05]].forEach(([a, b, from, to]) => {
    sky.fillGradientStyle(a, a, b, b, 1);
    sky.fillRect(-20, camH * from - (from === 0 ? 20 : 0), camW + 40, camH * (to - from) + (from === 0 ? 20 : 1));
  });

  // 2) A blazing sun with a wide heat glow
  addGlow(scene, "desert_heat", camW * 0.7, camH * 0.2, camW, camH * 0.8, 0xfff0b0, 0.4);
  addGlow(scene, "desert_sun", camW * 0.7, camH * 0.2, 200, 200, 0xffffff, 0.6);
  const sun = scene.add.graphics().setScrollFactor(0);
  sun.fillStyle(0xfffbe8, 1);
  sun.fillCircle(camW * 0.7, camH * 0.2, 34);

  // 3) Far dunes with pyramids standing on them
  const sx1 = 0.06, sy1 = 0.04, w1 = widthFor(sx1), h1 = 220;
  const pyramids = [];
  for (let gx = 150 + random() * 300; gx < w1; gx += 500 + random() * 600) pyramids.push({ gx, size: 70 + random() * 70 });
  const duneH = (gx, base, amp, seed) => base + Math.sin(gx / 260 + seed) * amp + Math.sin(gx / 97 + seed * 2) * amp * 0.35;
  bakeChunks(scene, "desert_far", {
    width: w1, h: h1, imageY: bottomBase(sy1) - h1, alpha: 1, scrollX: sx1, scrollY: sy1,
    draw: (g, left, chunkW) => {
      pyramids.forEach(p => {
        const x = p.gx - left;
        if (x + p.size < -10 || x - p.size > chunkW + 10) return;
        const base = h1 - duneH(p.gx, 60, 14, 0.7) + 10;
        g.fillStyle(0xd08a48, 1);
        g.fillTriangle(x - p.size, base, x + p.size, base, x, base - p.size * 0.9);
        g.fillStyle(0xb06e36, 1);                                           // shaded face
        g.fillTriangle(x, base - p.size * 0.9, x + p.size, base, x + p.size * 0.15, base);
        g.lineStyle(1, 0xb87a40, 0.6);                                      // stone courses
        for (let k = 1; k < 6; k++) { const yy = base - p.size * 0.9 * k / 6; const half = p.size * (1 - k / 6); g.lineBetween(x - half, yy, x, yy); }
      });
      g.fillStyle(0xe2a85c, 1);
      const pts = [{ x: -4, y: h1 }];
      for (let lx = -4; lx <= chunkW + 4; lx += 8) pts.push({ x: lx, y: h1 - duneH(left + lx, 60, 14, 0.7) });
      pts.push({ x: chunkW + 4, y: h1 });
      g.fillPoints(pts, true);
    }
  });

  // 4) Blowing haze of sand in the distance
  ensureSoftTexture(scene, "sand_haze", 0xffe0a0);
  for (let i = 0; i < 6; i++) {
    const haze = scene.add.image((i + 0.5) * camW / 5, camH * (0.55 + random() * 0.1), "sand_haze")
      .setDisplaySize(340 + random() * 200, 60 + random() * 30).setAlpha(0.18 + random() * 0.1).setScrollFactor(0);
    scene.tweens.add({ targets: haze, x: haze.x + 90 + random() * 60, duration: 8000 + random() * 5000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  }

  // 5) Ruins half buried in a middle row of dunes
  {
    const sx = 0.22, sy = 0.12, width = widthFor(sx), h = 260;
    const kinds = ["temple", "column", "broken", "arch", "obelisk", "head", "broken", "column"];
    const ruins = [];
    for (let gx = 120 + random() * 200; gx < width; gx += 170 + random() * 220) {
      ruins.push({ gx, kind: kinds[Math.floor(random() * kinds.length)], s: 0.7 + random() * 0.4, seed: random() });
    }
    bakeChunks(scene, "desert_ruins", {
      width, h, imageY: bottomBase(sy) - h, alpha: 1, scrollX: sx, scrollY: sy,
      draw: (g, left, chunkW) => {
        ruins.forEach(r => {
          const x = r.gx - left;
          if (x < -140 || x > chunkW + 140) return;
          ruinPiece(g, r.kind, x, h - duneH(r.gx, 46, 12, 2.2) + 14, r.s, 0xb87a40, 0x95602e, makeRandom(Math.floor(r.seed * 1e6)));
        });
        g.fillStyle(0xd69a52, 1);                                           // sand drifted over their feet
        const pts = [{ x: -4, y: h }];
        for (let lx = -4; lx <= chunkW + 4; lx += 8) pts.push({ x: lx, y: h - duneH(left + lx, 46, 12, 2.2) });
        pts.push({ x: chunkW + 4, y: h });
        g.fillPoints(pts, true);
      }
    });
  }

  // 6) Near dunes, rich gold with wind ripples
  {
    const sx = 0.4, sy = 0.24, width = widthFor(sx), h = 110;
    bakeChunks(scene, "desert_near_dunes", {
      width, h, imageY: bottomBase(sy) - h, alpha: 1, scrollX: sx, scrollY: sy,
      draw: (g, left, chunkW) => {
        g.fillStyle(0xc8843e, 1);
        const pts = [{ x: -4, y: h }];
        for (let lx = -4; lx <= chunkW + 4; lx += 8) pts.push({ x: lx, y: h - duneH(left + lx, 40, 16, 4.4) });
        pts.push({ x: chunkW + 4, y: h });
        g.fillPoints(pts, true);
        g.lineStyle(1.2, 0xa86a30, 0.6);                                    // ripples
        for (let lx = 0; lx < chunkW; lx += 26) {
          const top = h - duneH(left + lx, 40, 16, 4.4);
          for (let k = 1; k < 4; k++) g.lineBetween(lx, top + k * 9, lx + 16, top + k * 9 + 2);
        }
      }
    });
  }

  // 7) Vultures circling high up
  for (let i = 0; i < 2; i++) {
    const v = scene.add.graphics().setScrollFactor(0.05, 0);
    v.lineStyle(2.4, 0x3a2414, 0.85);
    v.beginPath(); v.moveTo(-11, -1); v.lineTo(-4, -4); v.lineTo(0, 1); v.lineTo(4, -4); v.lineTo(11, -1); v.strokePath();
    const cx = camW * (0.3 + i * 0.35), cy = 80 + i * 30, r = 40 + i * 15;
    const state = { a: random() * Math.PI * 2 };
    scene.tweens.add({
      targets: state, a: state.a + Math.PI * 2, duration: 9000 + i * 2500, repeat: -1,
      onUpdate: () => v.setPosition(cx + Math.cos(state.a) * r, cy + Math.sin(state.a) * r * 0.35)
    });
  }

  // 8) Sand blowing past on the wind
  if (!scene.textures.exists("sand_grain")) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xfff0c0, 0.9); g.fillEllipse(3, 1.5, 6, 2);
    g.generateTexture("sand_grain", 6, 3);
    g.destroy();
  }
  scene.add.particles(0, 0, "sand_grain", {
    x: -10, y: { min: camH * 0.35, max: camH },
    lifespan: 4000, speedX: { min: 160, max: 280 }, speedY: { min: -12, max: 12 },
    scale: { min: 0.6, max: 1.4 }, alpha: { start: 0.7, end: 0 },
    frequency: 70, advance: 3000
  }).setScrollFactor(0);
}

// 🟨 Solid desert ground: golden sand with wind ripples on top, layered sandstone below.
// Returns how far the sand sticks up above the platform's top.
export function bakeDesertGround(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(3300 + seed * 67);
  const over = 4;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const top = over;
  [[0xc8873e, 0], [0xae7034, h / 3], [0x8e5a2a, (h * 2) / 3]].forEach(([c, y]) => { g.fillStyle(c, 1); g.fillRect(0, top + y, w, h / 3 + 1); });
  g.lineStyle(1, 0x7a4a22, 0.6);                                          // sandstone blocks
  for (let row = 0; row < 2; row++) {
    const y = top + 10 + row * 9;
    g.lineBetween(0, y, w, y);
    for (let x = (row ? 14 : 0) + rand() * 10; x < w; x += 28 + rand() * 10) g.lineBetween(x, y, x, y + 9);
  }
  g.fillStyle(0xf0c06a, 1);                                               // sand on top
  g.fillRect(0, top, w, 6);
  for (let x = 0; x <= w; x += 10) g.fillEllipse(x + rand() * 4, top + 6, 14, 4 + rand() * 2);
  g.fillStyle(0xffe2a0, 1);
  g.fillRect(0, top, w, 1.5);
  for (let x = 4; x < w; x += 7 + rand() * 6) {                          // little mounds and ripples
    g.fillStyle(0xf6cc7a, 1);
    g.fillEllipse(x, top - 0.5, 6 + rand() * 6, 2.5);
  }
  for (let i = 0; i < w / 25; i++) {                                      // pebbles
    g.fillStyle(rand() < 0.5 ? 0x9a6a3a : 0xd8a868, 1);
    g.fillCircle(4 + rand() * (w - 8), top + 2 + rand() * 3, 0.8 + rand());
  }
  g.generateTexture(key, w, over + h);
  g.destroy();
  return over;
}

// 🧱 A sandstone ruin block with carved symbols and chipped corners (Lost Sands floating platforms)
export function bakeRuinBlock(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(3500 + seed * 29);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x9a6232, 1);
  g.fillRect(0, 2, w, h);
  g.fillStyle(0xd9a35a, 1);
  g.fillRect(0, 0, w, h - 2);
  g.fillStyle(0xf0c47a, 1);
  g.fillRect(0, 0, w, 3);
  g.lineStyle(1, 0xa86e36, 1);                                            // block joints
  for (let x = 24 + rand() * 8; x < w - 8; x += 26 + rand() * 8) g.lineBetween(x, 3, x, h - 2);
  g.fillStyle(0x8a5428, 1);                                               // carved symbols
  for (let x = 8; x < w - 8; x += 13 + rand() * 6) {
    const k = Math.floor(rand() * 4);
    if (k === 0) { g.fillRect(x, 7, 2, 7); g.fillRect(x - 2, 9, 6, 2); }
    else if (k === 1) { g.fillCircle(x + 1, 10, 2.6); g.fillStyle(0xd9a35a, 1); g.fillCircle(x + 1, 10, 1.2); g.fillStyle(0x8a5428, 1); }
    else if (k === 2) { g.fillTriangle(x - 2, 14, x + 4, 14, x + 1, 7); }
    else { g.fillRect(x - 2, 8, 6, 1.6); g.fillRect(x - 2, 12, 6, 1.6); }
  }
  g.fillStyle(0x9a6232, 1);
  g.fillTriangle(w, 0, w - 6, 0, w, 6);
  g.fillTriangle(0, h, 0, h - 5, 5, h);
  g.generateTexture(key, w, h + 2);
  g.destroy();
}

// ⚠️ A cracked sandstone block (Lost Sands collapsing platforms): paler, split, with sand trickling out
export function bakeCrackedSandstone(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const rand = makeRandom(3700 + seed * 23);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xe8c08a, 1);
  g.fillRect(0, 0, w, h - 2);
  g.fillStyle(0xfadaa6, 1);
  g.fillRect(0, 0, w, 3);
  g.lineStyle(1.5, 0x8a5a2e, 1);                                          // fractures
  for (let x = 14 + rand() * 10; x < w - 8; x += 22 + rand() * 10) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (rand() - 0.5) * 8, h / 2); g.lineTo(x + (rand() - 0.5) * 8, h - 2); g.strokePath();
  }
  g.fillStyle(0xb8844a, 1);                                               // crumbling underside
  for (let x = 3; x < w - 3; x += 9 + rand() * 6) g.fillTriangle(x, h - 2, x + 7, h - 2, x + 3, h + 3);
  g.fillStyle(0xf0c06a, 1);                                               // sand trickling out
  g.fillRect(w * 0.3, h - 1, 1.5, 4);
  g.fillRect(w * 0.7, h - 1, 1.5, 3);
  g.generateTexture(key, w, h + 4);
  g.destroy();
}

// 🧞 A flying carpet (Lost Sands moving platforms): deep red with a gold border, a diamond pattern
// and tassels at each end
export function bakeCarpetPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const pad = 6;                                                           // room for the tassels
  const ch = h * 0.55;                                                     // the carpet is thin
  g.fillStyle(0x7a1a14, 1);
  g.fillRoundedRect(pad, 2, w - pad * 2, ch, 3);
  g.fillStyle(0xa8261a, 1);
  g.fillRect(pad + 3, 4, w - pad * 2 - 6, ch - 4);
  g.lineStyle(1.5, 0xf0b840, 1);                                          // gold border
  g.strokeRect(pad + 3, 4, w - pad * 2 - 6, ch - 4);
  g.fillStyle(0xf0b840, 1);                                               // diamond pattern
  for (let x = pad + 14; x < w - pad - 10; x += 14) g.fillPoints([{ x, y: 2 + ch / 2 - 3 }, { x: x + 3, y: 2 + ch / 2 }, { x, y: 2 + ch / 2 + 3 }, { x: x - 3, y: 2 + ch / 2 }], true);
  g.lineStyle(1.2, 0xf0b840, 1);                                          // tassels
  for (let k = 0; k < 3; k++) {
    const y = 4 + k * (ch - 6) / 2;
    g.lineBetween(pad, y, 1, y + 1);
    g.lineBetween(w - pad, y, w - 1, y + 1);
  }
  g.generateTexture(key, w, h);
  g.destroy();
}
