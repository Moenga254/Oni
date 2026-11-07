// A rounded, shiny button that grows a little when you point at it.
// Used by the start screen, the pause screen and the end-of-level screens, so they all match.
// (x, y) is the button's centre. Returns the container holding the picture and the label.
export function makeButton(scene, x, y, w, h, label, color, onClick, fontSize = 22) {
  const hoverColor = Phaser.Display.Color.IntegerToColor(color).brighten(12).color;
  const g = scene.add.graphics();
  const draw = (hover) => {
    g.clear();
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(-w / 2 + 3, -h / 2 + 5, w, h, 14);
    g.fillStyle(hover ? hoverColor : color, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.fillStyle(0xffffff, 0.16);
    g.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h / 2 - 4, { tl: 10, tr: 10, bl: 4, br: 4 });
    g.lineStyle(2, 0xffffff, hover ? 0.6 : 0.3);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  };
  draw(false);
  const text = scene.add.text(0, 0, label, {
    fontSize: `${fontSize}px`, fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 3
  }).setOrigin(0.5);
  const button = scene.add.container(x, y, [g, text]);

  const zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
  zone.on("pointerover", () => { draw(true);  scene.tweens.add({ targets: button, scale: 1.05, duration: 120 }); });
  zone.on("pointerout",  () => { draw(false); scene.tweens.add({ targets: button, scale: 1, duration: 120 }); });
  zone.on("pointerdown", onClick);
  return button;
}
