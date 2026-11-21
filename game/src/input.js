/* input.js — mouse and keyboard input. Clicks on either panel are mapped
   into scene coordinates (560 x 420) and handed to the game; keys are H
   hint, R continue, M mute, U restart level. */
(function () {
  'use strict';

  /** Convert a pointer event on a canvas to scene coordinates. */
  function toSceneCoords(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (560 / rect.width);
    const y = (event.clientY - rect.top) * (420 / rect.height);
    return { x, y };
  }

  /** Wire both panels and the keyboard to the game's callbacks. */
  function bindInput(callbacks) {
    const left = document.getElementById('panel-left');
    const right = document.getElementById('panel-right');

    function onPanelClick(canvas) {
      return function (event) {
        const p = toSceneCoords(canvas, event);
        callbacks.onPanelClick(p.x, p.y, canvas === left ? 'left' : 'right');
      };
    }
    left.addEventListener('click', onPanelClick(left));
    right.addEventListener('click', onPanelClick(right));
    // A right-click menu would break the hunt's flow; the game needs no menu.
    left.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    right.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    document.getElementById('btn-hint').addEventListener('click', function () {
      callbacks.onHint();
    });
    document.getElementById('btn-sound').addEventListener('click', function () {
      callbacks.onToggleSound();
    });
    document.getElementById('btn-restart').addEventListener('click', function () {
      callbacks.onRestartLevel();
    });
    document.getElementById('overlay-btn').addEventListener('click', function () {
      callbacks.onOverlayAction();
    });

    document.addEventListener('keydown', function (event) {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === 'h') callbacks.onHint();
      else if (key === 'r') callbacks.onOverlayAction();
      else if (key === 'm') callbacks.onToggleSound();
      else if (key === 'u') callbacks.onRestartLevel();
    });

    // Unlock WebAudio on the first gesture anywhere.
    function unlockOnce() {
      callbacks.onFirstGesture();
      document.removeEventListener('pointerdown', unlockOnce);
      document.removeEventListener('keydown', unlockOnce);
    }
    document.addEventListener('pointerdown', unlockOnce);
    document.addEventListener('keydown', unlockOnce);
  }

  window.SDInput = { bindInput, toSceneCoords };
})();
