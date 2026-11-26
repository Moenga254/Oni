import {
  bakeCrumblePlatform,
  bakeRottenPlankPlatform,
  bakeRaftPlatform,
  bakeCrackedSandstone,
  bakeCrackedTempleSlab,
  bakeTombSlab,
  bakeCursedSlab,
} from "./Backdrops.js";

// 🌋☣️🏜️⚡🏛️🪦 Hazards for Magma Falls, Toxic Swamp, Lost Sands, Urban Nightmare, Lost Civilization and The Haunted Grounds: pools you must not touch,
// falling rocks, collapsing platforms, electrical traps, exposed cables and quicksand. Everything runs on the scene's own clock
// (scene.time / tweens / the scene's update), so it all stops while the game is paused.

// How long things take on each difficulty (milliseconds), per level
const TIMING = {
  //                     collapse after standing on it   rock warning   wait before the same spot drops again
  volcano: {
    easy: { crumble: 3000, rockWarn: 1300, rockCooldown: 5000 },
    normal: { crumble: 2500, rockWarn: 1000, rockCooldown: 4000 },
    hard: { crumble: 2000, rockWarn: 750, rockCooldown: 3200 },
  },
  //                     plank breaks after             raft sinks this fast (px/s)
  swamp: {
    easy: { crumble: 3000, sinkSpeed: 26 },
    normal: { crumble: 3000, sinkSpeed: 32 },
    hard: { crumble: 2000, sinkSpeed: 40 },
  },
  //                     block falls after              quicksand pulls you down this fast (px/s)
  desert: {
    easy: { crumble: 2000, quicksandSpeed: 16 },
    normal: { crumble: 2000, quicksandSpeed: 22 },
    hard: { crumble: 1000, quicksandSpeed: 28 },
  },
  city: {
    easy: {
      crumble: 3600,
      electricWarn: 1800,
      electricActive: 1100,
      electricOff: 2100,
    },
    normal: {
      crumble: 3000,
      electricWarn: 1400,
      electricActive: 1400,
      electricOff: 1600,
    },
    hard: {
      crumble: 2500,
      electricWarn: 1100,
      electricActive: 1700,
      electricOff: 1000,
    },
  },
  //                     slab falls after   stone warning / wait      spike trap: warning, out, hidden       poison plant: warning, cloud, resting
  temple: {
    easy: {
      crumble: 3000,
      rockWarn: 1300,
      rockCooldown: 5200,
      spikeWarn: 1500,
      spikeOut: 1000,
      spikeOff: 2200,
      plantWarn: 1200,
      plantCloud: 1100,
      plantRest: 2600,
    },
    normal: {
      crumble: 2500,
      rockWarn: 1000,
      rockCooldown: 4200,
      spikeWarn: 1200,
      spikeOut: 1200,
      spikeOff: 1700,
      plantWarn: 1000,
      plantCloud: 1400,
      plantRest: 2100,
    },
    hard: {
      crumble: 2000,
      rockWarn: 750,
      rockCooldown: 3400,
      spikeWarn: 950,
      spikeOut: 1400,
      spikeOff: 1200,
      plantWarn: 800,
      plantCloud: 1700,
      plantRest: 1600,
    },
  },
  //                     illusion re-forms after   vanishing: solid, warning, gone          ghost platform: fades when you are this close, returns when this far
  graveyard: {
    easy: {
      reform: 3000,
      vanishSolid: 3200,
      vanishWarn: 1200,
      vanishGone: 1500,
      ghostNear: 110,
      ghostFar: 200,
    },
    normal: {
      reform: 2500,
      vanishSolid: 2600,
      vanishWarn: 1000,
      vanishGone: 1800,
      ghostNear: 130,
      ghostFar: 220,
    },
    hard: {
      reform: 2000,
      vanishSolid: 2000,
      vanishWarn: 800,
      vanishGone: 2000,
      ghostNear: 150,
      ghostFar: 240,
    },
  },
};
const PLATFORM_RETURN_MS = 3000; // a collapsed platform comes back after this long
const ROCK_TRIGGER_DISTANCE = 280; // a rock spot only drops while you are this close to it
const POOL_SURFACE_Y = 576; // the top of every lava / toxic pool

// What each kind of pool looks like, and what the game over screen says
const POOLS = {
  lava: {
    cause: "lava",
    bubble: "lava_bubble",
    glow: "hazard_glow",
    bands: [0xc0280a, 0xff4a0a, 0xff7a1a, 0xffc23a],
    crust: 0x3a0e06,
    shine: 0xfff0a0,
    glowAlpha: [0.45, 0.7],
  },
  toxic: {
    cause: "toxic",
    bubble: "toxic_bubble",
    glow: "toxic_glow",
    bands: [0x2f5a0c, 0x5a9a14, 0x8fd61e, 0xd8ff4a],
    crust: 0x3a2a12,
    shine: 0xf2ffb0,
    glowAlpha: [0.3, 0.5],
  },
};

// What each kind of collapsing platform looks like
const CRUMBLE_LOOKS = {
  volcano: {
    name: "volcano",
    bake: bakeCrumblePlatform,
    crackGlow: 0xff6a1a,
    crack: 0x140805,
    bits: [0x6a4632, 0x5a3a2a],
  },
  swamp: {
    name: "swamp",
    bake: bakeRottenPlankPlatform,
    crackGlow: 0xa6e22e,
    crack: 0x2a1a0c,
    bits: [0x7a5a38, 0x5a4026],
  },
  desert: {
    name: "desert",
    bake: bakeCrackedSandstone,
    crackGlow: 0xf0c06a,
    crack: 0x6a3e1c,
    bits: [0xe8c08a, 0xc8944e],
  },
  city: {
    name: "city",
    bake: bakeCityMovingPlatform,
    crackGlow: 0x3de0ff,
    crack: 0x161b24,
    bits: [0x737989, 0x424754],
  },
  temple: {
    name: "temple",
    bake: bakeCrackedTempleSlab,
    crackGlow: 0xe2b84a,
    crack: 0x3a2814,
    bits: [0xa58a60, 0x7a6040],
  },
};

// What a falling rock looks like, and what the game over screen says
const ROCK_LOOKS = {
  volcano: {
    texture: "falling_rock",
    trail: "lava_bubble",
    cause: "rock",
    mark: 0xff3b1a,
    bang: "#ffd060",
    bangStroke: "#3a0a06",
    bits: [0x2a1a14, 0xff6a1a],
  },
  temple: {
    texture: "falling_stone",
    trail: "stone_dust",
    cause: "stone",
    mark: 0xe2b84a,
    bang: "#ffe08a",
    bangStroke: "#2a1c0a",
    bits: [0x6e5a3e, 0xd9ac3c],
  },
};

export function setupVolcanoHazards(scene, levelData, difficultyKey) {
  const timing = TIMING.volcano[difficultyKey] || TIMING.volcano.normal;
  makeTextures(scene);
  addPools(scene, levelData.lavaPools || [], POOLS.lava);
  addCrumblingPlatforms(
    scene,
    levelData.crumblingPlatforms || [],
    timing,
    CRUMBLE_LOOKS.volcano,
  );
  addFallingRocks(scene, levelData.fallingRocks || [], timing);
}

export function setupSwampHazards(scene, levelData, difficultyKey) {
  const timing = TIMING.swamp[difficultyKey] || TIMING.swamp.normal;
  makeTextures(scene);
  addPools(scene, levelData.toxicPools || [], POOLS.toxic);
  addCrumblingPlatforms(
    scene,
    levelData.breakingPlatforms || [],
    timing,
    CRUMBLE_LOOKS.swamp,
  );
  addSinkingPlatforms(scene, levelData.sinkingPlatforms || [], timing);
}

export function setupDesertHazards(scene, levelData, difficultyKey) {
  const timing = TIMING.desert[difficultyKey] || TIMING.desert.normal;
  makeTextures(scene);
  addQuicksand(scene, levelData.quicksand || [], timing);
  addCrumblingPlatforms(
    scene,
    levelData.collapsingBlocks || [],
    timing,
    CRUMBLE_LOOKS.desert,
  );
}

export function setupCityHazards(
  scene,
  levelData,
  difficultyKey,
  movingPlatforms = [],
) {
  const timing = TIMING.city[difficultyKey] || TIMING.city.normal;
  addElectricalTraps(scene, levelData.electricalTraps || [], timing);
  addExposedCables(scene, levelData.exposedCables || []);
  addMovingPlatformTraps(
    scene,
    movingPlatforms,
    levelData.movingPlatformTraps || [],
    timing,
  );
  addCrumblingPlatforms(
    scene,
    levelData.collapsingPlatforms || [],
    timing,
    CRUMBLE_LOOKS.city,
  );
}

// 🏛️ Lost Civilization: spike pits, spikes on the floor, spike traps that shoot up, poisonous plants,
// falling stones and cracked slabs over the wide pits
export function setupTempleHazards(scene, levelData, difficultyKey) {
  const timing = TIMING.temple[difficultyKey] || TIMING.temple.normal;
  makeTempleTextures(scene);
  addSpikePits(scene, levelData.spikePits || []);
  addFloorSpikes(scene, levelData.floorSpikes || []);
  addSpikeTraps(scene, levelData.spikeTraps || [], timing);
  addPoisonPlants(scene, levelData.poisonPlants || [], timing);
  addCrumblingPlatforms(
    scene,
    levelData.crumblingPlatforms || [],
    timing,
    CRUMBLE_LOOKS.temple,
  );
  addFallingRocks(
    scene,
    levelData.fallingRocks || [],
    timing,
    ROCK_LOOKS.temple,
  );
}

// 🪦 The Haunted Grounds: illusion platforms, vanishing platforms and ghost platforms
export function setupGraveyardHazards(scene, levelData, difficultyKey) {
  const timing = TIMING.graveyard[difficultyKey] || TIMING.graveyard.normal;
  makeGraveTextures(scene);
  addIllusionPlatforms(scene, levelData.illusionPlatforms || [], timing);
  addVanishingPlatforms(scene, levelData.vanishingPlatforms || [], timing);
  addGhostPlatforms(scene, levelData.ghostPlatforms || [], timing);
}

function bakeCityMovingPlatform(scene, key, w, h, seed) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x424754, 1);
  g.fillRoundedRect(0, 0, w, h, 2);
  g.fillStyle(0x737989, 1);
  g.fillRect(1, 1, w - 2, 4);
  g.fillStyle(0x292e38, 1);
  g.fillRect(1, h - 4, w - 2, 3);
  const crackX = 12 + ((seed * 17) % Math.max(12, w - 24));
  g.lineStyle(1.5, 0x202530, 1);
  g.lineBetween(crackX, 5, crackX - 4, 10);
  g.lineBetween(crackX - 4, 10, crackX + 2, h - 3);
  g.lineBetween(crackX + 2, h - 3, crackX + 9, h - 6);
  g.generateTexture(key, w, h);
  g.destroy();
}

function addElectricalTraps(scene, traps, timing) {
  const states = traps.map(([x, y, w], i) => {
    const plate = scene.add
      .rectangle(x + w / 2, y - 4, w, 8, 0x202a36)
      .setStrokeStyle(2, 0x586579);
    const indicator = scene.add.rectangle(
      x + w / 2,
      y - 5,
      w - 12,
      2,
      0xffb347,
    );
    const arc = scene.add.graphics().setVisible(false);
    arc.lineStyle(2.5, 0x83efff, 0.95);
    for (let ax = x + 8; ax < x + w - 8; ax += 18) {
      arc.beginPath();
      arc.moveTo(ax, y - 8);
      arc.lineTo(ax + 5, y - 16);
      arc.lineTo(ax + 10, y - 7);
      arc.lineTo(ax + 14, y - 17);
      arc.strokePath();
    }

    const zone = scene.physics.add
      .staticImage(x + w / 2, y - 8, null)
      .setDisplaySize(w - 6, 16)
      .setVisible(false);
    zone.refreshBody();
    zone.body.enable = false;
    scene.physics.add.overlap(scene.player, zone, () => {
      if (!scene.gameOver && !scene.gameWon) scene.loseLife("electricity");
    });

    return { x, y, w, plate, indicator, arc, zone, index: i, state: null };
  });
  const cycle =
    timing.electricWarn + timing.electricActive + timing.electricOff;
  const update = (time) => {
    states.forEach((trap) => {
      const phase = (time + trap.index * 670) % cycle;
      const state =
        phase < timing.electricWarn
          ? "warning"
          : phase < timing.electricWarn + timing.electricActive
            ? "active"
            : "off";
      if (state !== trap.state) {
        trap.state = state;
        trap.zone.body.enable = state === "active";
        trap.arc.setVisible(state === "active");
        trap.indicator.setFillStyle(
          state === "active"
            ? 0x83efff
            : state === "warning"
              ? 0xffb347
              : 0x425064,
        );
      }
      trap.indicator.setAlpha(
        state === "warning"
          ? 0.45 + Math.sin(time / 110 + trap.index) * 0.45
          : 1,
      );
    });
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
}

function addMovingPlatformTraps(scene, platforms, platformIndices, timing) {
  const traps = platformIndices.flatMap((platformIndex, index) => {
    const platform = platforms[platformIndex];
    if (!platform) return [];
    const top = platform.body.y - platform.h / 2;
    const plate = scene.add
      .rectangle(platform.body.x, top - 3, platform.w - 12, 7, 0x151f2d)
      .setStrokeStyle(1.5, 0x586579);
    const indicator = scene.add.rectangle(
      platform.body.x,
      top - 4,
      platform.w - 22,
      2,
      0xffb347,
    );
    const arc = scene.add.graphics().setVisible(false);
    arc.lineStyle(2.5, 0x83efff, 0.95);
    for (let ax = -platform.w / 2 + 12; ax < platform.w / 2 - 12; ax += 18) {
      arc.beginPath();
      arc.moveTo(ax, -4);
      arc.lineTo(ax + 5, -12);
      arc.lineTo(ax + 10, -3);
      arc.lineTo(ax + 14, -13);
      arc.strokePath();
    }

    const zone = scene.physics.add
      .image(platform.body.x, top - 5, null)
      .setDisplaySize(platform.w - 8, 16)
      .setVisible(false);
    zone.setImmovable(true);
    zone.body.setAllowGravity(false);
    zone.body.enable = false;
    scene.physics.add.overlap(scene.player, zone, () => {
      if (!scene.gameOver && !scene.gameWon) scene.loseLife("electricity");
    });

    return [{ platform, plate, indicator, arc, zone, index, state: null }];
  });
  const cycle =
    timing.electricWarn + timing.electricActive + timing.electricOff;
  const update = (time) => {
    traps.forEach((trap) => {
      const top = trap.platform.body.y - trap.platform.h / 2;
      const x = trap.platform.body.x;
      trap.plate.setPosition(x, top - 3);
      trap.indicator.setPosition(x, top - 4);
      trap.arc.setPosition(x, top - 2);
      trap.zone.setPosition(x, top - 5);

      const phase = (time + (trap.index + 1) * 930) % cycle;
      const state =
        phase < timing.electricWarn
          ? "warning"
          : phase < timing.electricWarn + timing.electricActive
            ? "active"
            : "off";
      if (state !== trap.state) {
        trap.state = state;
        trap.zone.body.enable = state === "active";
        trap.arc.setVisible(state === "active");
        trap.indicator.setFillStyle(
          state === "active"
            ? 0x83efff
            : state === "warning"
              ? 0xffb347
              : 0x425064,
        );
      }
      trap.indicator.setAlpha(
        state === "warning"
          ? 0.45 + Math.sin(time / 110 + trap.index) * 0.45
          : 1,
      );
    });
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
}

function addExposedCables(scene, cables) {
  cables.forEach(([x, y, w]) => {
    const cable = scene.add.graphics();
    const points = [];
    for (let i = 0; i <= 6; i++)
      points.push({ x: x + (i * w) / 6, y: y + (i % 2 ? -3 : 2) });
    cable.lineStyle(6, 0x11151d, 1);
    cable.strokePoints(points, false);
    cable.lineStyle(2, 0x48dff5, 0.95);
    cable.strokePoints(points, false);
    cable.fillStyle(0xffcf59, 1);
    cable.fillCircle(x + w * 0.3, y - 1, 2);
    cable.fillCircle(x + w * 0.78, y, 2);

    const zone = scene.physics.add
      .staticImage(x + w / 2, y, null)
      .setDisplaySize(w, 12)
      .setVisible(false);
    zone.refreshBody();
    scene.physics.add.overlap(scene.player, zone, () => {
      if (!scene.gameOver && !scene.gameWon) scene.loseLife("cable");
    });
  });
}

function makeGlowTexture(scene, key, rgb) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, 128, 128);
  const ctx = tex.getContext();
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  tex.refresh();
}

function makeBubbleTexture(scene, key, outer, inner) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(outer, 1);
  g.fillCircle(4, 4, 4);
  g.fillStyle(inner, 1);
  g.fillCircle(3, 3, 1.6);
  g.generateTexture(key, 8, 8);
  g.destroy();
}

function makeTextures(scene) {
  makeBubbleTexture(scene, "lava_bubble", 0xff8a1a, 0xffd060);
  makeBubbleTexture(scene, "toxic_bubble", 0x9ae62a, 0xeaffa0);
  makeGlowTexture(scene, "hazard_glow", "255,120,30");
  makeGlowTexture(scene, "toxic_glow", "170,240,40");
  if (!scene.textures.exists("falling_rock")) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x2a1a14, 1);
    g.fillPoints(
      [
        { x: 4, y: 8 },
        { x: 10, y: 2 },
        { x: 19, y: 4 },
        { x: 23, y: 12 },
        { x: 19, y: 21 },
        { x: 9, y: 23 },
        { x: 2, y: 16 },
      ],
      true,
    );
    g.fillStyle(0x4a3226, 1);
    g.fillPoints(
      [
        { x: 10, y: 2 },
        { x: 19, y: 4 },
        { x: 14, y: 10 },
        { x: 6, y: 8 },
      ],
      true,
    );
    g.lineStyle(1.6, 0xff6a1a, 1);
    g.beginPath();
    g.moveTo(7, 12);
    g.lineTo(12, 14);
    g.lineTo(17, 11);
    g.strokePath();
    g.beginPath();
    g.moveTo(12, 14);
    g.lineTo(13, 20);
    g.strokePath();
    g.generateTexture("falling_rock", 25, 25);
    g.destroy();
  }
}

// ─── Pools (lava / toxic water) ──────────────────────────────────────────────────────────────
// Each pool fills a gap in the floor. Touching it costs a life (even while blinking after a hit).
function addPools(scene, pools, look) {
  const surfaceY = POOL_SURFACE_Y;
  const effects = []; // each pool's glow, shimmer and bubbles, switched off while the pool is off screen
  pools.forEach(([x, w], i) => {
    const key = `${look.cause}_pool_${i}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const h = 600 - surfaceY + 4;
    const [deep, mid, upper, top] = look.bands;
    [
      [deep, h],
      [mid, h * 0.6],
      [upper, h * 0.3],
      [top, 3],
    ].forEach(([c, bh]) => {
      g.fillStyle(c, 1);
      g.fillRect(0, 0, w, bh);
    });
    const rand = Phaser.Math.RND;
    g.fillStyle(look.crust, 0.8); // floating crust / scum
    for (
      let cx = 10 + rand.between(0, 20);
      cx < w - 10;
      cx += rand.between(26, 44)
    )
      g.fillEllipse(cx, 9 + rand.between(0, 8), rand.between(10, 20), 4);
    g.generateTexture(key, w, h);
    g.destroy();

    // glow above the surface, gently pulsing
    const glow = scene.add
      .image(x + w / 2, surfaceY, look.glow)
      .setDisplaySize(w * 1.4, 90)
      .setAlpha(look.glowAlpha[0])
      .setBlendMode("ADD");
    scene.tweens.add({
      targets: glow,
      alpha: look.glowAlpha[1],
      duration: 900 + i * 70,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
    scene.add.image(x, surfaceY, key).setOrigin(0, 0);

    // the bright surface shimmers
    const shine = scene.add.rectangle(
      x + w / 2,
      surfaceY + 1.5,
      w,
      3,
      look.shine,
      0.9,
    );
    scene.tweens.add({
      targets: shine,
      alpha: 0.3,
      duration: 500 + i * 40,
      yoyo: true,
      repeat: -1,
    });

    // bubbles popping on the surface
    const bubbles = scene.add.particles(0, 0, look.bubble, {
      x: { min: x + 6, max: x + w - 6 },
      y: surfaceY + 4,
      lifespan: 600,
      speedY: { min: -40, max: -15 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.5, end: 1.2 },
      alpha: { start: 1, end: 0 },
      frequency: Math.max(120, 36000 / w),
    });

    effects.push({ x, w, glow, shine, bubbles, on: null });

    // the deadly part
    const zone = scene.physics.add
      .staticImage(x + w / 2, surfaceY + 14, null)
      .setDisplaySize(w, 24)
      .setVisible(false);
    zone.refreshBody();
    scene.physics.add.overlap(scene.player, zone, () => {
      if (scene.gameOver || scene.gameWon) return;
      splash(scene, scene.player.x, surfaceY, look.bubble);
      scene.loseLife(look.cause);
    });
  });

  // ⚡ A level has a dozen pools, each bubbling and glowing. Only the ones near the screen need to.
  const cull = () => {
    const cam = scene.cameras.main;
    const left = cam.scrollX - 120,
      right = cam.scrollX + cam.width + 120;
    effects.forEach((e) => {
      const on = e.x + e.w > left && e.x < right;
      if (on === e.on) return;
      e.on = on;
      e.glow.setVisible(on);
      e.shine.setVisible(on);
      e.bubbles.setVisible(on);
      e.bubbles.emitting = on;
    });
  };
  scene.events.on("update", cull);
  scene.events.once("shutdown", () => scene.events.off("update", cull));
}

function splash(scene, x, y, texture) {
  for (let i = 0; i < 12; i++) {
    const drop = scene.add.image(x, y, texture).setScale(0.8 + Math.random());
    scene.tweens.add({
      targets: drop,
      x: x + (Math.random() - 0.5) * 90,
      y: y - 30 - Math.random() * 50,
      alpha: 0,
      duration: 450 + Math.random() * 250,
      ease: "Quad.Out",
      onComplete: () => drop.destroy(),
    });
  }
}

// ─── Collapsing / breaking platforms ─────────────────────────────────────────────────────────
// Stand on one and it cracks (three stages, shaking harder each time), then breaks and falls.
// It comes back a few seconds later.
function addCrumblingPlatforms(scene, list, timing, look) {
  const h = 20;
  list.forEach(([x, y, w], i) => {
    const key = `crumble_platform_${look.name}_${i}`;
    look.bake(scene, key, w, h, i);
    const image = scene.add.image(x, y, key).setOrigin(0, 0);
    const cracks = scene.add.graphics({ x, y });

    const body = scene.physics.add
      .staticImage(x + w / 2, y + h / 2, null)
      .setDisplaySize(w, h)
      .setVisible(false);
    body.refreshBody();

    const p = { state: "solid", image, cracks, body, x, y, w, look };

    scene.physics.add.collider(scene.player, body, () => {
      const pb = scene.player.body;
      if (
        p.state === "solid" &&
        pb.touching.down &&
        pb.bottom <= body.body.top + 6
      )
        startCrumbling(scene, p, timing);
    });
    if (scene.coins) scene.physics.add.collider(scene.coins, body);
  });
}

function drawCracks(p, stage) {
  const rand = Phaser.Math.RND;
  for (let k = 0; k < 2 + stage; k++) {
    const pts = [{ x: rand.between(8, p.w - 8), y: 0 }];
    for (let s = 0; s < 3; s++) {
      const last = pts[pts.length - 1];
      pts.push({
        x: Phaser.Math.Clamp(last.x + rand.between(-9, 9), 2, p.w - 2),
        y: Math.min(19, last.y + rand.between(4, 8)),
      });
    }
    p.cracks.lineStyle(3, p.look.crackGlow, 0.6);
    p.cracks.strokePoints(pts, false);
    p.cracks.lineStyle(1.5, p.look.crack, 1);
    p.cracks.strokePoints(pts, false);
  }
}

function startCrumbling(scene, p, timing) {
  p.state = "cracking";
  const stageMs = timing.crumble / 3;

  for (let stage = 0; stage < 3; stage++) {
    scene.time.delayedCall(stage * stageMs, () => {
      if (p.state !== "cracking") return;
      drawCracks(p, stage);
      const amount = 1 + stage; // shakes harder each stage
      scene.tweens.add({
        targets: [p.image, p.cracks],
        x: `+=${amount}`,
        duration: 45,
        yoyo: true,
        repeat: Math.floor(stageMs / 90) - 1,
        onComplete: () => {
          p.image.x = p.x;
          p.cracks.x = p.x;
        },
      });
      for (let d = 0; d < 2 + stage * 2; d++) {
        // grit falling from underneath
        const bit = scene.add.rectangle(
          p.x + Math.random() * p.w,
          p.y + 20,
          3,
          3,
          p.look.bits[0],
        );
        scene.tweens.add({
          targets: bit,
          y: bit.y + 60,
          alpha: 0,
          duration: 600,
          onComplete: () => bit.destroy(),
        });
      }
    });
  }

  scene.time.delayedCall(timing.crumble, () => collapse(scene, p));
}

function collapse(scene, p) {
  p.state = "gone";
  p.body.body.enable = false;
  scene.tweens.killTweensOf([p.image, p.cracks]);
  p.image.x = p.x;
  p.cracks.x = p.x;

  // break into chunks that tumble down
  for (let c = 0; c < 5; c++) {
    const chunk = scene.add.rectangle(
      p.x + ((c + 0.5) * p.w) / 5,
      p.y + 10,
      p.w / 5 - 2,
      14,
      p.look.bits[c % 2],
    );
    scene.tweens.add({
      targets: chunk,
      y: chunk.y + 140 + Math.random() * 60,
      x: chunk.x + (Math.random() - 0.5) * 40,
      angle: (Math.random() - 0.5) * 200,
      alpha: 0,
      duration: 700 + Math.random() * 200,
      ease: "Quad.In",
      onComplete: () => chunk.destroy(),
    });
  }
  p.image.setAlpha(0);
  p.cracks.clear();

  scene.time.delayedCall(PLATFORM_RETURN_MS, () => restore(scene, p));
}

function restore(scene, p) {
  // Don't pop back in on top of the player: wait a little and try again
  const pb = scene.player.body;
  const overlapping =
    pb.right > p.x &&
    pb.left < p.x + p.w &&
    pb.bottom > p.y &&
    pb.top < p.y + 20;
  if (overlapping) {
    scene.time.delayedCall(400, () => restore(scene, p));
    return;
  }

  p.body.body.enable = true;
  p.state = "solid";
  scene.tweens.add({ targets: p.image, alpha: 1, duration: 300 });
}

// ─── Sinking rafts ───────────────────────────────────────────────────────────────────────────
// A raft floating over toxic water. While you stand on it, it slowly sinks; stay too long and it
// takes you down into the water. Step off and it floats back up.
const RAFT_H = 16;
const RISE_SPEED = 45; // px/s when floating back up

function addSinkingPlatforms(scene, list, timing) {
  const rafts = list.map(([x, y, w], i) => {
    const key = `raft_platform_${i}`;
    bakeRaftPlatform(scene, key, w, RAFT_H, i);
    const image = scene.add.image(x, y, key).setOrigin(0, 0);
    const body = scene.physics.add
      .image(x + w / 2, y + RAFT_H / 2, null)
      .setDisplaySize(w, RAFT_H)
      .setVisible(false);
    body.setImmovable(true);
    body.body.setAllowGravity(false);

    const raft = {
      image,
      body,
      x,
      w,
      topY: y,
      lowest: POOL_SURFACE_Y + 24 - RAFT_H / 2, // how far its centre can go: just under the surface
      lastStood: -Infinity,
      nextRipple: 0,
    };
    scene.physics.add.collider(scene.player, body, () => {
      const pb = scene.player.body;
      if (pb.touching.down && pb.bottom <= body.body.top + 6)
        raft.lastStood = scene.time.now;
    });
    if (scene.coins) scene.physics.add.collider(scene.coins, body);

    // it bobs gently on the water when nobody is on it
    raft.bobPhase = i * 1.3;
    return raft;
  });

  const update = (time) => {
    rafts.forEach((r) => {
      const standing = time - r.lastStood < 120;
      const restY =
        r.topY + RAFT_H / 2 + Math.sin(time / 600 + r.bobPhase) * 1.5;
      if (standing && r.body.y < r.lowest) {
        r.body.setVelocityY(timing.sinkSpeed);
        if (time > r.nextRipple) {
          // ripples and bubbles while it sinks
          r.nextRipple = time + 260;
          ripple(scene, r.x + Math.random() * r.w, POOL_SURFACE_Y);
        }
      } else if (!standing && r.body.y > restY + 1) {
        r.body.setVelocityY(-RISE_SPEED);
      } else {
        r.body.setVelocityY(0);
        if (!standing) r.body.y = restY;
      }
      r.body.x = r.x + r.w / 2; // never drifts sideways
      r.image.setPosition(r.x, r.body.y - RAFT_H / 2);
    });
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
}

function ripple(scene, x, y) {
  const ring = scene.add
    .ellipse(x, y + 2, 10, 3)
    .setStrokeStyle(1.5, 0xd8ff4a, 0.9);
  scene.tweens.add({
    targets: ring,
    scaleX: 3.5,
    scaleY: 2,
    alpha: 0,
    duration: 650,
    onComplete: () => ring.destroy(),
  });
  const bubble = scene.add.image(x, y + 4, "toxic_bubble").setScale(0.6);
  scene.tweens.add({
    targets: bubble,
    y: y - 14,
    alpha: 0,
    scale: 1.1,
    duration: 500,
    onComplete: () => bubble.destroy(),
  });
}

// ─── Quicksand ───────────────────────────────────────────────────────────────────────────────
// A patch of quicksand between two stretches of solid sand. You can walk on it, but slowly (and you
// can only make small jumps), and while you stand in it, it pulls you down. Sink too deep and it
// swallows you. Step out and it settles back. The sand is drawn in front of the player, so you
// really disappear into it.
const QUICKSAND_TOP = 572;
const QUICKSAND_DEPTH_LIMIT = 44; // pulled this far down = swallowed
const QUICKSAND_SETTLE_SPEED = 40; // px/s when it settles back after you get out

function addQuicksand(scene, patches, timing) {
  const patchesState = patches.map(([x, w], i) => {
    const key = `quicksand_${i}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const rand = Phaser.Math.RND;
    const h = 34;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x8e5e2c, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0xb07a3c, 1);
    g.fillRect(0, 0, w, h * 0.55);
    g.fillStyle(0xd09a52, 1);
    g.fillRect(0, 0, w, 4);
    g.lineStyle(1.2, 0x8a5a2a, 0.8); // swirls in the wet sand
    for (let k = 0; k < w / 40; k++) {
      const cx = 14 + rand.between(0, w - 28),
        cy = 10 + rand.between(0, 10);
      g.beginPath();
      g.arc(cx, cy, rand.between(5, 10), 0, Math.PI * 1.4);
      g.strokePath();
    }
    g.generateTexture(key, w, h);
    g.destroy();
    scene.add
      .image(x, QUICKSAND_TOP - 2, key)
      .setOrigin(0, 0)
      .setDepth(5); // in front of the player

    // slowly turning swirls on the surface, so it reads as "this sand moves"
    for (let k = 0; k < Math.max(2, Math.floor(w / 90)); k++) {
      const swirl = scene.add
        .ellipse(
          x + ((k + 0.5) * w) / Math.max(2, Math.floor(w / 90)),
          QUICKSAND_TOP + 6,
          34,
          6,
        )
        .setStrokeStyle(1.4, 0x7a4a22, 0.8)
        .setDepth(6);
      scene.tweens.add({
        targets: swirl,
        scaleX: 0.3,
        scaleY: 0.4,
        alpha: 0.2,
        duration: 1400 + k * 200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    }

    const body = scene.physics.add
      .image(x + w / 2, QUICKSAND_TOP + 8, null)
      .setDisplaySize(w, 16)
      .setVisible(false);
    body.setImmovable(true);
    body.body.setAllowGravity(false);

    const q = {
      body,
      x,
      w,
      restY: QUICKSAND_TOP + 8,
      lastStood: -Infinity,
      nextPuff: 0,
    };
    scene.physics.add.collider(scene.player, body, () => {
      const pb = scene.player.body;
      if (pb.touching.down && pb.bottom <= body.body.top + 6) {
        q.lastStood = scene.time.now;
        scene.inQuicksandUntil = scene.time.now + 120; // GameScene slows you down and shortens your jumps
      }
    });
    return q;
  });

  const update = (time) => {
    patchesState.forEach((q) => {
      const standing = time - q.lastStood < 120;
      if (standing) {
        q.body.setVelocityY(timing.quicksandSpeed);
        if (time > q.nextPuff) {
          // sand puffs around your feet
          q.nextPuff = time + 220;
          sandPuff(scene, scene.player.x, QUICKSAND_TOP);
        }
        if (
          q.body.y - q.restY >= QUICKSAND_DEPTH_LIMIT &&
          !scene.gameOver &&
          !scene.gameWon
        ) {
          q.lastStood = -Infinity;
          q.body.setVelocityY(0);
          q.body.y = q.restY;
          scene.loseLife("quicksand");
        }
      } else if (q.body.y > q.restY + 0.5) {
        q.body.setVelocityY(-QUICKSAND_SETTLE_SPEED);
      } else {
        q.body.setVelocityY(0);
        q.body.y = q.restY;
      }
      q.body.x = q.x + q.w / 2;
    });
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
}

function sandPuff(scene, x, y) {
  for (let i = 0; i < 3; i++) {
    const grain = scene.add
      .circle(
        x + (Math.random() - 0.5) * 24,
        y,
        1.5 + Math.random() * 1.5,
        0xd09a52,
      )
      .setDepth(7);
    scene.tweens.add({
      targets: grain,
      y: y - 8 - Math.random() * 10,
      x: grain.x + (Math.random() - 0.5) * 16,
      alpha: 0,
      duration: 380,
      ease: "Quad.Out",
      onComplete: () => grain.destroy(),
    });
  }
}

// ─── Falling rocks ───────────────────────────────────────────────────────────────────────────
// While you are near a rock spot, a glowing warning appears on the ground, then a rock drops there.
// Being hit costs a life (blinking after a hit protects you, like with enemies).
function addFallingRocks(scene, spots, timing, look = ROCK_LOOKS.volcano) {
  const rocks = [];
  const spawners = spots.map((x) => ({ x, next: 0 }));

  scene.time.addEvent({
    delay: 100,
    loop: true,
    callback: () => {
      if (scene.gameOver || scene.gameWon) return;
      const now = scene.time.now;
      spawners.forEach((sp) => {
        if (
          now < sp.next ||
          Math.abs(scene.player.x - sp.x) > ROCK_TRIGGER_DISTANCE
        )
          return;
        sp.next = now + timing.rockWarn + timing.rockCooldown;
        dropRock(
          scene,
          sp.x + Phaser.Math.Between(-15, 15),
          timing,
          rocks,
          look,
        );
      });
    },
  });

  // tidy up rocks that fell into lava or off the bottom
  const tidy = () => {
    for (let i = rocks.length - 1; i >= 0; i--) {
      const r = rocks[i];
      if (!r.active) {
        rocks.splice(i, 1);
        continue;
      }
      if (r.y > 590) {
        shatter(scene, r, true);
        rocks.splice(i, 1);
      }
    }
  };
  scene.events.on("update", tidy);
  scene.events.once("shutdown", () => scene.events.off("update", tidy)); // the scene object is reused on restart
}

// The top of the solid ground under x (or the lava surface if there is none)
function groundYAt(scene, x) {
  const tops = (scene.platformData || [])
    .filter(([px, , pw]) => x >= px && x <= px + pw)
    .map(([, py]) => py);
  return tops.length ? Math.min(...tops) : 576;
}

function dropRock(scene, x, timing, rocks, look = ROCK_LOOKS.volcano) {
  const groundY = groundYAt(scene, x);

  // ⚠️ warning: a glowing mark that grows on the ground, and a "!" above it
  const mark = scene.add
    .ellipse(x, groundY, 40, 10, look.mark, 0.6)
    .setScale(0.3);
  const bang = scene.add
    .text(x, groundY - 26, "!", {
      fontSize: "22px",
      fontStyle: "bold",
      color: look.bang,
      stroke: look.bangStroke,
      strokeThickness: 4,
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: mark,
    scale: 1,
    duration: timing.rockWarn,
    ease: "Quad.In",
  });
  scene.tweens.add({
    targets: bang,
    alpha: 0.2,
    duration: 150,
    yoyo: true,
    repeat: -1,
  });

  scene.time.delayedCall(timing.rockWarn, () => {
    bang.destroy();
    if (scene.gameOver || scene.gameWon) {
      mark.destroy();
      return;
    }
    const cam = scene.cameras.main;
    const rock = scene.physics.add.image(x, cam.scrollY - 30, look.texture);
    rock.look = look;
    rock.setCircle(10, 2.5, 2.5);
    rock.body.setGravityY(500);
    rock.setVelocityY(220);
    rock.setAngularVelocity(Phaser.Math.Between(-240, 240));
    rock.mark = mark;
    rocks.push(rock);

    // a short trail of embers behind it
    const trail = scene.add.particles(0, 0, look.trail, {
      follow: rock,
      lifespan: 300,
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: 40,
      speedX: { min: -10, max: 10 },
      speedY: { min: -30, max: -10 },
    });
    rock.trail = trail;

    scene.physics.add.collider(rock, scene.platforms, () =>
      shatter(scene, rock),
    );
    scene.physics.add.overlap(scene.player, rock, () => {
      if (!rock.active) return;
      shatter(scene, rock);
      if (!scene.invincible && !scene.gameOver && !scene.gameWon)
        scene.loseLife(look.cause);
    });
  });
}

function shatter(scene, rock, quiet = false) {
  if (!rock.active) return;
  const { x, y } = rock;
  const bits = (rock.look || ROCK_LOOKS.volcano).bits;
  if (rock.mark) rock.mark.destroy();
  if (rock.trail) {
    rock.trail.stop();
    scene.time.delayedCall(400, () => rock.trail.destroy());
  }
  rock.destroy();
  if (quiet) return;
  for (let i = 0; i < 8; i++) {
    const bit = scene.add.rectangle(
      x,
      y,
      4 + Math.random() * 4,
      4 + Math.random() * 3,
      i % 3 ? bits[0] : bits[1],
    );
    scene.tweens.add({
      targets: bit,
      x: x + (Math.random() - 0.5) * 70,
      y: y - 10 - Math.random() * 30,
      angle: Math.random() * 360,
      alpha: 0,
      duration: 450,
      ease: "Quad.Out",
      onComplete: () => bit.destroy(),
    });
  }
  const cam = scene.cameras.main;
  if (Math.abs(scene.player.x - x) < cam.width / 2) cam.shake(120, 0.004);
}

// ─── Lost Civilization: spikes, traps and poisonous plants ───────────────────────────────────

function makeTempleTextures(scene) {
  makeBubbleTexture(scene, "stone_dust", 0xb89a6a, 0xe8d4a0);
  makeBubbleTexture(scene, "poison_spore", 0xb6f04a, 0xf0ffb0);
  makeGlowTexture(scene, "poison_glow", "150,215,60");
  if (!scene.textures.exists("falling_stone")) {
    // a carved block with a gold mark
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x5a4630, 1);
    g.fillPoints(
      [
        { x: 3, y: 6 },
        { x: 12, y: 2 },
        { x: 22, y: 5 },
        { x: 23, y: 17 },
        { x: 15, y: 23 },
        { x: 4, y: 20 },
      ],
      true,
    );
    g.fillStyle(0x8a7250, 1);
    g.fillPoints(
      [
        { x: 3, y: 6 },
        { x: 12, y: 2 },
        { x: 22, y: 5 },
        { x: 13, y: 10 },
      ],
      true,
    );
    g.fillStyle(0xe2b84a, 1);
    g.fillRect(9, 13, 7, 1.8);
    g.fillRect(11.6, 11, 1.8, 7);
    g.generateTexture("falling_stone", 25, 25);
    g.destroy();
  }
  if (!scene.textures.exists("poison_plant")) {
    // a fat purple bulb on a stem, with lime spots
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x2f6a2a, 1);
    g.fillRect(20, 22, 4, 18); // stem
    g.fillEllipse(11, 34, 20, 8); // leaves
    g.fillEllipse(33, 34, 20, 8);
    g.fillStyle(0x4f9a3a, 1);
    g.fillEllipse(11, 33, 14, 3);
    g.fillEllipse(33, 33, 14, 3);
    g.fillStyle(0x6a2a94, 1);
    g.fillEllipse(22, 15, 26, 24); // bulb
    g.fillStyle(0x8a3ab8, 1);
    g.fillEllipse(20, 13, 20, 18);
    g.fillStyle(0xc8ff5a, 1); // poison spots
    g.fillCircle(14, 12, 2.4);
    g.fillCircle(24, 9, 2);
    g.fillCircle(28, 17, 2.4);
    g.fillCircle(18, 20, 1.8);
    g.fillStyle(0x2a0f3a, 1); // the mouth at the top
    g.fillEllipse(22, 5, 12, 5);
    g.fillStyle(0xc8ff5a, 1);
    g.fillTriangle(17, 4, 20, 4, 18.5, 8);
    g.fillTriangle(24, 4, 27, 4, 25.5, 8);
    g.generateTexture("poison_plant", 44, 40);
    g.destroy();
  }
}

// A row of stone spikes with gold tips, standing on baseY
function drawSpikeRow(g, x0, baseY, w, spikeW, spikeH) {
  const n = Math.max(1, Math.floor(w / spikeW));
  const step = w / n;
  for (let i = 0; i < n; i++) {
    const sx = x0 + i * step,
      mid = sx + step / 2;
    g.fillStyle(0x8a7a5e, 1);
    g.fillTriangle(sx, baseY, sx + step, baseY, mid, baseY - spikeH);
    g.fillStyle(0xc9b98a, 1); // the lit side
    g.fillTriangle(sx, baseY, mid, baseY, mid, baseY - spikeH);
    g.fillStyle(0xf2d070, 1); // gold tip
    g.fillTriangle(
      mid - 1.6,
      baseY - spikeH + 5,
      mid + 1.6,
      baseY - spikeH + 5,
      mid,
      baseY - spikeH,
    );
  }
}

// A deadly touch area. It can be switched on and off with zone.body.enable.
function addDangerZone(scene, x, y, w, h, cause) {
  const zone = scene.physics.add
    .staticImage(x, y, null)
    .setDisplaySize(w, h)
    .setVisible(false);
  zone.refreshBody();
  scene.physics.add.overlap(scene.player, zone, () => {
    if (!scene.gameOver && !scene.gameWon) scene.loseLife(cause);
  });
  return zone;
}

// ─── Spike pits ──────────────────────────────────────────────────────────────────────────────
// [x, width]: a gap in the floor with spikes at the bottom. Fall in and you lose a life.
const SPIKE_PIT_TOP = 570;
function addSpikePits(scene, pits) {
  pits.forEach(([x, w], i) => {
    const key = `spike_pit_${i}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const h = 34;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x120c06, 1);
    g.fillRect(0, 0, w, h);
    drawSpikeRow(g, 2, h, w - 4, 13, 24);
    g.generateTexture(key, w, h);
    g.destroy();
    scene.add.image(x, SPIKE_PIT_TOP, key).setOrigin(0, 0);
    addDangerZone(scene, x + w / 2, SPIKE_PIT_TOP + 22, w - 6, 20, "spikes");
  });
}

// ─── Spikes on the floor ─────────────────────────────────────────────────────────────────────
// [x, y, width]: a short row of spikes standing on the ground at height y. Jump over them.
function addFloorSpikes(scene, list) {
  list.forEach(([x, y, w]) => {
    const key = `floor_spikes_${w}`;
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      drawSpikeRow(g, 0, 15, w, 9, 14);
      g.generateTexture(key, w, 15);
      g.destroy();
    }
    scene.add.image(x, y - 14, key).setOrigin(0, 0);
    addDangerZone(scene, x + w / 2, y - 6, w - 8, 10, "spikes");
  });
}

// ─── Spike traps ─────────────────────────────────────────────────────────────────────────────
// [x, y, width]: a gold-rimmed plate in the floor. The spikes hide inside it, then the tips poke out
// and rattle (the warning), then they shoot up (deadly), then they slide back down. Each trap runs
// on a repeating timer, a little out of step with the others.
function addSpikeTraps(scene, traps, timing) {
  const states = traps.map(([x, y, w], index) => {
    const plateKey = `spike_trap_plate_${w}`,
      spikesKey = `spike_trap_spikes_${w}`;
    if (!scene.textures.exists(plateKey)) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x2a1c0e, 1);
      g.fillRect(0, 0, w, 8);
      g.lineStyle(1.5, 0xd9ac3c, 1);
      g.strokeRect(1, 1, w - 2, 6);
      g.fillStyle(0x000000, 1); // the holes the spikes come out of
      for (let hx = 8; hx < w - 4; hx += 10) g.fillCircle(hx, 4, 2);
      g.generateTexture(plateKey, w, 8);
      g.destroy();
    }
    if (!scene.textures.exists(spikesKey)) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      drawSpikeRow(g, 0, 26, w - 10, 10, 26);
      g.generateTexture(spikesKey, w - 10, 26);
      g.destroy();
    }
    // setOrigin(0.5, 1): the spikes are measured from their bottom edge, so they grow UP out of the plate
    const spikes = scene.add
      .image(x + w / 2, y + 1, spikesKey)
      .setOrigin(0.5, 1)
      .setScale(1, 0);
    scene.add.image(x, y - 1, plateKey).setOrigin(0, 0);
    const zone = addDangerZone(scene, x + w / 2, y - 11, w - 16, 22, "spikes");
    zone.body.enable = false;
    return { x: x + w / 2, spikes, zone, index, state: null };
  });

  const cycle = timing.spikeWarn + timing.spikeOut + timing.spikeOff;
  const update = (time) => {
    states.forEach((trap) => {
      const phase = (time + trap.index * 730) % cycle;
      const state =
        phase < timing.spikeOff
          ? "hidden"
          : phase < timing.spikeOff + timing.spikeWarn
            ? "warning"
            : "out";
      if (state !== trap.state) {
        trap.state = state;
        trap.zone.body.enable = state === "out";
        scene.tweens.killTweensOf(trap.spikes);
        scene.tweens.add({
          targets: trap.spikes,
          scaleY: state === "out" ? 1 : state === "warning" ? 0.24 : 0,
          duration: state === "out" ? 70 : 220,
          ease: state === "out" ? "Quad.Out" : "Sine.InOut",
        });
      }
      trap.spikes.x =
        trap.x + (state === "warning" ? Math.sin(time / 28) * 1.2 : 0); // the tips rattle as a warning
    });
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
}

// ─── Poisonous plants ────────────────────────────────────────────────────────────────────────
// [x, y]: a plant growing on the ground (or a platform) at height y. Touching it costs a life.
// Every few seconds it swells up (the warning) and then puffs out a cloud of poison that is much
// bigger than the plant, so you have to wait for the cloud to clear before jumping over.
function addPoisonPlants(scene, plants, timing) {
  const states = plants.map(([x, y], index) => {
    const cloud = scene.add
      .image(x, y - 38, "poison_glow")
      .setAlpha(0)
      .setScale(0.2);
    const plant = scene.add.image(x, y + 1, "poison_plant").setOrigin(0.5, 1);
    const spores = scene.add.particles(0, 0, "poison_spore", {
      x: { min: x - 34, max: x + 34 },
      y: { min: y - 50, max: y - 14 },
      lifespan: 700,
      speedY: { min: -45, max: -12 },
      speedX: { min: -14, max: 14 },
      scale: { start: 0.5, end: 1.1 },
      alpha: { start: 0.9, end: 0 },
      frequency: 55,
      emitting: false,
    });
    addDangerZone(scene, x, y - 12, 16, 22, "poison"); // the plant itself
    const cloudZone = addDangerZone(scene, x, y - 36, 84, 72, "poison");
    cloudZone.body.enable = false;
    return { plant, cloud, spores, cloudZone, index, state: null };
  });

  const cycle = timing.plantRest + timing.plantWarn + timing.plantCloud;
  const update = (time) => {
    states.forEach((p) => {
      const phase = (time + p.index * 910) % cycle;
      const state =
        phase < timing.plantRest
          ? "rest"
          : phase < timing.plantRest + timing.plantWarn
            ? "warning"
            : "cloud";
      if (state === p.state) return;
      p.state = state;
      p.cloudZone.body.enable = state === "cloud";
      p.spores.emitting = state === "cloud";
      scene.tweens.killTweensOf([p.plant, p.cloud]);
      p.plant.setScale(1);
      if (state === "warning") {
        // swells and shrinks, faster than a heartbeat
        scene.tweens.add({
          targets: p.plant,
          scaleX: 1.18,
          scaleY: 1.24,
          duration: 170,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut",
        });
      } else if (state === "cloud") {
        // the cloud bursts out
        p.cloud.setAlpha(0.85).setScale(0.2);
        scene.tweens.add({
          targets: p.cloud,
          scaleX: 0.95,
          scaleY: 0.8,
          duration: 220,
          ease: "Quad.Out",
        });
      } else {
        // the cloud fades away
        scene.tweens.add({ targets: p.cloud, alpha: 0, duration: 300 });
      }
    });
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
}

// ─── The Haunted Grounds: platforms you cannot trust ─────────────────────────────────────────
// Three kinds. All of them can be spotted by an observant player:
//   👻 illusion platforms look exactly like the real grave slabs, but every few seconds a faint
//      purple shimmer runs over them. Land on one and your feet go straight through it; it
//      dissolves into purple mist and re-forms a couple of seconds later.
//   🟪 vanishing platforms are cursed slabs with glowing runes. On a timer they flicker (the
//      warning), fade away, then come back.
//   🌫️ ghost platforms also look like real slabs, but thin wisps of mist keep leaking from
//      underneath. They fade away when you come close, and come back once you move away.
const SLAB_H = 20;

// ⚡ Is x..x+w on (or just beside) the screen right now? Things off screen are not drawn or animated:
// the level has 19 trick platforms, and animating all of them all the time was making it lag.
function onCamera(scene, x, w, margin = 120) {
  const cam = scene.cameras.main;
  return x + w > cam.scrollX - margin && x < cam.scrollX + cam.width + margin;
}

function makeGraveTextures(scene) {
  makeBubbleTexture(scene, "grave_mist", 0xa07ae0, 0xe4d4ff);
}

// A puff of purple mist across a platform (when it dissolves or re-forms)
function mistPuff(scene, x, y, w, inward = false) {
  if (!onCamera(scene, x, w, 0)) return; // nobody would see it
  for (let i = 0; i < 7; i++) {
    const px = x + Math.random() * w,
      py = y + Math.random() * SLAB_H;
    const dx = (Math.random() - 0.5) * 50,
      dy = -10 - Math.random() * 30;
    const bit = scene.add
      .image(inward ? px + dx : px, inward ? py + dy : py, "grave_mist")
      .setScale(0.8 + Math.random() * 1.2)
      .setAlpha(inward ? 0 : 0.9);
    scene.tweens.add({
      targets: bit,
      x: inward ? px : px + dx,
      y: inward ? py : py + dy,
      alpha: inward ? 0.9 : 0,
      scale: inward ? 0.6 : 2,
      duration: 500 + Math.random() * 300,
      ease: "Quad.Out",
      onComplete: () => bit.destroy(),
    });
  }
}

// Is the player overlapping this rectangle? (used before bringing a platform back)
function playerInside(scene, x, y, w, h) {
  const pb = scene.player.body;
  return pb.right > x && pb.left < x + w && pb.bottom > y && pb.top < y + h;
}

// ─── Illusion platforms ──────────────────────────────────────────────────────────────────────
// [x, y, width]. No physics body at all, so nothing can stand on them. A little code watches the
// player's feet: if they were above the top last frame and are below it now (inside its width),
// the player has just "landed" on it, so it dissolves.
function addIllusionPlatforms(scene, list, timing) {
  const fakes = list.map(([x, y, w], i) => {
    const key = `illusion_platform_${i}`;
    bakeTombSlab(scene, key, w, SLAB_H, 40 + i);
    const image = scene.add.image(x, y, key).setOrigin(0, 0);
    const shimmer = scene.add
      .rectangle(x + w / 2, y + SLAB_H / 2, w, SLAB_H, 0xc8a8ff, 0)
      .setBlendMode("ADD")
      .setVisible(false); // the tell
    return {
      x,
      y,
      w,
      image,
      shimmer,
      state: "solid",
      nextShimmer: 1500 + i * 700,
      wasAbove: true,
      seen: true,
    };
  });

  const update = (time) => {
    const pb = scene.player.body;
    fakes.forEach((f) => {
      const seen = onCamera(scene, f.x, f.w);
      if (seen !== f.seen) {
        f.seen = seen;
        f.image.setVisible(seen);
      }
      if (f.state === "solid" && time > f.nextShimmer) {
        // 👀 the tell: a quick faint shimmer
        f.nextShimmer = time + 2600 + Math.random() * 1800;
        if (seen) {
          f.shimmer.setVisible(true);
          scene.tweens.add({
            targets: f.shimmer,
            fillAlpha: 0.3,
            duration: 180,
            yoyo: true,
            onComplete: () => f.shimmer.setVisible(false),
          });
          scene.tweens.add({
            targets: f.image,
            alpha: 0.72,
            duration: 180,
            yoyo: true,
          });
        }
      }
      const above = pb.bottom <= f.y + 2;
      const within = pb.right > f.x + 4 && pb.left < f.x + f.w - 4;
      if (
        f.state === "solid" &&
        within &&
        f.wasAbove &&
        !above &&
        pb.velocity.y >= 0
      )
        dissolve(scene, f, timing);
      f.wasAbove = above;
    });
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
}

function dissolve(scene, f, timing) {
  f.state = "gone";
  scene.tweens.killTweensOf([f.image, f.shimmer]);
  f.shimmer.fillAlpha = 0;
  f.shimmer.setVisible(false);
  scene.tweens.add({ targets: f.image, alpha: 0, duration: 220 });
  mistPuff(scene, f.x, f.y, f.w);
  scene.time.delayedCall(timing.reform, () => {
    mistPuff(scene, f.x, f.y, f.w, true); // the mist gathers back...
    scene.tweens.add({
      targets: f.image,
      alpha: 1,
      duration: 450,
      delay: 250,
      onComplete: () => {
        f.state = "solid";
      },
    });
  });
}

// ─── Vanishing platforms ─────────────────────────────────────────────────────────────────────
// [x, y, width]. Solid for a while, then flicker (the warning), then gone, then back. Each one runs
// on its own repeating timer, a little out of step with the others.
function addVanishingPlatforms(scene, list, timing) {
  const plats = list.map(([x, y, w], i) => {
    const key = `vanishing_platform_${i}`;
    bakeCursedSlab(scene, key, w, SLAB_H, i);
    const image = scene.add.image(x, y, key).setOrigin(0, 0);
    const body = scene.physics.add
      .staticImage(x + w / 2, y + SLAB_H / 2, null)
      .setDisplaySize(w, SLAB_H)
      .setVisible(false);
    body.refreshBody();
    scene.physics.add.collider(scene.player, body);
    return { x, y, w, image, body, index: i, state: "solid", since: 0 };
  });

  const cycle = timing.vanishSolid + timing.vanishWarn + timing.vanishGone;
  const update = (time) => {
    plats.forEach((p) => {
      const phase = (time + p.index * 900) % cycle;
      const state =
        phase < timing.vanishSolid
          ? "solid"
          : phase < timing.vanishSolid + timing.vanishWarn
            ? "warning"
            : "gone";
      if (
        state !== p.state &&
        !(state === "solid" && playerInside(scene, p.x, p.y, p.w, SLAB_H))
      ) {
        // don't come back inside the player
        p.state = state;
        p.since = time;
        p.body.body.enable = state !== "gone";
        if (state === "gone") mistPuff(scene, p.x, p.y, p.w);
        else if (state === "solid") mistPuff(scene, p.x, p.y, p.w, true);
      }
      // how it looks right now: flickering (warning), invisible (gone) or fading back in (solid)
      const seen = onCamera(scene, p.x, p.w);
      p.image.setVisible(seen);
      if (!seen) return;
      if (p.state === "warning")
        p.image.setAlpha(0.675 + Math.cos((time - p.since) / 35) * 0.325);
      else if (p.state === "gone") p.image.setAlpha(0);
      else p.image.setAlpha(Math.min(1, (time - p.since) / 250));
    });
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
}

// ─── Ghost platforms ─────────────────────────────────────────────────────────────────────────
// [x, y, width]. They fade away when the player comes within ghostNear pixels (sideways), and come
// back once the player is more than ghostFar pixels away. So they can never hold you: they are a
// trap for anyone who jumps at them without looking.
function addGhostPlatforms(scene, list, timing) {
  const plats = list.map(([x, y, w], i) => {
    const key = `ghost_platform_${i}`;
    bakeTombSlab(scene, key, w, SLAB_H, 70 + i);
    const image = scene.add.image(x, y, key).setOrigin(0, 0);
    const body = scene.physics.add
      .staticImage(x + w / 2, y + SLAB_H / 2, null)
      .setDisplaySize(w, SLAB_H)
      .setVisible(false);
    body.refreshBody();
    scene.physics.add.collider(scene.player, body);
    // 👀 the tell: wisps of mist keep leaking from underneath
    const wisps = scene.add.particles(0, 0, "grave_mist", {
      x: { min: x + 6, max: x + w - 6 },
      y: y + SLAB_H - 2,
      lifespan: 1400,
      speedY: { min: 6, max: 16 },
      speedX: { min: -6, max: 6 },
      scale: { start: 0.5, end: 1.4 },
      alpha: { start: 0.45, end: 0 },
      frequency: 260,
    });
    return { x, y, w, image, body, wisps, shown: true, seen: true };
  });

  const update = () => {
    const px = scene.player.x;
    plats.forEach((p) => {
      const seen = onCamera(scene, p.x, p.w);
      if (seen !== p.seen) {
        p.seen = seen;
        p.image.setVisible(seen);
        p.wisps.setVisible(seen);
      }
      p.wisps.emitting = seen && p.shown;
      const distance = Math.max(0, Math.abs(px - (p.x + p.w / 2)) - p.w / 2); // 0 = right above or below it
      if (p.shown && distance < timing.ghostNear) {
        p.shown = false;
        p.body.body.enable = false;
        scene.tweens.killTweensOf(p.image);
        scene.tweens.add({ targets: p.image, alpha: 0, duration: 220 });
        mistPuff(scene, p.x, p.y, p.w);
      } else if (
        !p.shown &&
        distance > timing.ghostFar &&
        !playerInside(scene, p.x, p.y, p.w, SLAB_H)
      ) {
        p.shown = true;
        p.body.body.enable = true;
        scene.tweens.killTweensOf(p.image);
        scene.tweens.add({ targets: p.image, alpha: 1, duration: 500 });
      }
    });
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
}
