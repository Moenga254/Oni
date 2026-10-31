// Draws a row of 3 stars: gold = earned, grey = not earned.
// They are drawn as shapes, so there are no fonts or emoji to go wrong.
export function drawStarRow(scene, cx, cy, earned, { radius = 20, gap = null, animate = false } = {}) {
  const spacing = gap ?? radius * 2.6;
  const stars = [];

  for (let i = 0; i < 3; i++) {
    const got = i < earned;
    const star = scene.add.star(cx + (i - 1) * spacing, cy, 5, radius * 0.45, radius, got ? 0xffd700 : 0x555555);
    star.setStrokeStyle(2, got ? 0xb8860b : 0x333333);

    if (got && animate) {      // earned stars pop in one after another
      star.setScale(0);
      scene.tweens.add({ targets: star, scale: 1, duration: 350, delay: 300 + i * 250, ease: "Back.Out" });
    }
    stars.push(star);
  }
  return stars;
}
