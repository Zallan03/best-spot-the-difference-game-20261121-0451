/* main.js — the game itself: level flow, scoring, hints, the timer and the
   animation loop that keeps markers, hint rings and wrong-click crosses
   alive. Loads after every other module and boots on DOMContentLoaded. */
(function () {
  'use strict';

  const SCENES = window.SDScenes.scenes;
  const HINT_COOLDOWN_MS = 8000;
  const WRONG_PENALTY_SECONDS = 2;
  const FIND_POINTS = 100;
  const HINT_COST = 25;
  const TIME_BONUS_PER_SECOND = 5;

  const state = {
    levelIndex: 0,
    totalLevels: SCENES.length,
    scene: SCENES[0],
    diffs: null,
    score: 0,
    hintsLeft: 3,
    phase: 'playing', // playing | levelComplete | gameOver | win
    lastHintAt: 0,
    effects: { hintTarget: null, hintAt: 0, wrongMarks: [] },
  };

  let timer = null;
  let rafId = null;

  /** Start (or restart) a level: fresh differences, fresh timer, clean HUD. */
  function startLevel(index) {
    state.levelIndex = index;
    state.scene = SCENES[index];
    state.diffs = window.SDDifferences.createDifferences(state.scene.diffs);
    state.hintsLeft = 3;
    state.phase = 'playing';
    state.lastHintAt = 0;
    state.effects = { hintTarget: null, hintAt: 0, wrongMarks: [] };
    if (timer) timer.stop();
    timer = window.SDTimer.createTimer(
      state.scene.timeLimit,
      function (remaining, total) { onTimerTick(remaining, total); },
      function () { onTimeUp(); }
    );
    window.SDRender.hideOverlay();
    window.SDRender.updateHud(snapshot());
    window.SDAudio.playLevelStart();
    timer.start();
    window.SDRender.toast('Level ' + (index + 1) + ': ' + state.scene.name + ' — temukan ' + state.diffs.total() + ' perbedaan!', '');
    startLoop();
  }

  /** A snapshot of the numbers the HUD shows. */
  function snapshot() {
    return {
      levelIndex: state.levelIndex,
      totalLevels: state.totalLevels,
      scene: state.scene,
      remaining: state.diffs ? state.diffs.remaining() : 0,
      score: state.score,
      hintsLeft: state.hintsLeft,
      phase: state.phase,
    };
  }

  /** The animation loop: repaints so markers pop, rings pulse, Xs fade. */
  function startLoop() {
    if (rafId !== null) return;
    function frame() {
      window.SDRender.renderFrame(state.scene, state.diffs, state.effects);
      state.effects.wrongMarks = state.effects.wrongMarks.filter(function (m) {
        return Date.now() - m.at < 650;
      });
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
  }

  /** A click on either panel: find, or a wrong-click penalty. */
  function onPanelClick(x, y) {
    if (state.phase !== 'playing') return;
    const diff = state.diffs.hitTest(x, y);
    if (diff && !diff.found) {
      state.diffs.markFound(diff);
      state.score += FIND_POINTS;
      window.SDAudio.playFound();
      window.SDRender.toast('Ketemu! ' + diff.name + ' (+' + FIND_POINTS + ')', 'good');
      window.SDRender.updateHud(snapshot());
      if (state.diffs.allFound()) onLevelComplete();
      return;
    }
    if (diff && diff.found) {
      window.SDRender.toast('Itu sudah ketemu — cari yang lain!', '');
      return;
    }
    state.score = Math.max(0, state.score - 10);
    state.effects.wrongMarks.push({ x, y, at: Date.now() });
    window.SDAudio.playWrong();
    window.SDRender.toast('Bukan itu! −' + WRONG_PENALTY_SECONDS + ' detik.', 'bad');
    window.SDRender.updateHud(snapshot());
    timer.subtract(WRONG_PENALTY_SECONDS);
  }

  /** Reveal one unfound difference for 3 seconds; costs points, has a cooldown. */
  function onHint() {
    if (state.phase !== 'playing') return;
    if (state.hintsLeft <= 0) {
      window.SDRender.toast('Hint habis untuk level ini.', 'bad');
      return;
    }
    const now = Date.now();
    const since = now - state.lastHintAt;
    if (since < HINT_COOLDOWN_MS) {
      const wait = Math.ceil((HINT_COOLDOWN_MS - since) / 1000);
      window.SDRender.toast('Hint masih dingin — tunggu ' + wait + ' detik.', 'bad');
      return;
    }
    const target = state.diffs.pickHintTarget();
    if (!target) return;
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - HINT_COST);
    state.lastHintAt = now;
    state.effects.hintTarget = target;
    state.effects.hintAt = now;
    window.SDAudio.playHint();
    window.SDRender.toast('Hint: lihat cincin kuningnya! (−' + HINT_COST + ' poin)', '');
    window.SDRender.updateHud(snapshot());
  }

  /** Timer tick: update the bar; tick sound under ten seconds. */
  function onTimerTick(remaining) {
    window.SDRender.updateTimer(remaining, timer.getFraction());
    if (remaining <= 10 && remaining > 0) window.SDAudio.playTick();
  }

  /** All differences found: time bonus, fanfare, overlay, next level. */
  function onLevelComplete() {
    state.phase = 'levelComplete';
    timer.stop();
    const bonus = timer.getRemaining() * TIME_BONUS_PER_SECOND;
    state.score += bonus;
    window.SDAudio.playWin();
    window.SDRender.updateHud(snapshot());
    const last = state.levelIndex === state.totalLevels - 1;
    if (last) {
      state.phase = 'win';
      window.SDRender.showOverlay(
        'Kamu Menang! Semua Level Tuntas',
        'Tiga scene, ' + totalDiffs() + ' perbedaan — semuanya ketemu. Mata jeli sekali!',
        'Skor akhir: ' + state.score + ' (termasuk bonus waktu +' + bonus + ')',
        'Main Lagi &#8635; <kbd>R</kbd>'
      );
    } else {
      window.SDRender.showOverlay(
        'Level ' + (state.levelIndex + 1) + ' Selesai!',
        state.scene.name + ' tuntas. Bonus waktu: +' + bonus + ' poin. Level berikutnya lebih sulit — lebih banyak perbedaan, lebih sedikit waktu.',
        'Skor: ' + state.score,
        'Level Berikutnya &#8594; <kbd>R</kbd>'
      );
    }
  }

  /** Time ran out before every difference was found. */
  function onTimeUp() {
    if (state.phase !== 'playing') return;
    state.phase = 'gameOver';
    window.SDAudio.playLose();
    const left = state.diffs.remaining();
    window.SDRender.showOverlay(
      'Waktu Habis!',
      'Sayang sekali — masih ada ' + left + ' perbedaan yang belum ketemu di ' + state.scene.name + '. Coba lagi, kamu pasti bisa.',
      'Skor: ' + state.score,
      'Coba Lagi &#8635; <kbd>R</kbd>'
    );
  }

  /** The overlay button (or R): advance, retry, or restart the whole game. */
  function onOverlayAction() {
    if (state.phase === 'levelComplete') {
      window.SDAudio.playClick();
      startLevel(state.levelIndex + 1);
    } else if (state.phase === 'gameOver') {
      window.SDAudio.playClick();
      startLevel(state.levelIndex);
    } else if (state.phase === 'win') {
      window.SDAudio.playClick();
      state.score = 0;
      startLevel(0);
    }
  }

  /** M toggles sound; the button label follows. */
  function onToggleSound() {
    const muted = window.SDAudio.toggleMute();
    document.getElementById('btn-sound').innerHTML = muted
      ? '&#128263; Suara Mati <kbd>M</kbd>'
      : '&#128266; Suara <kbd>M</kbd>';
    if (!muted) window.SDAudio.playClick();
  }

  function totalDiffs() {
    let n = 0;
    for (const s of SCENES) n += s.diffs.length;
    return n;
  }

  /** Boot: grab elements, bind input, start level one. */
  function boot() {
    window.SDRender.init();
    window.SDInput.bindInput({
      onPanelClick: onPanelClick,
      onHint: onHint,
      onToggleSound: onToggleSound,
      onRestartLevel: function () {
        if (state.phase === 'playing' || state.phase === 'gameOver') {
          window.SDAudio.playClick();
          startLevel(state.levelIndex);
        }
      },
      onOverlayAction: onOverlayAction,
      onFirstGesture: function () { window.SDAudio.unlock(); },
    });
    startLevel(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* A small handle for automated play-testing (screenshots): the current
     state and the scenes, so a script can click real differences. */
  window.SpotDiff = {
    get state() { return state; },
    get scenes() { return SCENES; },
  };
})();
