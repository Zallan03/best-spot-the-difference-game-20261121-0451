/* render.js — paints both panels and the HUD. One frame draws a scene's
   base plus its differences (left version on the left panel, right version
   on the right), then the found markers, the hint pulse and wrong-click
   crosses on top. Also owns the overlay cards and the timer bar. */
(function () {
  'use strict';

  const W = 560;
  const H = 420;

  let leftCtx = null;
  let rightCtx = null;
  let els = null;

  /** Grab the canvases and HUD elements once the page is ready. */
  function init() {
    const left = document.getElementById('panel-left');
    const right = document.getElementById('panel-right');
    leftCtx = left.getContext('2d');
    rightCtx = right.getContext('2d');
    els = {
      level: document.getElementById('hud-level'),
      remaining: document.getElementById('hud-remaining'),
      timeText: document.getElementById('hud-time-text'),
      timerFill: document.getElementById('hud-timer-fill'),
      score: document.getElementById('hud-score'),
      hints: document.getElementById('hud-hints'),
      hintCount: document.getElementById('hint-count'),
      sceneName: document.getElementById('scene-name'),
      sceneHint: document.getElementById('scene-hint'),
      toast: document.getElementById('toast'),
      overlay: document.getElementById('overlay'),
      overlayTitle: document.getElementById('overlay-title'),
      overlayBody: document.getElementById('overlay-body'),
      overlayScore: document.getElementById('overlay-score'),
      overlayBtn: document.getElementById('overlay-btn'),
      btnHint: document.getElementById('btn-hint'),
      btnSound: document.getElementById('btn-sound'),
    };
    return els;
  }

  /** Draw one panel: base, then that side's version of every difference. */
  function drawPanel(ctx, scene, side) {
    ctx.clearRect(0, 0, W, H);
    scene.drawBase(ctx);
    for (const d of scene.diffs) {
      if (side === 'left') d.drawLeft(ctx);
      else d.drawRight(ctx);
    }
  }

  /** A satisfying found marker: green ring, glow and a check mark. */
  function drawFoundMarker(ctx, diff, ageMs) {
    const pop = Math.min(1, ageMs / 180);
    const r = diff.r * (0.7 + 0.3 * pop);
    const C = window.SDCanvas;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#16a34a';
    ctx.fill();
    ctx.restore();
    C.ring(ctx, diff.x, diff.y, r, '#16a34a', 4);
    ctx.beginPath();
    ctx.moveTo(diff.x - r * 0.45, diff.y);
    ctx.lineTo(diff.x - r * 0.12, diff.y + r * 0.38);
    ctx.lineTo(diff.x + r * 0.5, diff.y - r * 0.38);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#15803d';
    ctx.stroke();
  }

  /** A red X that fades out over 600 ms at a wrong click. */
  function drawWrongMark(ctx, mark, now) {
    const age = now - mark.at;
    if (age > 600) return;
    const alpha = 1 - age / 600;
    const s = 12 + age / 40;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(mark.x - s, mark.y - s);
    ctx.lineTo(mark.x + s, mark.y + s);
    ctx.moveTo(mark.x + s, mark.y - s);
    ctx.lineTo(mark.x - s, mark.y + s);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();
    ctx.restore();
  }

  /** A pulsing yellow ring around the hinted difference on both panels. */
  function drawHintRing(ctx, diff, now) {
    const pulse = 1 + 0.12 * Math.sin(now / 130);
    ctx.save();
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, (diff.r + 6) * pulse, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 7]);
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();
    ctx.restore();
  }

  /** One full repaint of both panels from the current game state. */
  function renderFrame(scene, diffs, effects) {
    const now = Date.now();
    drawPanel(leftCtx, scene, 'left');
    drawPanel(rightCtx, scene, 'right');
    for (const d of diffs.list()) {
      if (d.found) {
        drawFoundMarker(leftCtx, d, now - d.foundAt);
        drawFoundMarker(rightCtx, d, now - d.foundAt);
      }
    }
    if (effects.hintTarget && now - effects.hintAt < 3000) {
      drawHintRing(leftCtx, effects.hintTarget, now);
      drawHintRing(rightCtx, effects.hintTarget, now);
    }
    for (const m of effects.wrongMarks) {
      drawWrongMark(leftCtx, m, now);
      drawWrongMark(rightCtx, m, now);
    }
  }

  /** Refresh the HUD numbers and the timer bar. */
  function updateHud(state) {
    els.level.textContent = state.levelIndex + 1 + ' / ' + state.totalLevels;
    els.remaining.textContent = state.remaining;
    els.score.textContent = state.score;
    els.hints.textContent = state.hintsLeft;
    els.hintCount.textContent = '(' + state.hintsLeft + ')';
    els.sceneName.textContent = state.scene.name;
    els.sceneHint.textContent = state.scene.subtitle;
    els.btnHint.disabled = state.hintsLeft <= 0 || state.phase !== 'playing';
  }

  /** Update the timer text and bar; `fraction` is remaining / total. */
  function updateTimer(remainingSeconds, fraction) {
    els.timeText.textContent = window.SDTimer.formatTime(remainingSeconds);
    const fill = els.timerFill;
    fill.style.width = Math.max(0, fraction * 100) + '%';
    fill.classList.toggle('low', fraction < 0.2);
    fill.classList.toggle('mid', fraction >= 0.2 && fraction < 0.45);
  }

  /** A one-line message under the panels (good = green, bad = red). */
  function toast(message, kind) {
    els.toast.textContent = message;
    els.toast.className = 'toast' + (kind ? ' ' + kind : '');
  }

  /** Show the overlay card; `buttonLabel` is the action button's text. */
  function showOverlay(title, body, scoreLine, buttonLabel) {
    els.overlayTitle.textContent = title;
    els.overlayBody.textContent = body;
    els.overlayScore.textContent = scoreLine;
    els.overlayBtn.innerHTML = buttonLabel;
    els.overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    els.overlay.classList.add('hidden');
  }

  function isOverlayOpen() {
    return !els.overlay.classList.contains('hidden');
  }

  window.SDRender = {
    init, renderFrame, updateHud, updateTimer, toast,
    showOverlay, hideOverlay, isOverlayOpen,
  };
})();
