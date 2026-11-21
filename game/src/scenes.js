/* scenes.js — the three original scenes. Each scene is drawn procedurally
   on canvas (no images): drawBase paints everything identical in both
   panels, and each difference paints its own element twice — once as it
   appears on the left panel (drawLeft) and once as it differs on the right
   (drawRight). Scene space is 560 x 420 for both panels. */
(function () {
  'use strict';

  const C = window.SDCanvas;

  // ---------------------------------------------------------- helpers

  /** A simple clock face (frame + ticks); the hands are a difference. */
  function clockFace(ctx, x, y, r) {
    C.circle(ctx, x, y, r, '#ffffff');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#22303c';
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const x1 = x + Math.cos(a) * (r - 5);
      const y1 = y + Math.sin(a) * (r - 5);
      const x2 = x + Math.cos(a) * (r - 11);
      const y2 = y + Math.sin(a) * (r - 11);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = i % 3 === 0 ? 3 : 1;
      ctx.strokeStyle = '#22303c';
      ctx.stroke();
    }
    C.circle(ctx, x, y, 3, '#22303c');
  }

  /** Clock hands pointing at `hour` and `minute` (o'clock positions). */
  function clockHands(ctx, x, y, r, hour, minute) {
    const ha = ((hour % 12) / 12) * Math.PI * 2 - Math.PI / 2;
    const ma = (minute / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ha) * r * 0.5, y + Math.sin(ha) * r * 0.5);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#22303c';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ma) * r * 0.78, y + Math.sin(ma) * r * 0.78);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#22303c';
    ctx.stroke();
  }

  /** A sitting cat silhouette, facing right. */
  function cat(ctx, x, y, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, 16 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 4 * s, y - 24 * s, 11 * s, 0, Math.PI * 2);
    ctx.fill();
    C.poly(ctx, [[x - 4 * s, y - 30 * s], [x - 1 * s, y - 40 * s], [x + 2 * s, y - 30 * s]], color);
    C.poly(ctx, [[x + 8 * s, y - 31 * s], [x + 12 * s, y - 41 * s], [x + 15 * s, y - 30 * s]], color);
    ctx.beginPath();
    ctx.moveTo(x + 14 * s, y + 8 * s);
    ctx.quadraticCurveTo(x + 30 * s, y - 2 * s, x + 26 * s, y - 22 * s);
    ctx.lineWidth = 4 * s;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  /** Steam curls above a kettle. */
  function steam(ctx, x, y) {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 10, y + 12);
      ctx.bezierCurveTo(x + i * 10 - 6, y, x + i * 10 + 6, y - 8, x + i * 10, y - 18);
      ctx.stroke();
    }
  }

  /** A mug with a handle. */
  function mug(ctx, x, y, color) {
    C.rr(ctx, x - 14, y - 14, 28, 28, 4);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 16, y, 8, -Math.PI / 2, Math.PI / 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y - 14, 12, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6b4a2f';
    ctx.fill();
  }

  /** A bowl with `n` apples. */
  function fruitBowl(ctx, x, y, n) {
    ctx.beginPath();
    ctx.ellipse(x, y, 34, 12, 0, 0, Math.PI);
    ctx.fillStyle = '#2f6db3';
    ctx.fill();
    ctx.fillRect(x - 34, y - 2, 68, 4);
    const spots = [[-16, -12], [0, -16], [16, -12]];
    for (let i = 0; i < n; i++) {
      const s = spots[i];
      C.circle(ctx, x + s[0], y + s[1], 10, '#e23b3b');
      ctx.beginPath();
      ctx.moveTo(x + s[0], y + s[1] - 10);
      ctx.lineTo(x + s[0] + 5, y + s[1] - 15);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3f7d2c';
      ctx.stroke();
    }
  }

  /** A paper lantern (round, with ribs). */
  function lantern(ctx, x, y, r, color) {
    C.circle(ctx, x, y, r, color);
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.55, r, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y - r - 10);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#5b4636';
    ctx.stroke();
    C.glow(ctx, x, y, r + 14, color, 0.25);
  }

  /** A bunch of `n` balloons tied at (x, y). */
  function balloons(ctx, x, y, n) {
    const cols = ['#e0653a', '#f59e0b', '#0f766e'];
    const offs = [[-18, -38], [0, -46], [18, -38]];
    for (let i = 0; i < n; i++) {
      const o = offs[i];
      ctx.beginPath();
      ctx.ellipse(x + o[0], y + o[1], 13, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = cols[i];
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + o[0], y + o[1] + 15);
      ctx.quadraticCurveTo(x + o[0] / 2, y - 8, x, y);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#5b4636';
      ctx.stroke();
    }
    C.circle(ctx, x, y, 3, '#5b4636');
  }

  /** A night-market vendor: body, head, apron; hat is a difference. */
  function vendor(ctx, x, y) {
    C.rr(ctx, x - 26, y - 10, 52, 70, 10);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    C.rr(ctx, x - 18, y + 6, 36, 44, 6);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();
    C.circle(ctx, x, y - 26, 18, '#f2c89b');
    C.circle(ctx, x - 6, y - 28, 2.5, '#22303c');
    C.circle(ctx, x + 6, y - 28, 2.5, '#22303c');
    ctx.beginPath();
    ctx.arc(x, y - 20, 6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#22303c';
    ctx.stroke();
  }

  /** A straw hat on the vendor. */
  function strawHat(ctx, x, y) {
    ctx.beginPath();
    ctx.ellipse(x, y - 40, 26, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y - 42, 12, Math.PI, 0);
    ctx.fillStyle = '#eab308';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y - 40, 13, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#b45309';
    ctx.fill();
  }

  /** A crate of `n` oranges. */
  function orangeCrate(ctx, x, y, n) {
    C.rr(ctx, x - 40, y - 6, 80, 30, 4);
    ctx.fillStyle = '#8b5a2b';
    ctx.fill();
    ctx.fillStyle = '#a06a35';
    ctx.fillRect(x - 40, y + 4, 80, 4);
    const spots = [[-28, -12], [-10, -16], [8, -14], [26, -11], [-19, -20]];
    for (let i = 0; i < n; i++) {
      const s = spots[i];
      C.circle(ctx, x + s[0], y + s[1], 9, '#f97316');
      C.circle(ctx, x + s[0] - 3, y + s[1] - 3, 2.5, '#fdba74');
    }
  }

  /** An astronaut floating, patch is a difference. */
  function astronaut(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.12);
    C.rr(ctx, -20, -18, 40, 52, 14);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -32, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -32, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#0ea5e9';
    ctx.fill();
    C.rr(ctx, -34, -12, 12, 30, 6);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    C.rr(ctx, 22, -12, 12, 30, 6);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    C.rr(ctx, -16, 34, 13, 26, 6);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    C.rr(ctx, 3, 34, 13, 26, 6);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.restore();
  }

  /** A small robot with an antenna light (colour is a difference). */
  function robot(ctx, x, y) {
    C.rr(ctx, x - 22, y - 6, 44, 54, 8);
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    C.rr(ctx, x - 14, y + 8, 28, 18, 4);
    ctx.fillStyle = '#334155';
    ctx.fill();
    C.circle(ctx, x - 7, y + 17, 3, '#22c55e');
    C.circle(ctx, x + 7, y + 17, 3, '#eab308');
    C.rr(ctx, x - 18, y - 34, 36, 28, 8);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
    C.circle(ctx, x - 8, y - 20, 4, '#0f172a');
    C.circle(ctx, x + 8, y - 20, 4, '#0f172a');
    ctx.beginPath();
    ctx.moveTo(x, y - 34);
    ctx.lineTo(x, y - 46);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#64748b';
    ctx.stroke();
  }

  /** A potted plant with `n` leaves. */
  function plant(ctx, x, y, n) {
    C.poly(ctx, [[x - 12, y], [x + 12, y], [x + 8, y + 16], [x - 8, y + 16]], '#b45309');
    const leaves = [[-8, -14], [0, -20], [8, -14]];
    for (let i = 0; i < n; i++) {
      const l = leaves[i];
      ctx.beginPath();
      ctx.ellipse(x + l[0], y + l[1], 5, 13, l[0] * 0.03, 0, Math.PI * 2);
      ctx.fillStyle = '#16a34a';
      ctx.fill();
    }
  }

  // ---------------------------------------------------------- scene 1: kitchen

  const kitchen = {
    id: 'dapur-pagi',
    name: 'Dapur Pagi',
    subtitle: 'Sarapan sudah siap — tapi ada yang berubah di dapur ini.',
    timeLimit: 120,
    drawBase: function (ctx) {
      C.rect(ctx, 0, 0, 560, 300, '#f7e8c8');
      C.rect(ctx, 0, 300, 560, 120, '#b08954');
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, 318 + i * 20, 560, 2);
      }
      // Window with sun, hills and curtains.
      C.rr(ctx, 28, 38, 146, 146, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      C.rect(ctx, 38, 48, 126, 126, '#9fd8f0');
      C.circle(ctx, 78, 84, 22, '#ffd93b');
      C.glow(ctx, 78, 84, 44, '#ffd93b', 0.5);
      C.poly(ctx, [[38, 174], [90, 138], [150, 174], [164, 174], [38, 174]], '#7cb342');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(96, 48, 10, 126);
      ctx.fillRect(38, 106, 126, 10);
      C.rect(ctx, 24, 34, 18, 154, '#e0653a');
      C.rect(ctx, 160, 34, 18, 154, '#e0653a');
      C.rect(ctx, 24, 184, 154, 10, '#ffffff');
      // Wall clock frame (hands are a difference).
      clockFace(ctx, 430, 80, 32);
      // Shelf with jars.
      C.rect(ctx, 330, 192, 200, 10, '#8b5a2b');
      C.rr(ctx, 348, 164, 26, 28, 4); ctx.fillStyle = '#f59e0b'; ctx.fill();
      C.rr(ctx, 392, 160, 26, 32, 4); ctx.fillStyle = '#0f766e'; ctx.fill();
      C.rr(ctx, 436, 166, 26, 26, 4); ctx.fillStyle = '#e0653a'; ctx.fill();
      // Counter, stove and kettle body (steam is a difference).
      C.rect(ctx, 300, 280, 240, 12, '#d9a066');
      C.rect(ctx, 300, 292, 240, 68, '#8b5a2b');
      C.rect(ctx, 300, 292, 240, 6, '#6b4a2f');
      C.rr(ctx, 380, 292, 160, 68, 4); ctx.fillStyle = '#6b7280'; ctx.fill();
      C.circle(ctx, 420, 320, 16, '#374151');
      C.circle(ctx, 500, 320, 16, '#374151');
      C.circle(ctx, 440, 262, 4, '#374151');
      ctx.beginPath();
      ctx.moveTo(416, 282);
      ctx.quadraticCurveTo(400, 250, 424, 238);
      ctx.quadraticCurveTo(452, 226, 470, 244);
      ctx.quadraticCurveTo(482, 260, 470, 282);
      ctx.closePath();
      ctx.fillStyle = '#475569';
      ctx.fill();
      C.rr(ctx, 466, 252, 18, 10, 5); ctx.fillStyle = '#475569'; ctx.fill();
      // Table, chair and rug (cat and apples are differences).
      C.rr(ctx, 40, 300, 240, 14, 4); ctx.fillStyle = '#a16207'; ctx.fill();
      C.rect(ctx, 58, 314, 12, 76, '#7c4a03');
      C.rect(ctx, 250, 314, 12, 76, '#7c4a03');
      C.rect(ctx, 66, 296, 10, 34, '#7c4a03');
      C.rect(ctx, 66, 296, 84, 10, '#7c4a03');
      C.rect(ctx, 140, 306, 10, 34, '#7c4a03');
      C.rect(ctx, 66, 330, 84, 12, '#a16207');
      C.rect(ctx, 70, 342, 10, 48, '#7c4a03');
      C.rect(ctx, 136, 342, 10, 48, '#7c4a03');
      ctx.beginPath();
      ctx.ellipse(160, 398, 120, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e0653a';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(160, 398, 84, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      // Plant on the windowsill.
      plant(ctx, 196, 168, 3);
    },
    diffs: [
      {
        id: 'jam', name: 'Jarum jam berubah', x: 430, y: 80, r: 34,
        drawLeft: function (ctx) { clockHands(ctx, 430, 80, 32, 7, 0); },
        drawRight: function (ctx) { clockHands(ctx, 430, 80, 32, 9, 30); },
      },
      {
        id: 'kucing', name: 'Kucing di kursi hilang', x: 110, y: 318, r: 36,
        drawLeft: function (ctx) { cat(ctx, 110, 322, 1, '#f97316'); },
        drawRight: function (ctx) { /* empty chair */ },
      },
      {
        id: 'cangkir', name: 'Warna cangkir berubah', x: 330, y: 266, r: 26,
        drawLeft: function (ctx) { mug(ctx, 330, 268, '#dc2626'); },
        drawRight: function (ctx) { mug(ctx, 330, 268, '#0d9488'); },
      },
      {
        id: 'apel', name: 'Satu apel hilang dari mangkuk', x: 160, y: 282, r: 30,
        drawLeft: function (ctx) { fruitBowl(ctx, 160, 292, 3); },
        drawRight: function (ctx) { fruitBowl(ctx, 160, 292, 2); },
      },
      {
        id: 'uap', name: 'Uap ketel menghilang', x: 440, y: 212, r: 28,
        drawLeft: function (ctx) { steam(ctx, 440, 214); },
        drawRight: function (ctx) { /* no steam */ },
      },
    ],
  };

  // ---------------------------------------------------------- scene 2: night market

  const nightMarket = {
    id: 'pasar-malam',
    name: 'Pasar Malam',
    subtitle: 'Lampion menyala, pedagang sibuk — tujuh hal diam-diam berubah.',
    timeLimit: 150,
    drawBase: function (ctx) {
      const sky = ctx.createLinearGradient(0, 0, 0, 260);
      sky.addColorStop(0, '#0b1026');
      sky.addColorStop(1, '#1e3a5f');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 560, 260);
      C.rect(ctx, 0, 260, 560, 160, '#3a2f2a');
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, 280 + i * 18, 560, 2);
      }
      // Stars.
      const stars = [[40, 30], [120, 70], [200, 26], [330, 40], [400, 80], [520, 120], [60, 120], [250, 90]];
      for (const s of stars) C.star(ctx, s[0], s[1], 5, 2, '#fef9c3');
      // String lights across the top (one bulb is a difference).
      ctx.beginPath();
      ctx.moveTo(0, 28);
      ctx.quadraticCurveTo(280, 78, 560, 34);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#111827';
      ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const x = t * 560;
        const y = 28 + 50 * t * (1 - t) * 2 + (t < 0.5 ? t * 12 : (1 - t) * 12);
        if (i === 4) continue; // the differing bulb
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 8);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#111827';
        ctx.stroke();
        C.circle(ctx, x, y + 14, 6, '#fde047');
        C.glow(ctx, x, y + 14, 18, '#fde047', 0.35);
      }
      // Left stall with striped awning and sign.
      C.poly(ctx, [[40, 150], [250, 150], [250, 186], [40, 186]], '#b91c1c');
      for (let i = 0; i < 6; i++) {
        C.poly(ctx, [[40 + i * 35, 150], [75 + i * 35, 150], [75 + i * 35, 186], [40 + i * 35, 186]], i % 2 === 0 ? '#fef2f2' : '#b91c1c');
      }
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(57 + i * 35, 186, 17, 0, Math.PI);
        ctx.fillStyle = i % 2 === 0 ? '#fef2f2' : '#b91c1c';
        ctx.fill();
      }
      C.rect(ctx, 52, 186, 186, 14, '#7f1d1d');
      C.rect(ctx, 52, 300, 186, 60, '#78350f');
      C.rect(ctx, 52, 300, 186, 10, '#92400e');
      C.rr(ctx, 64, 210, 162, 34, 6); ctx.fillStyle = '#fef3c7'; ctx.fill();
      C.label(ctx, 'SATE AYAM', 145, 228, 'bold 20px "Trebuchet MS", sans-serif', '#7f1d1d');
      // Right stall with teal awning.
      C.poly(ctx, [[310, 150], [520, 150], [520, 186], [310, 186]], '#0f766e');
      for (let i = 0; i < 6; i++) {
        C.poly(ctx, [[310 + i * 35, 150], [345 + i * 35, 150], [345 + i * 35, 186], [310 + i * 35, 186]], i % 2 === 0 ? '#ccfbf1' : '#0f766e');
      }
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(327 + i * 35, 186, 17, 0, Math.PI);
        ctx.fillStyle = i % 2 === 0 ? '#ccfbf1' : '#0f766e';
        ctx.fill();
      }
      C.rect(ctx, 322, 186, 186, 14, '#134e4a');
      C.rect(ctx, 322, 300, 186, 60, '#78350f');
      C.rect(ctx, 322, 300, 186, 10, '#92400e');
      C.rr(ctx, 334, 210, 162, 34, 6); ctx.fillStyle = '#fef3c7'; ctx.fill();
      C.label(ctx, 'ES CAMPUR', 415, 228, 'bold 19px "Trebuchet MS", sans-serif', '#134e4a');
      // Static teal lantern on the right stall.
      lantern(ctx, 430, 215, 20, '#14b8a6');
      // Bunting flags between the stalls.
      const flags = ['#e0653a', '#f59e0b', '#0f766e', '#3b82f6'];
      for (let i = 0; i < 8; i++) {
        const x = 250 + i * 10;
        const y = 196 + Math.sin(i * 0.9) * 4;
        C.poly(ctx, [[x, y], [x + 9, y], [x + 4.5, y + 12]], flags[i % 4]);
      }
      // Vendor (hat is a difference) and crates (cat and oranges are differences).
      vendor(ctx, 280, 300);
      C.rr(ctx, 380, 330, 70, 30, 4); ctx.fillStyle = '#8b5a2b'; ctx.fill();
      C.rr(ctx, 150, 372, 80, 22, 4); ctx.fillStyle = '#8b5a2b'; ctx.fill();
      C.rr(ctx, 380, 372, 70, 22, 4); ctx.fillStyle = '#a06a35'; ctx.fill();
    },
    diffs: [
      {
        id: 'bulan', name: 'Bulan purnama jadi sabit', x: 480, y: 55, r: 32,
        drawLeft: function (ctx) {
          C.circle(ctx, 480, 55, 26, '#fef9c3');
          C.glow(ctx, 480, 55, 48, '#fef9c3', 0.4);
        },
        drawRight: function (ctx) {
          C.circle(ctx, 480, 55, 26, '#fef9c3');
          C.circle(ctx, 492, 48, 22, '#1e3a5f');
          C.glow(ctx, 480, 55, 48, '#fef9c3', 0.25);
        },
      },
      {
        id: 'lampion', name: 'Warna lampion berubah', x: 110, y: 215, r: 26,
        drawLeft: function (ctx) { lantern(ctx, 110, 215, 20, '#dc2626'); },
        drawRight: function (ctx) { lantern(ctx, 110, 215, 20, '#eab308'); },
      },
      {
        id: 'bohlam', name: 'Satu bohlam lampu mati', x: 280, y: 73, r: 18,
        drawLeft: function (ctx) {
          C.circle(ctx, 280, 73, 6, '#fde047');
          C.glow(ctx, 280, 73, 18, '#fde047', 0.35);
        },
        drawRight: function (ctx) { C.circle(ctx, 280, 73, 6, '#4b5563'); },
      },
      {
        id: 'balon', name: 'Satu balon hilang', x: 500, y: 185, r: 36,
        drawLeft: function (ctx) { balloons(ctx, 500, 200, 3); },
        drawRight: function (ctx) { balloons(ctx, 500, 200, 2); },
      },
      {
        id: 'topi', name: 'Topi pedagang hilang', x: 280, y: 262, r: 28,
        drawLeft: function (ctx) { strawHat(ctx, 280, 300); },
        drawRight: function (ctx) { /* bare head */ },
      },
      {
        id: 'jeruk', name: 'Satu jeruk hilang dari peti', x: 190, y: 350, r: 30,
        drawLeft: function (ctx) { orangeCrate(ctx, 190, 352, 5); },
        drawRight: function (ctx) { orangeCrate(ctx, 190, 352, 4); },
      },
      {
        id: 'kucing-peti', name: 'Kucing di atas peti hilang', x: 430, y: 338, r: 30,
        drawLeft: function (ctx) { cat(ctx, 428, 336, 0.85, '#1f2937'); },
        drawRight: function (ctx) { /* empty crate top */ },
      },
    ],
  };

  // ---------------------------------------------------------- scene 3: space station

  const spaceStation = {
    id: 'stasiun-orbit',
    name: 'Stasiun Orbit Cakra',
    subtitle: 'Di orbit, sembilan hal kecil berubah — mata yang tajam yang menang.',
    timeLimit: 180,
    drawBase: function (ctx) {
      C.rect(ctx, 0, 0, 560, 420, '#1f2a3a');
      C.rect(ctx, 0, 380, 560, 40, '#141c28');
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 140, 0);
        ctx.lineTo(i * 140, 380);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, 190);
      ctx.lineTo(560, 190);
      ctx.stroke();
      // Pipes on the right wall.
      C.rect(ctx, 516, 0, 14, 380, '#475569');
      C.rect(ctx, 536, 0, 10, 380, '#334155');
      // Big round window with the planet (ring is a difference).
      C.circle(ctx, 280, 135, 102, '#0f172a');
      ctx.beginPath();
      ctx.arc(280, 135, 102, 0, Math.PI * 2);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();
      const space = ctx.createRadialGradient(250, 100, 10, 280, 135, 100);
      space.addColorStop(0, '#1e3a5f');
      space.addColorStop(1, '#020617');
      ctx.beginPath();
      ctx.arc(280, 135, 94, 0, Math.PI * 2);
      ctx.fillStyle = space;
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(280, 135, 94, 0, Math.PI * 2);
      ctx.clip();
      C.star(ctx, 220, 80, 4, 2, '#ffffff');
      C.star(ctx, 330, 70, 3, 1.5, '#ffffff');
      C.star(ctx, 350, 170, 4, 2, '#fef9c3');
      C.star(ctx, 210, 170, 3, 1.5, '#ffffff');
      C.circle(ctx, 280, 140, 52, '#c96f4a');
      ctx.beginPath();
      ctx.ellipse(280, 128, 52, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(280, 156, 52, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fill();
      ctx.restore();
      // Astronaut (patch is a difference) and robot (antenna light is one).
      astronaut(ctx, 95, 232);
      robot(ctx, 472, 300);
      // Control console with screens and buttons.
      C.rr(ctx, 50, 300, 460, 80, 10);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(140, 335, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#64748b';
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * 0.75 + (i * Math.PI * 1.5) / 7;
        ctx.beginPath();
        ctx.moveTo(140 + Math.cos(a) * 20, 335 + Math.sin(a) * 20);
        ctx.lineTo(140 + Math.cos(a) * 24, 335 + Math.sin(a) * 24);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#334155';
        ctx.stroke();
      }
      C.rr(ctx, 200, 315, 160, 42, 6); ctx.fillStyle = '#164e63'; ctx.fill();
      C.rr(ctx, 380, 315, 110, 42, 6); ctx.fillStyle = '#164e63'; ctx.fill();
      const btnCols = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
      for (let i = 0; i < 5; i++) {
        C.circle(ctx, 392 + i * 18, 372, 6, btnCols[i]);
      }
      C.label(ctx, 'CAKRA-1', 280, 372, 'bold 13px "Trebuchet MS", sans-serif', '#67e8f9');
      // The console plant (pot + leaves) is a difference, drawn by the diff.
    },
    diffs: [
      {
        id: 'cincin', name: 'Cincin planet menghilang', x: 280, y: 135, r: 60,
        drawLeft: function (ctx) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(280, 135, 94, 0, Math.PI * 2);
          ctx.clip();
          ctx.beginPath();
          ctx.ellipse(280, 140, 78, 16, -0.18, 0, Math.PI * 2);
          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.restore();
        },
        drawRight: function (ctx) { /* no ring */ },
      },
      {
        id: 'bintang', name: 'Satu bintang ekstra muncul', x: 95, y: 75, r: 20,
        drawLeft: function (ctx) { /* empty sky */ },
        drawRight: function (ctx) { C.star(ctx, 95, 75, 7, 3, '#fef9c3'); },
      },
      {
        id: 'jarum', name: 'Jarum pengukur berputar', x: 140, y: 335, r: 28,
        drawLeft: function (ctx) {
          ctx.beginPath();
          ctx.moveTo(140, 335);
          ctx.lineTo(140 + Math.cos(-Math.PI * 0.75) * 20, 335 + Math.sin(-Math.PI * 0.75) * 20);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#dc2626';
          ctx.stroke();
        },
        drawRight: function (ctx) {
          ctx.beginPath();
          ctx.moveTo(140, 335);
          ctx.lineTo(140 + Math.cos(-Math.PI * 0.25) * 20, 335 + Math.sin(-Math.PI * 0.25) * 20);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#dc2626';
          ctx.stroke();
        },
      },
      {
        id: 'grafik', name: 'Grafik layar berubah', x: 280, y: 336, r: 34,
        drawLeft: function (ctx) {
          ctx.fillStyle = '#22d3ee';
          const bars = [12, 22, 16, 28, 20];
          for (let i = 0; i < 5; i++) {
            ctx.fillRect(214 + i * 26, 352 - bars[i], 16, bars[i]);
          }
        },
        drawRight: function (ctx) {
          ctx.beginPath();
          ctx.moveTo(212, 344);
          ctx.lineTo(238, 326);
          ctx.lineTo(264, 338);
          ctx.lineTo(290, 322);
          ctx.lineTo(316, 332);
          ctx.lineTo(344, 320);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#f472b6';
          ctx.stroke();
        },
      },
      {
        id: 'antena', name: 'Lampu antena robot berubah warna', x: 472, y: 250, r: 18,
        drawLeft: function (ctx) {
          C.circle(ctx, 472, 250, 6, '#ef4444');
          C.glow(ctx, 472, 250, 16, '#ef4444', 0.5);
        },
        drawRight: function (ctx) {
          C.circle(ctx, 472, 250, 6, '#22c55e');
          C.glow(ctx, 472, 250, 16, '#22c55e', 0.5);
        },
      },
      {
        id: 'lencana', name: 'Lencana astronot berubah bentuk', x: 95, y: 232, r: 26,
        drawLeft: function (ctx) { C.star(ctx, 95, 232, 8, 3.5, '#f59e0b'); },
        drawRight: function (ctx) { C.circle(ctx, 95, 232, 7, '#3b82f6'); },
      },
      {
        id: 'kopi', name: 'Cangkir kopi hilang dari konsol', x: 400, y: 290, r: 22,
        drawLeft: function (ctx) { mug(ctx, 400, 288, '#e0653a'); },
        drawRight: function (ctx) { /* no cup */ },
      },
      {
        id: 'daun', name: 'Satu daun tanaman hilang', x: 60, y: 282, r: 24,
        drawLeft: function (ctx) { plant(ctx, 60, 282, 3); },
        drawRight: function (ctx) { plant(ctx, 60, 282, 2); },
      },
      {
        id: 'katup', name: 'Katup pipa berputar', x: 525, y: 150, r: 24,
        drawLeft: function (ctx) {
          ctx.beginPath();
          ctx.moveTo(525, 132);
          ctx.lineTo(525, 168);
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#f59e0b';
          ctx.stroke();
          C.circle(ctx, 525, 150, 7, '#b45309');
        },
        drawRight: function (ctx) {
          ctx.beginPath();
          ctx.moveTo(507, 150);
          ctx.lineTo(543, 150);
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#f59e0b';
          ctx.stroke();
          C.circle(ctx, 525, 150, 7, '#b45309');
        },
      },
    ],
  };

  window.SDScenes = { scenes: [kitchen, nightMarket, spaceStation] };
})();
