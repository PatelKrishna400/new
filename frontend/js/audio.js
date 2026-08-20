/**
 * TAP EMPIRE — Web Audio API Procedural BGM & SFX Engine
 * Upbeat arcade / synthwave soundtrack & dynamic audio effects.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isUnlocked = false;

    // Settings (persisted in localStorage)
    this.musicEnabled = localStorage.getItem('te_music_enabled') !== 'false';
    this.sfxEnabled = localStorage.getItem('te_sfx_enabled') !== 'false';
    this.musicVolume = parseFloat(localStorage.getItem('te_music_vol') || '0.35');
    this.sfxVolume = parseFloat(localStorage.getItem('te_sfx_vol') || '0.6');

    // Gain Nodes
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // BGM State
    this.isPlayingBGM = false;
    this.bgmTimer = null;
    this.currentStep = 0;

    // Chord progressions in frequency (Hz)
    // Am -> F -> C -> G (A Minor key synthwave)
    this.chords = [
      [220.00, 261.63, 329.63], // Am (A3, C4, E4)
      [174.61, 220.00, 261.63], // F  (F3, A3, C4)
      [130.81, 164.81, 196.00], // C  (C3, E3, G3)
      [146.83, 196.00, 246.94]  // G  (D3, G3, B3)
    ];

    // Lead melody notes (Pentatonic / Dorian synth lead notes in Hz)
    this.melodyNotes = [
      440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 0,
      659.25, 587.33, 523.25, 440.00, 523.25, 659.25, 783.99, 0
    ];

    // Bassline root notes
    this.bassNotes = [110.00, 87.31, 65.41, 73.42];

    // Callbacks for UI updates
    this.onStateChange = null;
  }

  /** Initialize Audio Context & Nodes */
  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Create Gain Nodes
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.musicGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
    this.sfxGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.setupUnlockListeners();
  }

  /** Unlock Web Audio on first gesture */
  setupUnlockListeners() {
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
          if (this.musicEnabled && !this.isPlayingBGM) {
            this.startBGM();
          }
        });
      } else {
        this.isUnlocked = true;
        if (this.musicEnabled && !this.isPlayingBGM) {
          this.startBGM();
        }
      }
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };

    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
  }

  /** Start Procedural Background Music Sequencer */
  startBGM() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlayingBGM) return;
    this.isPlayingBGM = true;
    this.currentStep = 0;

    // 124 BPM -> 16th note interval = (60 / 124 / 4) * 1000 = ~121ms
    const stepIntervalMs = 121;

    this.bgmTimer = setInterval(() => {
      if (!this.musicEnabled || !this.isPlayingBGM) return;
      this.playSequencerStep(this.currentStep);
      this.currentStep = (this.currentStep + 1) % 32;
    }, stepIntervalMs);

    if (this.onStateChange) this.onStateChange();
  }

  /** Stop BGM */
  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.onStateChange) this.onStateChange();
  }

  /** Single Sequencer Step Execution */
  playSequencerStep(step) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const bar = Math.floor(step / 8);
    const chordIndex = Math.floor(step / 8) % 4;

    // 1. Bassline (Every 4 steps)
    if (step % 4 === 0) {
      const bassFreq = this.bassNotes[chordIndex];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassFreq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.23);
    }

    // 2. Pad / Chords (On beat 0 of every 8 steps)
    if (step % 8 === 0) {
      const chord = this.chords[chordIndex];
      chord.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.96);
      });
    }

    // 3. Arpeggio / Lead synth (Syncopated pattern)
    const melodyIndex = step % 16;
    const melFreq = this.melodyNotes[melodyIndex];
    if (melFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(melFreq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + 0.1);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.13);
    }

    // 4. Rhythm Percussion / Hi-Hat Tick (Off-beats)
    if (step % 2 === 1) {
      this.playHiHat(now);
    }
  }

  /** Synthesize crisp Hi-Hat cymbal sound */
  playHiHat(now) {
    const bufferSize = this.ctx.sampleRate * 0.03; // 30ms noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(now);
  }

  /* ═══════════════════════════════════════════════════════════
     SOUND EFFECTS (SFX) SYNTHESIZERS
  ═══════════════════════════════════════════════════════════ */

  /** Tap / Coin Chime SFX */
  playTapSound(comboLevel = 1) {
    if (!this.sfxEnabled) return;
    if (!this.ctx) this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Base pitch pitch shifts slightly up with combo
    const pitchBoost = Math.min(comboLevel * 25, 300);
    const baseFreq = 587.33 + pitchBoost + (Math.random() * 20 - 10); // D5 pitch range

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /** Upgrade Purchase / Cash SFX */
  playUpgradeSound() {
    if (!this.sfxEnabled) return;
    if (!this.ctx) this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.13);
    });
  }

  /** Level Up Fanfare SFX */
  playLevelUpSound() {
    if (!this.sfxEnabled) return;
    if (!this.ctx) this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const sequence = [
      { freq: 440.00, duration: 0.12, time: 0 },    // A4
      { freq: 554.37, duration: 0.12, time: 0.12 }, // C#5
      { freq: 659.25, duration: 0.12, time: 0.24 }, // E5
      { freq: 880.00, duration: 0.35, time: 0.36 }  // A5 victorious finish!
    ];

    sequence.forEach((item) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + item.time;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(item.freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + item.duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + item.duration + 0.01);
    });
  }

  /** General UI Button Click SFX */
  playClickSound() {
    if (!this.sfxEnabled) return;
    if (!this.ctx) this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /* ═══════════════════════════════════════════════════════════
     TOGGLES & VOLUME CONTROLS
  ═══════════════════════════════════════════════════════════ */

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem('te_music_enabled', this.musicEnabled);

    if (this.musicGain) {
      this.musicGain.gain.value = this.musicEnabled ? this.musicVolume : 0;
    }

    if (this.musicEnabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }

    if (this.onStateChange) this.onStateChange();
    return this.musicEnabled;
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    localStorage.setItem('te_sfx_enabled', this.sfxEnabled);

    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxEnabled ? this.sfxVolume : 0;
    }

    if (this.sfxEnabled) {
      this.playClickSound();
    }

    if (this.onStateChange) this.onStateChange();
    return this.sfxEnabled;
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, parseFloat(val)));
    localStorage.setItem('te_music_vol', this.musicVolume);

    if (this.musicGain && this.musicEnabled) {
      this.musicGain.gain.value = this.musicVolume;
    }
  }

  setSFXVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, parseFloat(val)));
    localStorage.setItem('te_sfx_vol', this.sfxVolume);

    if (this.sfxGain && this.sfxEnabled) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }
}

// Global Singleton Instance
window.soundEngine = new SoundEngine();
