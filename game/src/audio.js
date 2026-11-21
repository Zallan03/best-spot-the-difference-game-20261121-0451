/* audio.js — all sound effects are synthesized with WebAudio oscillators.
   No audio files are loaded. The context is created on the first user
   gesture so browsers allow playback; M toggles mute. */
(function () {
  'use strict';

  let ctx = null;
  let muted = false;
  let master = null;

  /** Lazily create the AudioContext (must follow a user gesture). */
  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** One oscillator note: frequency, start delay, duration, wave and volume. */
  function note(freq, delay, duration, type, volume) {
    if (muted) return;
    const ac = ensureContext();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume || 0.22, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** A happy two-note chime when a difference is found. */
  function playFound() {
    note(660, 0, 0.16, 'sine', 0.25);
    note(880, 0.09, 0.22, 'sine', 0.25);
    note(1320, 0.18, 0.18, 'triangle', 0.12);
  }

  /** A low dull buzz for a wrong click. */
  function playWrong() {
    note(140, 0, 0.22, 'sawtooth', 0.12);
    note(110, 0.05, 0.22, 'sawtooth', 0.10);
  }

  /** A soft rising ping when a hint reveals a difference. */
  function playHint() {
    note(520, 0, 0.12, 'sine', 0.18);
    note(780, 0.08, 0.2, 'sine', 0.18);
  }

  /** A short click for buttons and UI. */
  function playClick() {
    note(440, 0, 0.07, 'square', 0.08);
  }

  /** A rising fanfare arpeggio for finishing a level. */
  function playWin() {
    const seq = [523, 659, 784, 1047];
    seq.forEach(function (f, i) {
      note(f, i * 0.11, 0.28, 'triangle', 0.22);
    });
    note(1319, 0.48, 0.45, 'sine', 0.18);
  }

  /** A short rising blip when a level starts. */
  function playLevelStart() {
    note(392, 0, 0.1, 'triangle', 0.16);
    note(523, 0.09, 0.14, 'triangle', 0.16);
  }

  /** A tick when the timer drops under ten seconds. */
  function playTick() {
    note(980, 0, 0.05, 'square', 0.06);
  }

  /** A descending phrase for running out of time. */
  function playLose() {
    note(392, 0, 0.25, 'triangle', 0.18);
    note(330, 0.2, 0.25, 'triangle', 0.18);
    note(262, 0.4, 0.45, 'triangle', 0.18);
  }

  /** Toggle mute; returns the new muted state. */
  function toggleMute() {
    muted = !muted;
    return muted;
  }

  function isMuted() {
    return muted;
  }

  /** Unlock audio from a pointer or key gesture. */
  function unlock() {
    ensureContext();
  }

  window.SDAudio = {
    playFound, playWrong, playHint, playClick, playWin, playTick, playLose,
    playLevelStart, toggleMute, isMuted, unlock,
  };
})();
