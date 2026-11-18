#!/usr/bin/env node
// Фото с dvk-style.ru → public/images/<products|projects|company>/<slug>/<n>-{1600,800}.webp.
//   npm run fetch-images
// Список заданий — scripts/collect/image-jobs.json (его пишет scripts/collect/collect.mjs).
// Берёт только оригиналы /upload/iblock/… и /upload/medialibrary/… (не миниатюры resize_cache),
// пауза 0,5–1 с между запросами, robots.txt, кэш оригиналов в scripts/collect/.cache/.
// Уже сконвертированное с тем же источником не качает повторно. В конце проставляет w/h в src/data/*.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WIDTHS = [1600, 800];
const QUALITY = { 1600: 80, 800: 78 };

/** Оригинал на dvk-style.ru: /upload/iblock/… или /upload/medialibrary/…, без resize_cache и сжатых копий. */
export function isOriginalSource(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (
    parsed.protocol === 'https:' &&
    parsed.hostname === 'dvk-style.ru' &&
    /^\/upload\/(iblock|medialibrary)\//.test(decodeURI(parsed.pathname))
  );
}

const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback);
const writeJson = (file, value) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
const folderOf = (base) => base.split('/').slice(0, -1).join('/');

function patchDimensions(node, byBase) {
  if (Array.isArray(node)) return node.forEach((item) => patchDimensions(item, byBase));
  if (!node || typeof node !== 'object') return;
  if (typeof node.base === 'string' && byBase.has(node.base) && 'w' in node && 'h' in node) {
    const entry = byBase.get(node.base);
    node.w = entry.width;
    node.h = entry.height;
  }
  for (const value of Object.values(node)) patchDimensions(value, byBase);
}

/**
 * @param {{ jobs: { base: string, source: string }[], publicDir?: string,
 *   client: { getBuffer(url: string): Promise<Buffer> }, dataFiles?: string[], log?: (msg: string) => void }} options
 * @returns {Promise<{ downloaded: number, skipped: number, files: object[] }>}
 */
export async function fetchImages({ jobs, publicDir = join(ROOT, 'public'), client, dataFiles = [], log = () => {} }) {
  for (const job of jobs) {
    if (!isOriginalSource(job.source)) throw new Error(`не оригинал: ${job.source} (${job.base})`);
  }

  const folderManifests = new Map();
  const manifestFor = (folder) => {
    if (!folderManifests.has(folder)) {
      const existing = readJson(join(publicDir, folder, 'manifest.json'), { files: [] });
      folderManifests.set(folder, { previous: existing.files ?? [], files: [] });
    }
    return folderManifests.get(folder);
  };

  const files = [];
  let downloaded = 0;
  let skipped = 0;

  for (const job of jobs) {
    const folder = folderOf(job.base);
    const manifest = manifestFor(folder);
    const outputs = WIDTHS.map((width) => join(publicDir, `${job.base}-${width}.webp`));
    const previous = manifest.previous.find((entry) => entry.base === job.base && entry.source === job.source);

    let entry;
    if (previous && outputs.every((file) => existsSync(file))) {
      entry = previous;
      skipped += 1;
    } else {
      const original = await client.getBuffer(job.source);
      const meta = await sharp(original).metadata();
      mkdirSync(dirname(outputs[0]), { recursive: true });
      let largest = null;
      for (const [index, width] of WIDTHS.entries()) {
        const info = await sharp(original)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: QUALITY[width], effort: 5 })
          .toFile(outputs[index]);
        if (width === WIDTHS[0]) largest = info;
      }
      entry = {
        base: job.base,
        n: job.base.split('/').pop(),
        source: job.source,
        width: largest.width,
        height: largest.height,
        original: { width: meta.width, height: meta.height },
      };
      downloaded += 1;
      log(`${job.base} ← ${job.source} (${meta.width}×${meta.height})`);
    }
    manifest.files.push(entry);
    files.push(entry);
  }

  const generatedAt = new Date().toISOString().slice(0, 10);
  for (const [folder, manifest] of folderManifests) {
    writeJson(join(publicDir, folder, 'manifest.json'), { source: 'https://dvk-style.ru', generatedAt, files: manifest.files });
  }
  const sorted = [...files].sort((a, b) => a.base.localeCompare(b.base));
  writeJson(join(publicDir, 'images', 'manifest.json'), { source: 'https://dvk-style.ru', generatedAt, files: sorted });

  const byBase = new Map(files.map((entry) => [entry.base, entry]));
  for (const file of dataFiles) {
    if (!existsSync(file)) continue;
    const data = readJson(file);
    patchDimensions(data, byBase);
    writeJson(file, data);
  }

  return { downloaded, skipped, files };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { createPoliteClient } = await import('./collect/polite.mjs');
  const jobsFile = join(ROOT, 'scripts', 'collect', 'image-jobs.json');
  if (!existsSync(jobsFile)) {
    console.error('Нет scripts/collect/image-jobs.json — сначала node scripts/collect/collect.mjs');
    process.exit(1);
  }
  const jobs = readJson(jobsFile);
  const client = createPoliteClient({ log: (msg) => console.log(msg) });
  const dataFiles = ['categories', 'products', 'projects', 'company'].map((name) => join(ROOT, 'src', 'data', `${name}.json`));
  const result = await fetchImages({ jobs, client, dataFiles, log: (msg) => console.log(msg) });
  console.log(`Готово: скачано и сконвертировано ${result.downloaded}, уже было ${result.skipped}, сетевых запросов ${client.stats().requests}.`);
}
