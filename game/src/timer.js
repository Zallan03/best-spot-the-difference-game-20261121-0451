/* timer.js — the per-level countdown. Ticks four times a second so the
   timer bar moves smoothly; a wrong click subtracts seconds as a penalty.
   The timer never runs while an overlay is open. */
(function () {
  'use strict';

  /** Build a timer for `totalSeconds`. Callbacks: onTick(remaining, total), onExpire(). */
  function createTimer(totalSeconds, onTick, onExpire) {
    let remaining = totalSeconds;
    let total = totalSeconds;
    let intervalId = null;
    let lastWhole = Math.ceil(remaining);
    let running = false;

    function emitTick(force) {
      const whole = Math.ceil(remaining);
      if (force || whole !== lastWhole) {
        lastWhole = whole;
        if (onTick) onTick(Math.max(0, whole), total);
      }
    }

    function tick() {
      remaining -= 0.25;
      if (remaining <= 0) {
        remaining = 0;
        stop();
        emitTick(true);
        if (onExpire) onExpire();
        return;
      }
      emitTick(false);
    }

    function start() {
      stop();
      running = true;
      intervalId = setInterval(tick, 250);
      emitTick(true);
    }

    function stop() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      running = false;
    }

    /** Subtract seconds (wrong-click penalty); clamps at zero and may expire. */
    function subtract(seconds) {
      remaining -= seconds;
      if (remaining <= 0) {
        remaining = 0;
        stop();
        emitTick(true);
        if (onExpire) onExpire();
        return;
      }
      emitTick(true);
    }

    function getRemaining() {
      return Math.max(0, Math.ceil(remaining));
    }

    function getTotal() {
      return total;
    }

    /** Remaining time as a fraction of the total (1 at start, 0 at expiry). */
    function getFraction() {
      return total > 0 ? Math.max(0, remaining) / total : 0;
    }

    function isRunning() {
      return running;
    }

    /** Reset to a new length (used when a level restarts). */
    function reset(seconds) {
      stop();
      total = seconds;
      remaining = seconds;
      lastWhole = Math.ceil(remaining);
    }

    return { start, stop, subtract, getRemaining, getTotal, getFraction, isRunning, reset };
  }

  /** Format seconds as m:ss, e.g. 125 -> "2:05". */
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  window.SDTimer = { createTimer, formatTime };
})();
