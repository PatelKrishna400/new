/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Audio Engine v2
   Web Audio API — zero external files, procedural SFX.
   AudioContext lazily created on first user gesture.
═══════════════════════════════════════════════════════════ */

'use strict';

let _audioCtx = null;
let soundEnabled = localStorage.getItem('te_sound') !== '0';

function _getCtx() {
  if (!_audioCtx) {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) { return null; }
  }
  /* Resume if suspended (browser autoplay policy) */
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playTone(freq, type = 'sine', dur = 0.1, vol = 0.10) {
  if (!soundEnabled) return;
  const ctx = _getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (_) { }
}

const SFX = {
  tap() { playTone(880, 'sine', 0.07, 0.09); },
  critical() { playTone(1320, 'triangle', 0.16, 0.14); playTone(1760, 'sine', 0.10, 0.07); },
  perfect() { [523, 659, 880, 1047].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.20, 0.13), i * 75)); },
  combo() { playTone(660, 'triangle', 0.12, 0.11); },
  collect() { playTone(528, 'sine', 0.18, 0.13); playTone(792, 'sine', 0.12, 0.09); },
  upgrade() { playTone(440, 'sawtooth', 0.09, 0.08); playTone(660, 'sine', 0.14, 0.09); },
  levelUp() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.25, 0.17), i * 110)); },
  reward() { [523, 659, 880].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.20, 0.14), i * 90)); },
  achievement() { [659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.28, 0.13), i * 95)); },
  error() { playTone(220, 'sawtooth', 0.18, 0.08); },
  purchase() { SFX.reward(); },
};

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('te_sound', soundEnabled ? '1' : '0');
  return soundEnabled;
}
