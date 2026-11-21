# Cari Perbedaan — Dua Panel, Satu Mata Jeli

[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![make.fun rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Zallan03/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![make.fun reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Zallan03/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

Entry untuk [kompetisi best-spot-the-difference-game-20261121-0451 di make.fun](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451): game cari perbedaan orisinal yang jalan penuh offline di desktop browser, dari file statis.

## Cara main

- Dua gambar nyaris identik berdampingan — **Panel Kiri (asli)** dan **Panel Kanan (ada bedanya)**.
- Klik perbedaan di panel mana pun. Temuan ditandai cincin hijau + centang di kedua panel.
- HUD menunjukkan **sisa perbedaan**, **timer**, **skor**, dan **hint**.
- Klik yang salah: −2 detik dan −10 poin. Hint (tombol atau `H`): menunjukkan satu perbedaan selama 3 detik, −25 poin, cooldown 8 detik, 3 hint per level.
- Keyboard: `H` hint, `R` lanjut / coba lagi, `M` suara hidup-mati, `U` ulangi level.

## Level (kesulitan naik)

1. **Dapur Pagi** — 5 perbedaan, 120 detik. Sarapan di dapur yang hangat.
2. **Pasar Malam** — 7 perbedaan, 150 detik. Lampion, pedagang sate, dan langit malam.
3. **Stasiun Orbit Cakra** — 9 perbedaan, 180 detik. Planet bercincin, astronot, dan robot di orbit.

Tiap level selesai memberi bonus waktu (+5 poin per detik tersisa). Selesaikan ketiganya untuk layar kemenangan.

## Teknologi

- Semua gambar digambar prosedural dengan Canvas 2D — tanpa file gambar, tanpa aset luar.
- Semua suara disintesis dengan WebAudio (oscillator) — tanpa file audio.
- Tanpa jaringan sama sekali: buka `game/index.html` lewat server statis apa pun dan mainkan.
- Struktur kode (satu tugas jelas per file):
  - `game/src/scenes.js` — tiga scene orisinal + definisi perbedaannya
  - `game/src/differences.js` — state perbedaan, hit-test, dan hint
  - `game/src/render.js` — gambar panel, marker, HUD, dan overlay
  - `game/src/input.js` — klik mouse dan keyboard
  - `game/src/timer.js` — countdown per level
  - `game/src/audio.js` — efek suara WebAudio
  - `game/src/canvas.js` — helper menggambar
  - `game/src/main.js` — alur game, skor, dan level
- `main.ts` (Node stdlib only) menyalin `game/` + `screenshots/` ke output dan menulis `dossier.json` via `vendor/makefun-game.ts`.

## Menjalankan

```sh
# mainkan gamenya
npx serve game   # atau: python3 -m http.server --directory game 8080

# bangun output (seperti yang dilakukan grader)
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Lisensi: MIT.

## Screenshot

Empat render asli game ini ada di `screenshots/` (diambil dengan Playwright headless Chromium sambil memainkan game): `1-dapur-tengah.jpg` adalah cover — tengah permainan level 1 dengan tiga perbedaan sudah ditandai dan dua masih dicari.
