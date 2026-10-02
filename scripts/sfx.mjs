// Synthesizes the game's sound effects into src/Game/*.wav (16-bit mono, 22050 Hz).
import fs from "node:fs";

const RATE = 22050;

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
  return buf;
}

/** Notes: [startSec, durSec, freqStart, freqEnd, wave, volume] mixed together. */
function synth(len, notes) {
  const out = new Float32Array(Math.round(len * RATE));
  for (const [start, dur, f0, f1, wave, vol] of notes) {
    let phase = 0;
    const n = Math.round(dur * RATE);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      phase += ((f0 + (f1 - f0) * t) / RATE) * 2 * Math.PI;
      const env = Math.min(1, i / 60) * (1 - t) ** 2; // quick attack, smooth decay
      const v = wave === "square" ? Math.sign(Math.sin(phase)) * 0.5 : wave === "tri" ? (2 / Math.PI) * Math.asin(Math.sin(phase)) : Math.sin(phase);
      const j = Math.round(start * RATE) + i;
      if (j < out.length) out[j] += v * env * vol;
    }
  }
  return [...out];
}

const sounds = {
  pick: synth(0.08, [[0, 0.08, 520, 760, "tri", 0.5]]),
  place: synth(0.14, [[0, 0.12, 220, 110, "square", 0.35], [0, 0.05, 900, 300, "tri", 0.2]]),
  clear: synth(0.45, [[0, 0.15, 523, 523, "tri", 0.45], [0.08, 0.15, 659, 659, "tri", 0.45], [0.16, 0.25, 784, 784, "tri", 0.45], [0.16, 0.29, 1047, 1047, "sine", 0.3]]),
  combo: synth(0.6, [[0, 0.12, 659, 659, "square", 0.25], [0.08, 0.12, 784, 784, "square", 0.25], [0.16, 0.12, 988, 988, "square", 0.25], [0.24, 0.35, 1319, 1319, "tri", 0.4]]),
  deny: synth(0.15, [[0, 0.15, 180, 140, "square", 0.25]]),
  gameover: synth(1.1, [[0, 0.3, 392, 392, "tri", 0.45], [0.25, 0.3, 330, 330, "tri", 0.45], [0.5, 0.6, 262, 196, "tri", 0.45]]),
};
fs.mkdirSync("src/Game", { recursive: true });
for (const [name, s] of Object.entries(sounds)) fs.writeFileSync(`src/Game/${name}.wav`, wav(s));
console.log("wrote", Object.keys(sounds).join(", "));
