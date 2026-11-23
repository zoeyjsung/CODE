// ─── sounds.js ─────────────────────────────────────────────
// Gentle music box lullaby (clean, pure acoustic chime notes).
// No buzzing, no vibrating drones — just peaceful tinkling bells.
// ────────────────────────────────────────────────────────────

let audioCtx       = null;
let masterGain     = null;
let melodyTimer    = null;
let isMusicPlaying = false;

// Dreamy, sweet lullaby notes (Hz) — pure bell frequencies
// Melody inspired by Satie / Studio Ghibli music box
const LULLABY_NOTES = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50 // C6
];

// Relaxing melody note pattern (index in LULLABY_NOTES + note length)
const TUNE = [
  2, 3, 4, 3, 2, 0, 1, 2,
  4, 5, 4, 3, 2, 1, 0, 2
];

function initAudio() {
  if (audioCtx) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioCtx();

  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);
}

/** Pure crystalline bell chime (instant attack, sparkling decay) */
function playChimeNote(freq, vel = 0.25) {
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  // Pure sine wave = crystal clear, zero vibrating/buzzing
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t);

  // Soft chime envelope
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vel * 0.35, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.00001, t + 2.2);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(t);
  osc.stop(t + 2.3);
}

function startMusic() {
  if (isMusicPlaying) return;
  initAudio();
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  isMusicPlaying = true;

  let noteIndex = 0;
  function step() {
    if (!isMusicPlaying) return;
    const noteId = TUNE[noteIndex];
    const freq = LULLABY_NOTES[noteId];
    playChimeNote(freq, 0.28 + Math.random() * 0.1);

    // Occasional gentle lower bass note for depth
    if (noteIndex % 4 === 0) {
      setTimeout(() => {
        playChimeNote(freq * 0.5, 0.18);
      }, 60);
    }

    noteIndex = (noteIndex + 1) % TUNE.length;
    // Slow, soothing tempo (850ms - 1100ms per note)
    const delay = noteIndex % 4 === 0 ? 1200 : 850;
    melodyTimer = setTimeout(step, delay);
  }

  step();
}

// ─── INTERACTION SFX ───────────────────────────────────────
function playChime(index = 0) {
  if (!audioCtx) return;
  const f = LULLABY_NOTES[index % LULLABY_NOTES.length];
  playChimeNote(f, 0.35);
}

function playPlantSound() {
  if (!audioCtx) return;
  // Ascending musical chime
  [0, 2, 4, 5].forEach((n, idx) => {
    setTimeout(() => {
      playChimeNote(LULLABY_NOTES[n] * 1.1, 0.3);
    }, idx * 120);
  });
}

function playSparkle() {
  if (!audioCtx) return;
  [4, 3, 5, 2].forEach((n, idx) => {
    setTimeout(() => {
      playChimeNote(LULLABY_NOTES[n], 0.25);
    }, idx * 90);
  });
}

function playBrushDab() {
  // Silent or very quiet so it never buzzes
}

function playTransition() {
  if (!audioCtx) return;
  playChimeNote(LULLABY_NOTES[2], 0.25);
}
