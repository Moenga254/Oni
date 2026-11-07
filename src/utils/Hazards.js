import { bakeCrumblePlatform, bakeRottenPlankPlatform, bakeRaftPlatform } from "./Backdrops.js";

// 🌋☣️ Hazards for Magma Falls and Toxic Swamp: pools you must not touch, falling rocks, platforms that
// collapse and platforms that sink. Everything runs on the scene's own clock (scene.time / tweens / the
// scene's update), so it all stops while the game is paused.

// How long things take on each difficulty (milliseconds), per level
const TIMING = {
  //                     collapse after standing on it   rock warning   wait before the same spot drops again
  volcano: {
    easy:   { crumble: 3000, rockWarn: 1300, rockCooldown: 5000 },
    normal: { crumble: 2500, rockWarn: 1000, rockCooldown: 4000 },
    hard:   { crumble: 2000, rockWarn: 750,  rockCooldown: 3200 },
  },
  //                     plank breaks after             raft sinks this fast (px/s)
  swamp: {
    easy:   { crumble: 3000, sinkSpeed: 26 },
    normal: { crumble: 3000, sinkSpeed: 32 },
    hard:   { crumble: 2000, sinkSpeed: 40 },
  },
};
const PLATFORM_RETURN_MS = 3000;   // a collapsed platform comes back after this long
const ROCK_TRIGGER_DISTANCE = 280; // a rock spot only drops while you are this close to it
const POOL_SURFACE_Y = 576;        // the top of every lava / toxic pool

// What each kind of pool looks like, and what the game over screen says
const POOLS = {
  lava: {
    cause: "lava", bubble: "lava_bubble", glow: "hazard_glow",
    bands: [0xc0280a, 0xff4a0a, 0xff7a1a, 0xffc23a], crust: 0x3a0e06, shine: 0xfff0a0, glowAlpha: [0.45, 0.7]
  },
  toxic: {
    cause: "toxic", bubble: "toxic_bubble", glow: "toxic_glow",
    bands: [0x2f5a0c, 0x5a9a14, 0x8fd61e, 0xd8ff4a], crust: 0x3a2a12, shine: 0xf2ffb0, glowAlpha: [0.3, 0.5]
  },
};

// What each kind of collapsing platform looks like
const CRUMBLE_LOOKS = {
  volcano: { bake: bakeCrumblePlatform,     crackGlow: 0xff6a1a, crack: 0x140805, bits: [0x6a4632, 0x5a3a2a] },
  swamp:   { bake: bakeRottenPlankPlatform, crackGlow: 0xa6e22e, crack: 0x2a1a0c, bits: [0x7a5a38, 0x5a4026] },
};

export function setupVolcanoHazards(scene, levelData, difficultyKey) {
  const timing = TIMING.volcano[difficultyKey] || TIMING.volcano.normal;
  makeTextures(scene);
  addPools(scene, levelData.lavaPools || [], POOLS.lava);
  addCrumblingPlatforms(scene, levelData.crumblingPlatforms || [], timing, CRUMBLE_LOOKS.volcano);
  addFallingRocks(scene, levelData.fallingRocks || [], timing);
}

export function setupSwampHazards(scene, levelData, difficultyKey) {
  const timing = TIMING.swamp[difficultyKey] || TIMING.swamp.normal;
  makeTextures(scene);
  addPools(scene, levelData.toxicPools || [], POOLS.toxic);
  addCrumblingPlatforms(scene, levelData.breakingPlatforms || [], timing, CRUMBLE_LOOKS.swamp);
  addSinkingPlatforms(scene, levelData.sinkingPlatforms || [], timing);
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
  g.fillStyle(outer, 1); g.fillCircle(4, 4, 4);
  g.fillStyle(inner, 1); g.fillCircle(3, 3, 1.6);
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
    g.fillPoints([{ x: 4, y: 8 }, { x: 10, y: 2 }, { x: 19, y: 4 }, { x: 23, y: 12 }, { x: 19, y: 21 }, { x: 9, y: 23 }, { x: 2, y: 16 }], true);
    g.fillStyle(0x4a3226, 1);
    g.fillPoints([{ x: 10, y: 2 }, { x: 19, y: 4 }, { x: 14, y: 10 }, { x: 6, y: 8 }], true);
    g.lineStyle(1.6, 0xff6a1a, 1);
    g.beginPath(); g.moveTo(7, 12); g.lineTo(12, 14); g.lineTo(17, 11); g.strokePath();
    g.beginPath(); g.moveTo(12, 14); g.lineTo(13, 20); g.strokePath();
    g.generateTexture("falling_rock", 25, 25);
    g.destroy();
  }
}

// ─── Pools (lava / toxic water) ──────────────────────────────────────────────────────────────
// Each pool fills a gap in the floor. Touching it costs a life (even while blinking after a hit).
function addPools(scene, pools, look) {
  const surfaceY = POOL_SURFACE_Y;
  pools.forEach(([x, w], i) => {
    const key = `${look.cause}_pool_${i}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const h = 600 - surfaceY + 4;
    const [deep, mid, upper, top] = look.bands;
    [[deep, h], [mid, h * 0.6], [upper, h * 0.3], [top, 3]].forEach(([c, bh]) => { g.fillStyle(c, 1); g.fillRect(0, 0, w, bh); });
    const rand = Phaser.Math.RND;
    g.fillStyle(look.crust, 0.8);                                       // floating crust / scum
    for (let cx = 10 + rand.between(0, 20); cx < w - 10; cx += rand.between(26, 44)) g.fillEllipse(cx, 9 + rand.between(0, 8), rand.between(10, 20), 4);
    g.generateTexture(key, w, h);
    g.destroy();

    // glow above the surface, gently pulsing
    const glow = scene.add.image(x + w / 2, surfaceY, look.glow).setDisplaySize(w * 1.4, 90).setAlpha(look.glowAlpha[0]).setBlendMode("ADD");
    scene.tweens.add({ targets: glow, alpha: look.glowAlpha[1], duration: 900 + i * 70, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    scene.add.image(x, surfaceY, key).setOrigin(0, 0);

    // the bright surface shimmers
    const shine = scene.add.rectangle(x + w / 2, surfaceY + 1.5, w, 3, look.shine, 0.9);
    scene.tweens.add({ targets: shine, alpha: 0.3, duration: 500 + i * 40, yoyo: true, repeat: -1 });

    // bubbles popping on the surface
    scene.add.particles(0, 0, look.bubble, {
      x: { min: x + 6, max: x + w - 6 }, y: surfaceY + 4,
      lifespan: 600, speedY: { min: -40, max: -15 }, speedX: { min: -8, max: 8 },
      scale: { start: 0.5, end: 1.2 }, alpha: { start: 1, end: 0 },
      frequency: Math.max(120, 36000 / w)
    });

    // the deadly part
    const zone = scene.physics.add.staticImage(x + w / 2, surfaceY + 14, null).setDisplaySize(w, 24).setVisible(false);
    zone.refreshBody();
    scene.physics.add.overlap(scene.player, zone, () => {
      if (scene.gameOver || scene.gameWon) return;
      splash(scene, scene.player.x, surfaceY, look.bubble);
      scene.loseLife(look.cause);
    });
  });
}

function splash(scene, x, y, texture) {
  for (let i = 0; i < 12; i++) {
    const drop = scene.add.image(x, y, texture).setScale(0.8 + Math.random());
    scene.tweens.add({
      targets: drop, x: x + (Math.random() - 0.5) * 90, y: y - 30 - Math.random() * 50, alpha: 0,
      duration: 450 + Math.random() * 250, ease: "Quad.Out", onComplete: () => drop.destroy()
    });
  }
}

// ─── Collapsing / breaking platforms ─────────────────────────────────────────────────────────
// Stand on one and it cracks (three stages, shaking harder each time), then breaks and falls.
// It comes back a few seconds later.
function addCrumblingPlatforms(scene, list, timing, look) {
  const h = 20;
  list.forEach(([x, y, w], i) => {
    const key = `crumble_platform_${look === CRUMBLE_LOOKS.swamp ? "swamp" : "volcano"}_${i}`;
    look.bake(scene, key, w, h, i);
    const image = scene.add.image(x, y, key).setOrigin(0, 0);
    const cracks = scene.add.graphics({ x, y });

    const body = scene.physics.add.staticImage(x + w / 2, y + h / 2, null).setDisplaySize(w, h).setVisible(false);
    body.refreshBody();

    const p = { state: "solid", image, cracks, body, x, y, w, look };

    scene.physics.add.collider(scene.player, body, () => {
      const pb = scene.player.body;
      if (p.state === "solid" && pb.touching.down && pb.bottom <= body.body.top + 6) startCrumbling(scene, p, timing);
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
      pts.push({ x: Phaser.Math.Clamp(last.x + rand.between(-9, 9), 2, p.w - 2), y: Math.min(19, last.y + rand.between(4, 8)) });
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
      const amount = 1 + stage;                                         // shakes harder each stage
      scene.tweens.add({
        targets: [p.image, p.cracks], x: `+=${amount}`, duration: 45, yoyo: true,
        repeat: Math.floor(stageMs / 90) - 1,
        onComplete: () => { p.image.x = p.x; p.cracks.x = p.x; }
      });
      for (let d = 0; d < 2 + stage * 2; d++) {                          // grit falling from underneath
        const bit = scene.add.rectangle(p.x + Math.random() * p.w, p.y + 20, 3, 3, p.look.bits[0]);
        scene.tweens.add({ targets: bit, y: bit.y + 60, alpha: 0, duration: 600, onComplete: () => bit.destroy() });
      }
    });
  }

  scene.time.delayedCall(timing.crumble, () => collapse(scene, p));
}

function collapse(scene, p) {
  p.state = "gone";
  p.body.body.enable = false;
  scene.tweens.killTweensOf([p.image, p.cracks]);
  p.image.x = p.x; p.cracks.x = p.x;

  // break into chunks that tumble down
  for (let c = 0; c < 5; c++) {
    const chunk = scene.add.rectangle(p.x + (c + 0.5) * p.w / 5, p.y + 10, p.w / 5 - 2, 14, p.look.bits[c % 2]);
    scene.tweens.add({
      targets: chunk, y: chunk.y + 140 + Math.random() * 60, x: chunk.x + (Math.random() - 0.5) * 40,
      angle: (Math.random() - 0.5) * 200, alpha: 0, duration: 700 + Math.random() * 200, ease: "Quad.In",
      onComplete: () => chunk.destroy()
    });
  }
  p.image.setAlpha(0);
  p.cracks.clear();

  scene.time.delayedCall(PLATFORM_RETURN_MS, () => restore(scene, p));
}

function restore(scene, p) {
  // Don't pop back in on top of the player: wait a little and try again
  const pb = scene.player.body;
  const overlapping = pb.right > p.x && pb.left < p.x + p.w && pb.bottom > p.y && pb.top < p.y + 20;
  if (overlapping) { scene.time.delayedCall(400, () => restore(scene, p)); return; }

  p.body.body.enable = true;
  p.state = "solid";
  scene.tweens.add({ targets: p.image, alpha: 1, duration: 300 });
}

// ─── Sinking rafts ───────────────────────────────────────────────────────────────────────────
// A raft floating over toxic water. While you stand on it, it slowly sinks; stay too long and it
// takes you down into the water. Step off and it floats back up.
const RAFT_H = 16;
const RISE_SPEED = 45;   // px/s when floating back up

function addSinkingPlatforms(scene, list, timing) {
  const rafts = list.map(([x, y, w], i) => {
    const key = `raft_platform_${i}`;
    bakeRaftPlatform(scene, key, w, RAFT_H, i);
    const image = scene.add.image(x, y, key).setOrigin(0, 0);
    const body = scene.physics.add.image(x + w / 2, y + RAFT_H / 2, null).setDisplaySize(w, RAFT_H).setVisible(false);
    body.setImmovable(true);
    body.body.setAllowGravity(false);

    const raft = {
      image, body, x, w, topY: y,
      lowest: POOL_SURFACE_Y + 24 - RAFT_H / 2,   // how far its centre can go: just under the surface
      lastStood: -Infinity, nextRipple: 0
    };
    scene.physics.add.collider(scene.player, body, () => {
      const pb = scene.player.body;
      if (pb.touching.down && pb.bottom <= body.body.top + 6) raft.lastStood = scene.time.now;
    });
    if (scene.coins) scene.physics.add.collider(scene.coins, body);

    // it bobs gently on the water when nobody is on it
    raft.bobPhase = i * 1.3;
    return raft;
  });

  const update = (time) => {
    rafts.forEach(r => {
      const standing = time - r.lastStood < 120;
      const restY = r.topY + RAFT_H / 2 + Math.sin(time / 600 + r.bobPhase) * 1.5;
      if (standing && r.body.y < r.lowest) {
        r.body.setVelocityY(timing.sinkSpeed);
        if (time > r.nextRipple) {                                          // ripples and bubbles while it sinks
          r.nextRipple = time + 260;
          ripple(scene, r.x + Math.random() * r.w, POOL_SURFACE_Y);
        }
      } else if (!standing && r.body.y > restY + 1) {
        r.body.setVelocityY(-RISE_SPEED);
      } else {
        r.body.setVelocityY(0);
        if (!standing) r.body.y = restY;
      }
      r.body.x = r.x + r.w / 2;                                              // never drifts sideways
      r.image.setPosition(r.x, r.body.y - RAFT_H / 2);
    });
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
}

function ripple(scene, x, y) {
  const ring = scene.add.ellipse(x, y + 2, 10, 3).setStrokeStyle(1.5, 0xd8ff4a, 0.9);
  scene.tweens.add({ targets: ring, scaleX: 3.5, scaleY: 2, alpha: 0, duration: 650, onComplete: () => ring.destroy() });
  const bubble = scene.add.image(x, y + 4, "toxic_bubble").setScale(0.6);
  scene.tweens.add({ targets: bubble, y: y - 14, alpha: 0, scale: 1.1, duration: 500, onComplete: () => bubble.destroy() });
}

// ─── Falling rocks ───────────────────────────────────────────────────────────────────────────
// While you are near a rock spot, a glowing warning appears on the ground, then a rock drops there.
// Being hit costs a life (blinking after a hit protects you, like with enemies).
function addFallingRocks(scene, spots, timing) {
  const rocks = [];
  const spawners = spots.map(x => ({ x, next: 0 }));

  scene.time.addEvent({
    delay: 100, loop: true, callback: () => {
      if (scene.gameOver || scene.gameWon) return;
      const now = scene.time.now;
      spawners.forEach(sp => {
        if (now < sp.next || Math.abs(scene.player.x - sp.x) > ROCK_TRIGGER_DISTANCE) return;
        sp.next = now + timing.rockWarn + timing.rockCooldown;
        dropRock(scene, sp.x + Phaser.Math.Between(-15, 15), timing, rocks);
      });
    }
  });

  // tidy up rocks that fell into lava or off the bottom
  const tidy = () => {
    for (let i = rocks.length - 1; i >= 0; i--) {
      const r = rocks[i];
      if (!r.active) { rocks.splice(i, 1); continue; }
      if (r.y > 590) { shatter(scene, r, true); rocks.splice(i, 1); }
    }
  };
  scene.events.on("update", tidy);
  scene.events.once("shutdown", () => scene.events.off("update", tidy));   // the scene object is reused on restart
}

// The top of the solid ground under x (or the lava surface if there is none)
function groundYAt(scene, x) {
  const tops = (scene.platformData || []).filter(([px, , pw]) => x >= px && x <= px + pw).map(([, py]) => py);
  return tops.length ? Math.min(...tops) : 576;
}

function dropRock(scene, x, timing, rocks) {
  const groundY = groundYAt(scene, x);

  // ⚠️ warning: a glowing mark that grows on the ground, and a "!" above it
  const mark = scene.add.ellipse(x, groundY, 40, 10, 0xff3b1a, 0.6).setScale(0.3);
  const bang = scene.add.text(x, groundY - 26, "!", {
    fontSize: "22px", fontStyle: "bold", color: "#ffd060", stroke: "#3a0a06", strokeThickness: 4
  }).setOrigin(0.5);
  scene.tweens.add({ targets: mark, scale: 1, duration: timing.rockWarn, ease: "Quad.In" });
  scene.tweens.add({ targets: bang, alpha: 0.2, duration: 150, yoyo: true, repeat: -1 });

  scene.time.delayedCall(timing.rockWarn, () => {
    bang.destroy();
    if (scene.gameOver || scene.gameWon) { mark.destroy(); return; }
    const cam = scene.cameras.main;
    const rock = scene.physics.add.image(x, cam.scrollY - 30, "falling_rock");
    rock.setCircle(10, 2.5, 2.5);
    rock.body.setGravityY(500);
    rock.setVelocityY(220);
    rock.setAngularVelocity(Phaser.Math.Between(-240, 240));
    rock.mark = mark;
    rocks.push(rock);

    // a short trail of embers behind it
    const trail = scene.add.particles(0, 0, "lava_bubble", {
      follow: rock, lifespan: 300, scale: { start: 0.7, end: 0 }, alpha: { start: 0.8, end: 0 },
      frequency: 40, speedX: { min: -10, max: 10 }, speedY: { min: -30, max: -10 }
    });
    rock.trail = trail;

    scene.physics.add.collider(rock, scene.platforms, () => shatter(scene, rock));
    scene.physics.add.overlap(scene.player, rock, () => {
      if (!rock.active) return;
      shatter(scene, rock);
      if (!scene.invincible && !scene.gameOver && !scene.gameWon) scene.loseLife("rock");
    });
  });
}

function shatter(scene, rock, quiet = false) {
  if (!rock.active) return;
  const { x, y } = rock;
  if (rock.mark) rock.mark.destroy();
  if (rock.trail) { rock.trail.stop(); scene.time.delayedCall(400, () => rock.trail.destroy()); }
  rock.destroy();
  if (quiet) return;
  for (let i = 0; i < 8; i++) {
    const bit = scene.add.rectangle(x, y, 4 + Math.random() * 4, 4 + Math.random() * 3, i % 3 ? 0x2a1a14 : 0xff6a1a);
    scene.tweens.add({
      targets: bit, x: x + (Math.random() - 0.5) * 70, y: y - 10 - Math.random() * 30, angle: Math.random() * 360,
      alpha: 0, duration: 450, ease: "Quad.Out", onComplete: () => bit.destroy()
    });
  }
  const cam = scene.cameras.main;
  if (Math.abs(scene.player.x - x) < cam.width / 2) cam.shake(120, 0.004);
}
