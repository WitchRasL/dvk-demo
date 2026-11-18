import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { fetchImages, isOriginalSource } from './fetch-images.mjs';

describe('isOriginalSource', () => {
  it('пропускает только оригиналы dvk-style.ru из /upload/iblock/ и /upload/medialibrary/', () => {
    expect(isOriginalSource('https://dvk-style.ru/upload/iblock/595/qcsaev6chfse1rhj4bfu4n6qs4irsq56/витрина_1.jpg')).toBe(true);
    expect(isOriginalSource('https://dvk-style.ru/upload/medialibrary/451/451e13af5602b32834e854c9d5543b27.jpg')).toBe(true);
  });

  it('отклоняет миниатюры resize_cache, сжатые копии dev2fun и чужие адреса', () => {
    expect(isOriginalSource('https://dvk-style.ru/upload/resize_cache/iblock/595/x/500_375_1/витрина_1.jpg')).toBe(false);
    expect(isOriginalSource('https://dvk-style.ru/upload/dev2fun.imagecompress/webp/iblock/595/x/07395cb8.webp')).toBe(false);
    expect(isOriginalSource('https://example.com/upload/iblock/595/a.jpg')).toBe(false);
    expect(isOriginalSource('/upload/iblock/595/a.jpg')).toBe(false);
  });
});

describe('fetchImages', () => {
  let dir;
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));

  async function setup() {
    dir = mkdtempSync(join(tmpdir(), 'dvk-images-'));
    const jpeg = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: '#808080' } }).jpeg().toBuffer();
    const calls = [];
    const client = { getBuffer: async (url) => (calls.push(url), jpeg) };
    const dataFile = join(dir, 'products.json');
    writeFileSync(dataFile, JSON.stringify([{ slug: 'a', images: [{ base: 'images/products/a/1', alt: 'A', w: null, h: null }] }]));
    const jobs = [{ base: 'images/products/a/1', source: 'https://dvk-style.ru/upload/iblock/123/abc/a.jpg' }];
    return { calls, client, dataFile, jobs, publicDir: join(dir, 'public') };
  }

  it('пишет WebP 1600 и 800, манифест папки, общий манифест и размеры в JSON данных', async () => {
    const { calls, client, dataFile, jobs, publicDir } = await setup();
    await fetchImages({ jobs, publicDir, client, dataFiles: [dataFile] });

    expect(calls).toEqual(['https://dvk-style.ru/upload/iblock/123/abc/a.jpg']);
    const big = await sharp(readFileSync(join(publicDir, 'images/products/a/1-1600.webp'))).metadata();
    const small = await sharp(readFileSync(join(publicDir, 'images/products/a/1-800.webp'))).metadata();
    expect([big.format, big.width, big.height]).toEqual(['webp', 1600, 800]);
    expect([small.format, small.width, small.height]).toEqual(['webp', 800, 400]);

    const local = JSON.parse(readFileSync(join(publicDir, 'images/products/a/manifest.json'), 'utf8'));
    expect(local.files).toEqual([
      expect.objectContaining({ base: 'images/products/a/1', source: jobs[0].source, width: 1600, height: 800 }),
    ]);
    const summary = JSON.parse(readFileSync(join(publicDir, 'images/manifest.json'), 'utf8'));
    expect(summary.files.map((file) => [file.base, file.source])).toEqual([['images/products/a/1', jobs[0].source]]);

    const data = JSON.parse(readFileSync(dataFile, 'utf8'));
    expect(data[0].images[0]).toMatchObject({ w: 1600, h: 800 });
  });

  it('второй запуск ничего не качает, если файлы и источник те же', async () => {
    const { calls, client, dataFile, jobs, publicDir } = await setup();
    await fetchImages({ jobs, publicDir, client, dataFiles: [dataFile] });
    await fetchImages({ jobs, publicDir, client, dataFiles: [dataFile] });
    expect(calls).toHaveLength(1);
    expect(existsSync(join(publicDir, 'images/products/a/1-800.webp'))).toBe(true);
  });

  it('отказывается качать не-оригинал', async () => {
    const { client, dataFile, publicDir } = await setup();
    const jobs = [{ base: 'images/products/a/1', source: 'https://dvk-style.ru/upload/resize_cache/iblock/1/2/270_150_1/a.jpg' }];
    await expect(fetchImages({ jobs, publicDir, client, dataFiles: [dataFile] })).rejects.toThrow(/оригинал/);
  });
});
