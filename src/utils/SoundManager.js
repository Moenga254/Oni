export default class SoundManager {

  static init(scene) {
    // Create all sounds procedurally using Web Audio
    const ctx = scene.sound.context;

    SoundManager.scene = scene;
    SoundManager.ctx = ctx;
  }

  // 🎵 Play a procedural sound
  static play(type) {
    const ctx = SoundManager.ctx;
    if (!ctx) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === "suspended") ctx.resume();

    switch (type) {

      case "jump": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        break;
      }

      case "coin": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        break;
      }

      case "hit": {
        // Noise burst for getting hit
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        source.buffer = buffer;
        filter.type = "lowpass";
        filter.frequency.value = 400;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        source.start(ctx.currentTime);
        break;
      }

      case "win": {
        // Happy jingle — 3 ascending notes
        const notes = [523, 659, 784, 1047]; // C E G C
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "square";
          osc.frequency.value = freq;
          const t = ctx.currentTime + i * 0.15;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          osc.start(t);
          osc.stop(t + 0.3);
        });
        break;
      }

      case "gameover": {
        // Sad descending notes
        const notes = [392, 349, 330, 262]; // G F E C
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sawtooth";
          osc.frequency.value = freq;
          const t = ctx.currentTime + i * 0.2;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.start(t);
          osc.stop(t + 0.35);
        });
        break;
      }
    }
  }

  // 🎵 Background music loop
  static startMusic() {
    const ctx = SoundManager.ctx;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    // Simple repeating melody
    const melody = [
      [392, 0.2], [440, 0.2], [494, 0.2], [523, 0.4],
      [494, 0.2], [440, 0.2], [392, 0.4],
      [349, 0.2], [392, 0.2], [440, 0.2], [392, 0.4],
      [330, 0.2], [349, 0.2], [392, 0.6],
    ];

    let time = ctx.currentTime + 0.1;
    const totalDuration = melody.reduce((sum, [, d]) => sum + d, 0);

    const playMelody = (startTime) => {
      melody.forEach(([freq, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        osc.start(startTime);
        osc.stop(startTime + dur);
        startTime += dur;
      });
    };

    // Play immediately and loop
    playMelody(time);
    SoundManager.musicInterval = setInterval(() => {
      if (ctx.state !== "closed") {
        playMelody(ctx.currentTime + 0.05);
      }
    }, totalDuration * 1000);
  }

  static stopMusic() {
    if (SoundManager.musicInterval) {
      clearInterval(SoundManager.musicInterval);
      SoundManager.musicInterval = null;
    }
  }
}
