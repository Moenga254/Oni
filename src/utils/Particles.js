export default class Particles {

  // 💥 Coin collect burst
  static coinBurst(scene, x, y) {
    const colors = [0xffdd00, 0xffaa00, 0xffffff, 0xffff88];

    for (let i = 0; i < 10; i++) {
      const gfx = scene.add.graphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      gfx.fillStyle(color, 1);
      gfx.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      gfx.x = x;
      gfx.y = y;

      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(60, 180);
      const vx = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
      const vy = Math.sin(Phaser.Math.DegToRad(angle)) * speed;

      scene.tweens.add({
        targets: gfx,
        x: gfx.x + vx * 0.4,
        y: gfx.y + vy * 0.4,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(300, 600),
        ease: "Power2",
        onComplete: () => gfx.destroy()
      });
    }

    // ✨ Score popup text
    const popup = scene.add.text(x, y - 10, "+10", {
      fontSize: "20px",
      color: "#ffdd00",
      stroke: "#000000",
      strokeThickness: 3,
      fontStyle: "bold"
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: 0,
      duration: 700,
      ease: "Power2",
      onComplete: () => popup.destroy()
    });
  }

  // 💀 Player death explosion
  static deathBurst(scene, x, y) {
    const colors = [0xff4444, 0xff8800, 0xffff00, 0xffffff];

    for (let i = 0; i < 20; i++) {
      const gfx = scene.add.graphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      gfx.fillStyle(color, 1);

      // Mix of circles and rectangles
      if (Math.random() > 0.5) {
        gfx.fillCircle(0, 0, Phaser.Math.Between(3, 8));
      } else {
        gfx.fillRect(-3, -3, Phaser.Math.Between(4, 10), Phaser.Math.Between(4, 10));
      }

      gfx.x = x;
      gfx.y = y;

      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(80, 250);
      const vx = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
      const vy = Math.sin(Phaser.Math.DegToRad(angle)) * speed;

      scene.tweens.add({
        targets: gfx,
        x: gfx.x + vx * 0.5,
        y: gfx.y + vy * 0.5,
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(400, 900),
        ease: "Power3",
        onComplete: () => gfx.destroy()
      });
    }
  }

  // 🌟 Win celebration
  static winCelebration(scene) {
    const colors = [
      0xff0000, 0xff8800, 0xffff00,
      0x00ff00, 0x0088ff, 0xff00ff
    ];

    // Burst from multiple points across screen
    const points = [
      [200, 300], [400, 200], [600, 300],
      [300, 400], [500, 400]
    ];

    points.forEach(([px, py], idx) => {
      scene.time.delayedCall(idx * 150, () => {
        for (let i = 0; i < 15; i++) {
          const gfx = scene.add.graphics();
          const color = colors[Math.floor(Math.random() * colors.length)];
          gfx.fillStyle(color, 1);
          gfx.fillRect(-4, -4, 8, 8);
          gfx.x = px;
          gfx.y = py;
          gfx.setScrollFactor(0); // 👈 fixed to screen

          const angle = Phaser.Math.Between(0, 360);
          const speed = Phaser.Math.Between(100, 300);
          const vx = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
          const vy = Math.sin(Phaser.Math.DegToRad(angle)) * speed;

          scene.tweens.add({
            targets: gfx,
            x: gfx.x + vx * 0.6,
            y: gfx.y + vy * 0.6,
            alpha: 0,
            angle: Phaser.Math.Between(-360, 360),
            duration: Phaser.Math.Between(500, 1000),
            ease: "Power2",
            onComplete: () => gfx.destroy()
          });
        }
      });
    });
  }

  // 👣 Dust when landing
  static landDust(scene, x, y) {
    for (let i = 0; i < 6; i++) {
      const gfx = scene.add.graphics();
      gfx.fillStyle(0xcccccc, 0.7);
      gfx.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      gfx.x = x + Phaser.Math.Between(-10, 10);
      gfx.y = y;

      scene.tweens.add({
        targets: gfx,
        x: gfx.x + Phaser.Math.Between(-20, 20),
        y: gfx.y - Phaser.Math.Between(10, 30),
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(200, 400),
        ease: "Power1",
        onComplete: () => gfx.destroy()
      });
    }
  }

  // 🚩 Flag reached effect
  static flagBurst(scene, x, y) {
    const colors = [0xff0000, 0xffffff, 0xffdd00];

    for (let i = 0; i < 25; i++) {
      const gfx = scene.add.graphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      gfx.fillStyle(color, 1);
      gfx.fillRect(-3, -3, 6, 6);
      gfx.x = x;
      gfx.y = y;

      const angle = Phaser.Math.Between(200, 340); // burst upward
      const speed = Phaser.Math.Between(100, 300);
      const vx = Math.cos(Phaser.Math.DegToRad(angle)) * speed;
      const vy = Math.sin(Phaser.Math.DegToRad(angle)) * speed;

      scene.tweens.add({
        targets: gfx,
        x: gfx.x + vx * 0.6,
        y: gfx.y + vy * 0.6,
        alpha: 0,
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(600, 1200),
        ease: "Power2",
        onComplete: () => gfx.destroy()
      });
    }
  }
}