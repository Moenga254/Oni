import Phaser from "phaser";
import { EndlessMode } from "../data/EndlessMode.js";

export default class EndlessScene extends Phaser.Scene {

    constructor() {
        super("EndlessScene");
    }

    preload() {
        this.load.spritesheet(
            "endlessHero",
            "/assets/dude.png",
            {
                frameWidth: 32,
                frameHeight: 48
            }
        );
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        this.groundY = height - EndlessMode.floorHeight;

        // ===================================
        // PLAYER STATS
        // ===================================

        this.playerStats = {
            score: 0,

            health: EndlessMode.startingHealth,
            maxHealth: EndlessMode.maxHealth,

            speed: EndlessMode.playerSpeed,

            highScore: this.getHighScore(),

            survivalTime: 0,

            shieldActive: false,
            speedBoostActive: false,
            frozen: false
        };

        this.shieldUntil = 0;
        this.speedBoostUntil = 0;
        this.freezeUntil = 0;

        this.startTime = this.time.now;
        this.gameOver = false;

        // ===================================
        // BACKGROUND
        // ===================================

        this.cameras.main.setBackgroundColor(
            EndlessMode.backgroundColor
        );

        // Ground
        this.add.rectangle(
            width / 2,
            this.groundY + EndlessMode.floorHeight / 2,
            width,
            EndlessMode.floorHeight,
            EndlessMode.floorColor
        );

        // Set physics boundaries at the ground
        this.physics.world.setBounds(
            0,
            0,
            width,
            this.groundY
        );

        // ===================================
        // PLAYER
        // ===================================

        this.player = this.physics.add.sprite(
            width / 2,
            this.groundY - 30,
            "endlessHero"
        );

        this.player.setDisplaySize(48, 56);

        this.player.body.setSize(30, 42);

        this.player.body.setAllowGravity(false);

        this.player.setCollideWorldBounds(true);

        if (!this.anims.exists("endlessWalk")) {
            this.anims.create({
                key: "endlessWalk",
                frames: this.anims.generateFrameNumbers("endlessHero", {
                    start: 0,
                    end: 3
                }),
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.anims.exists("endlessIdle")) {
            this.anims.create({
                key: "endlessIdle",
                frames: [{ key: "endlessHero", frame: 4 }],
                frameRate: 20
            });
        }

        this.player.anims.play("endlessIdle");

        // ===================================
        // KEYBOARD CONTROLS
        // ===================================

        this.cursors = this.input.keyboard.createCursorKeys();

        this.aKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.A
        );

        this.dKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.D
        );

        // ===================================
        // FALLING OBJECTS
        // ===================================

        this.fallingObjects = this.physics.add.group();

        this.physics.add.overlap(
            this.player,
            this.fallingObjects,
            this.collectObject,
            null,
            this
        );

        // ===================================
        // PLAYER STATS DISPLAY
        // ===================================

        this.statsText = this.add.text(
            15,
            15,
            "",
            {
                fontSize: "19px",
                color: "#ffffff",
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 4,
                lineSpacing: 6
            }
        ).setScrollFactor(0).setDepth(100);

        // ===================================
        // GAME INFORMATION
        // ===================================

        this.spawnTimer = this.time.now + 500;

        this.updateStatsDisplay();
    }


    // ===================================
    // SPAWN FALLING OBJECTS
    // ===================================

    spawnObject() {

        const width = this.scale.width;

        const objectTypes = [
            "coin",
            "coin",
            "coin",
            "heart",
            "bomb",
            "bomb",
            "money",
            "lightning",
            "shield",
            "freeze"
        ];

        const type = Phaser.Utils.Array.GetRandom(objectTypes);

        const symbols = {
            coin: "🪙",
            heart: "❤️",
            bomb: "💣",
            money: "💰",
            lightning: "⚡",
            shield: "🛡️",
            freeze: "❄️"
        };

        const colors = {
            coin: "#ffd700",
            heart: "#ff4d6d",
            bomb: "#333333",
            money: "#00cc66",
            lightning: "#ffff00",
            shield: "#3399ff",
            freeze: "#66ffff"
        };

        const x = Phaser.Math.Between(30, width - 30);

        const item = this.add.text(
            x,
            -35,
            symbols[type],
            {
                fontSize: "32px",
                color: colors[type]
            }
        ).setOrigin(0.5);

        // Give the object physics
        this.physics.add.existing(item);

        item.body.setAllowGravity(false);

        item.body.setSize(32, 32);

        item.type = type;

        // Slight variation in individual object speed
        item.speedMultiplier = Phaser.Math.FloatBetween(0.9, 1.1);

        this.fallingObjects.add(item);

        this.setObjectSpeed(item);
    }


    // ===================================
    // OBJECT FALLING SPEED
    // ===================================

    setObjectSpeed(item) {

        const elapsed = (this.time.now - this.startTime) / 1000;

        const difficultyLevel = Math.floor(
            elapsed / EndlessMode.speedIncreaseEvery
        );

        const fallSpeed = Math.min(
            EndlessMode.baseFallSpeed +
            difficultyLevel * EndlessMode.speedIncreaseAmount,

            EndlessMode.maxFallSpeed
        );

        item.body.setVelocityY(
            fallSpeed * item.speedMultiplier
        );
    }


    // ===================================
    // COLLECT OBJECTS
    // ===================================

    collectObject(player, item) {

        if (this.gameOver || !item.active) return;

        const type = item.type;

        // Remove collected object
        item.destroy();

        switch (type) {

            case "coin":

                this.playerStats.score += 1;

                break;


            case "heart":

                this.playerStats.health = Math.min(
                    this.playerStats.health + 1,
                    this.playerStats.maxHealth
                );

                break;


            case "bomb":

                // Shield protects against bombs
                if (this.time.now < this.shieldUntil) {
                    return;
                }

                this.playerStats.health--;

                if (this.playerStats.health <= 0) {
                    this.endGame();
                }

                break;


            case "money":

                this.playerStats.score += 5;

                break;


            case "lightning":

                // Increase player movement speed
                this.speedBoostUntil =
                    this.time.now + EndlessMode.speedBoostDuration;

                break;


            case "shield":

                // Protect player for 10 seconds
                this.shieldUntil =
                    this.time.now + EndlessMode.shieldDuration;

                break;


            case "freeze":

                // Freeze player movement for 3 seconds
                this.freezeUntil =
                    this.time.now + EndlessMode.freezeDuration;

                break;
        }

        this.updateStatsDisplay();
    }


    // ===================================
    // UPDATE PLAYER STATS
    // ===================================

    updatePlayerStats() {

        const now = this.time.now;

        this.playerStats.survivalTime = Math.floor(
            (now - this.startTime) / 1000
        );

        this.playerStats.shieldActive =
            now < this.shieldUntil;

        this.playerStats.speedBoostActive =
            now < this.speedBoostUntil;

        this.playerStats.frozen =
            now < this.freezeUntil;

        this.playerStats.speed =
            EndlessMode.playerSpeed *
            (
                this.playerStats.speedBoostActive
                    ? EndlessMode.speedBoostMultiplier
                    : 1
            );

        this.updateStatsDisplay();
    }


    // ===================================
    // PLAYER STATS DISPLAY
    // ===================================

    updateStatsDisplay() {

        const minutes = Math.floor(
            this.playerStats.survivalTime / 60
        );

        const seconds = this.playerStats.survivalTime % 60;

        const shieldStatus =
            this.time.now < this.shieldUntil
                ? Math.ceil((this.shieldUntil - this.time.now) / 1000) + "s"
                : "OFF";

        const speedStatus =
            this.time.now < this.speedBoostUntil
                ? "BOOSTED"
                : "NORMAL";

        const freezeStatus =
            this.time.now < this.freezeUntil
                ? "FROZEN"
                : "NORMAL";

        this.statsText.setText([
            `Score: ${this.playerStats.score}`,
            `Health: ${"❤️".repeat(this.playerStats.health)}`,
            `Speed: ${Math.round(this.playerStats.speed)}`,
            `Shield: ${shieldStatus}`,
            `Movement: ${speedStatus}`,
            `Freeze: ${freezeStatus}`,
            `Time: ${minutes}:${String(seconds).padStart(2, "0")}`,
            `Best: ${this.playerStats.highScore}`
        ]);
    }


    // ===================================
    // HIGH SCORE
    // ===================================

    getHighScore() {

        try {
            return Number(
                localStorage.getItem("oniEndlessHighScore")
            ) || 0;

        } catch (error) {
            return 0;
        }
    }


    saveHighScore() {

        if (this.playerStats.score > this.playerStats.highScore) {

            this.playerStats.highScore = this.playerStats.score;

            try {
                localStorage.setItem(
                    "oniEndlessHighScore",
                    this.playerStats.highScore
                );

            } catch (error) {
                console.warn("Could not save high score.");
            }
        }
    }


    // ===================================
    // GAME OVER
    // ===================================

    endGame() {

        if (this.gameOver) return;

        this.gameOver = true;

        this.saveHighScore();

        this.physics.pause();

        const width = this.scale.width;
        const height = this.scale.height;

        this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.75
        ).setDepth(200);

        this.add.text(
            width / 2,
            height / 2 - 60,
            "GAME OVER",
            {
                fontSize: "48px",
                color: "#ff4444",
                fontStyle: "bold"
            }
        ).setOrigin(0.5).setDepth(201);

        this.add.text(
            width / 2,
            height / 2,
            `Score: ${this.playerStats.score}`,
            {
                fontSize: "28px",
                color: "#ffffff"
            }
        ).setOrigin(0.5).setDepth(201);

        this.add.text(
            width / 2,
            height / 2 + 60,
            "Press R to restart",
            {
                fontSize: "20px",
                color: "#ffffff"
            }
        ).setOrigin(0.5).setDepth(201);

        this.input.keyboard.once("keydown-R", () => {
            this.scene.restart();
        });
    }


    // ===================================
    // MAIN UPDATE LOOP
    // ===================================

    update() {

        if (this.gameOver) return;

        const now = this.time.now;

        // Update player stats
        this.updatePlayerStats();

        // ===================================
        // PLAYER MOVEMENT
        // ===================================

        let velocityX = 0;

        if (now >= this.freezeUntil) {

            if (
                this.cursors.left.isDown ||
                this.aKey.isDown
            ) {
                velocityX = -this.playerStats.speed;
            }

            if (
                this.cursors.right.isDown ||
                this.dKey.isDown
            ) {
                velocityX = this.playerStats.speed;
            }
        }

        this.player.setVelocityX(velocityX);

        if (velocityX !== 0) {
            this.player.setFlipX(velocityX > 0);
            this.player.anims.play("endlessWalk", true);
        } else {
            this.player.anims.play("endlessIdle", true);
        }


        // ===================================
        // INCREASING DIFFICULTY
        // ===================================

        const elapsed = (now - this.startTime) / 1000;

        const difficultyLevel = Math.floor(
            elapsed / EndlessMode.speedIncreaseEvery
        );

        const currentFallSpeed = Math.min(
            EndlessMode.baseFallSpeed +
            difficultyLevel * EndlessMode.speedIncreaseAmount,

            EndlessMode.maxFallSpeed
        );

        // Make existing objects fall faster too
        this.fallingObjects.getChildren().forEach(item => {

            if (item.active && item.body) {

                item.body.setVelocityY(
                    currentFallSpeed * item.speedMultiplier
                );

                // Remove when object reaches the ground
                if (item.y >= this.groundY - 15) {
                    item.destroy();
                }
            }
        });


        // ===================================
        // SPAWN OBJECTS
        // ===================================

        const currentSpawnDelay = Math.max(
            EndlessMode.minimumSpawnDelay,
            EndlessMode.spawnDelay - elapsed * 12
        );

        if (now >= this.spawnTimer) {

            this.spawnObject();

            this.spawnTimer = now + currentSpawnDelay;
        }

        // Refresh the stats display periodically
        if (!this.nextStatsUpdate || now >= this.nextStatsUpdate) {

            this.updateStatsDisplay();

            this.nextStatsUpdate = now + 150;
        }
    }
}
