// main.ts — the entrypoint: copies game/ and screenshots/ into the output
// directory and writes /output/dossier.json with buildDossier from the
// kit's vendor/makefun-game.ts. Node standard library only; no install,
// no network. Run it as: MAKEFUN_OUTPUT_DIR=out node main.ts
// The copy is a plain recursive copy, so running it twice writes the same
// bytes both times (buildDossier is deterministic for the same input).
import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const gameFiles = readdirSync(join(outDir, 'game'), { recursive: true }).length;
const shots = readdirSync(join(outDir, 'screenshots')).length;
console.log(`wrote ${outDir}/dossier.json (${dossier.length} bytes) from ${gameFiles} game entries and ${shots} screenshots`);
