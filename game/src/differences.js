/* differences.js — the state of one level's hidden differences: which are
   found, hit-testing a click against them, and picking a hint target.
   Coordinates are in scene space (560 x 420), shared by both panels. */
(function () {
  'use strict';

  /** Create state for a level from its difference list (scene.diffs). */
  function createDifferences(diffList) {
    const diffs = diffList.map(function (d, i) {
      return {
        index: i,
        id: d.id,
        name: d.name,
        x: d.x,
        y: d.y,
        r: d.r,
        found: false,
        foundAt: 0,
      };
    });

    /** The difference whose circle contains (x, y), or null. Nearest wins. */
    function hitTest(x, y) {
      let best = null;
      let bestDist = Infinity;
      for (const d of diffs) {
        const dx = x - d.x;
        const dy = y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= d.r && dist < bestDist) {
          best = d;
          bestDist = dist;
        }
      }
      return best;
    }

    /** Mark a difference found; returns true when it was still unfound. */
    function markFound(diff) {
      if (!diff || diff.found) return false;
      diff.found = true;
      diff.foundAt = Date.now();
      return true;
    }

    /** How many differences are still unfound. */
    function remaining() {
      let n = 0;
      for (const d of diffs) if (!d.found) n++;
      return n;
    }

    function foundCount() {
      return diffs.length - remaining();
    }

    function total() {
      return diffs.length;
    }

    function allFound() {
      return remaining() === 0;
    }

    /** The unfound differences, in scene order. */
    function unfound() {
      return diffs.filter(function (d) { return !d.found; });
    }

    /** A random unfound difference for the hint, or null when none remain. */
    function pickHintTarget() {
      const open = unfound();
      if (open.length === 0) return null;
      return open[Math.floor(Math.random() * open.length)];
    }

    function list() {
      return diffs;
    }

    return { hitTest, markFound, remaining, foundCount, total, allFound, unfound, pickHintTarget, list };
  }

  window.SDDifferences = { createDifferences };
})();
