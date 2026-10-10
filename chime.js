// A short chime made with Web Audio, so the widget needs no sound files.

/** @type {AudioContext | null} */
let context = null;

/**
 * Creates or wakes the audio context. Browsers let a frame play sound only after the user has
 * clicked in it, so this is called from clicks; later chimes reuse the context.
 */
export function unlockAudio() {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') context.resume().catch(() => {});
  } catch (error) {
    console.warn('no audio', error);
  }
}

/** Notes in Hz: falling for the end of focus, rising for the end of a break. */
const TUNES = {
  focusEnd: [1046.5, 784, 659.3],
  breakEnd: [659.3, 784, 1046.5],
};

const NOTE_GAP = 0.16;
const NOTE_LENGTH = 1.1;
const VOLUME = 0.18;

function note(frequency, at) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(VOLUME, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + NOTE_LENGTH);
  gain.connect(context.destination);

  // A sine with a quiet octave above sounds like a small bell rather than a beep.
  for (const [multiple, level] of [
    [1, 1],
    [2, 0.25],
  ]) {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency * multiple;
    const partial = context.createGain();
    partial.gain.value = level;
    oscillator.connect(partial).connect(gain);
    oscillator.start(at);
    oscillator.stop(at + NOTE_LENGTH + 0.05);
  }
}

/** @param {'focusEnd' | 'breakEnd'} tune */
export function chime(tune) {
  unlockAudio();
  if (!context) return;
  const at = context.currentTime + 0.02;
  TUNES[tune].forEach((frequency, index) => note(frequency, at + index * NOTE_GAP));
}
