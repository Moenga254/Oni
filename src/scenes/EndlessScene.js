import Phaser from "phaser";
import { EndlessMode } from "../data/EndlessMode.js";
import { makeButton } from "../utils/Button.js";

export default class EndlessScene extends Phaser.Scene {
  constructor() {
    super("EndlessScene");
  }

  preload() {
    if (!this.textures.exists("player")) {
      this.load.spritesheet("player", "/assets/dude.png", {
        frameWidth: 32,
        frameHeight: 48,
      });
    }
  }

  create(data = {}) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const floorY = height - EndlessMode.floorHeight;

    if (!data.resized) this.cameras.main.fadeIn(250, 0, 0, 0);
    this.cameras.main.setBackgroundColor(EndlessMode.backgroundColor);
    this.physics.world.setBounds(0, 0, width, height);
    this.physics.world.setBoundsCollision(true, true, false, true);

    const floor = this.add.rectangle(
      width / 2,
      floorY + EndlessMode.floorHeight / 2,
      width,
      EndlessMode.floorHeight,
      EndlessMode.floorColor,
    );
    this.physics.add.existing(floor, true);

    this.player = this.physics.add.sprite(width / 2, floorY - 24, "player");
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, floor);

    if (!this.anims.exists("walk")) {
      this.anims.create({
        key: "walk",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!this.anims.exists("idle")) {
      this.anims.create({
        key: "idle",
        frames: [{ key: "player", frame: 4 }],
        frameRate: 20,
      });
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.movementKeys = this.input.keyboard.addKeys("A,D");
    this.mobileLeft = false;
    this.mobileRight = false;
    if (this.sys.game.device.input.touch) this.createTouchControls(width, height);

    let leaving = false;
    const returnToMenu = () => {
      if (leaving) return;
      leaving = true;
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () =>
        this.scene.start("MenuScene"),
      );
    };

    makeButton(this, 66, 34, 104, 34, "← MENU", 0x2a2048, returnToMenu, 14);
    this.add
      .text(width / 2, 28, "← →  /  A D  to move", {
        fontSize: "16px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.input.keyboard.on("keydown-ESC", returnToMenu);
    this.events.once("shutdown", () =>
      this.input.keyboard.off("keydown-ESC", returnToMenu),
    );

    let redrawing = false;
    const onResize = () => {
      if (redrawing) return;
      redrawing = true;
      this.time.delayedCall(120, () => this.scene.restart({ resized: true }));
    };
    this.scale.on("resize", onResize);
    this.events.once("shutdown", () => this.scale.off("resize", onResize));
  }

  createTouchControls(width, height) {
    const buttonWidth = 82;
    const buttonHeight = 58;
    const y = height - EndlessMode.floorHeight - buttonHeight / 2 - 12;
    const activePointers = { left: new Set(), right: new Set() };
    const buttons = [
      { name: "left", x: 62, label: "◀" },
      { name: "right", x: 62 + buttonWidth + 12, label: "▶" },
      { name: "left", x: width - 62 - buttonWidth - 12, label: "◀" },
      { name: "right", x: width - 62, label: "▶" },
    ];

    const updateMovement = () => {
      this.mobileLeft = activePointers.left.size > 0;
      this.mobileRight = activePointers.right.size > 0;
    };
    const releasePointer = (pointer) => {
      activePointers.left.delete(pointer.id);
      activePointers.right.delete(pointer.id);
      updateMovement();
    };

    buttons.forEach(({ name, x, label }) => {
      const graphics = this.add.graphics().setScrollFactor(0).setDepth(5);
      const draw = (pressed) => {
        graphics.clear();
        graphics.fillStyle(pressed ? 0x665a7a : 0x201a30, 0.75);
        graphics.fillRoundedRect(
          x - buttonWidth / 2,
          y - buttonHeight / 2,
          buttonWidth,
          buttonHeight,
          12,
        );
        graphics.lineStyle(2, 0xffffff, 0.8);
        graphics.strokeRoundedRect(
          x - buttonWidth / 2,
          y - buttonHeight / 2,
          buttonWidth,
          buttonHeight,
          12,
        );
      };
      draw(false);

      this.add
        .text(x, y, label, { fontSize: "28px", color: "#ffffff" })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(6);

      this.add
        .zone(x, y, buttonWidth, buttonHeight)
        .setScrollFactor(0)
        .setInteractive()
        .on("pointerdown", (pointer) => {
          activePointers[name].add(pointer.id);
          updateMovement();
          draw(true);
        })
        .on("pointerup", (pointer) => {
          activePointers[name].delete(pointer.id);
          updateMovement();
          draw(activePointers[name].size > 0);
        })
        .on("pointerout", (pointer) => {
          activePointers[name].delete(pointer.id);
          updateMovement();
          draw(activePointers[name].size > 0);
        });
    });

    this.input.on("pointerup", releasePointer);
    this.input.on("pointerupoutside", releasePointer);
    this.events.once("shutdown", () => {
      this.input.off("pointerup", releasePointer);
      this.input.off("pointerupoutside", releasePointer);
    });
  }

  update() {
    const goLeft =
      this.cursors.left.isDown ||
      this.movementKeys.A.isDown ||
      this.mobileLeft;
    const goRight =
      this.cursors.right.isDown ||
      this.movementKeys.D.isDown ||
      this.mobileRight;

    if (goLeft && !goRight) {
      this.player.setVelocityX(-EndlessMode.playerSpeed);
      this.player.anims.play("walk", true);
      this.player.setFlipX(false);
    } else if (goRight && !goLeft) {
      this.player.setVelocityX(EndlessMode.playerSpeed);
      this.player.anims.play("walk", true);
      this.player.setFlipX(true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("idle", true);
    }
  }
}
