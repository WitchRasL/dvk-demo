// Вежливый клиент для dvk-style.ru: robots.txt, пауза 0,5–1 с между любыми запросами, дисковый кэш.
// Кэш HTML и оригиналов фото — scripts/collect/.cache/ (в .gitignore).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAllowed, parseRobots } from './robots.mjs';

export const CACHE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '.cache');
export const USER_AGENT = 'Mozilla/5.0 (compatible; dvk-style-redesign-collector/1.0; concept prototype for DVK Style)';

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function cacheKey(url) {
  const { hostname, pathname } = new URL(url);
  const slug = `${hostname}${pathname}`.replace(/[^a-z0-9._-]+/gi, '_').slice(0, 80);
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 10);
  return `${slug}-${hash}`;
}

/**
 * @param {{ cacheDir?: string, minDelayMs?: number, maxDelayMs?: number, log?: (msg: string) => void }} [options]
 */
export function createPoliteClient({ cacheDir = CACHE_DIR, minDelayMs = 500, maxDelayMs = 1000, log = () => {} } = {}) {
  const robotsByOrigin = new Map();
  let lastRequestAt = 0;
  let requests = 0;

  async function pause() {
    const wait = minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < wait) await sleep(wait - elapsed);
  }

  async function rawFetch(url) {
    await pause();
    try {
      requests += 1;
      log(`GET ${url}`);
      return await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: '*/*' }, redirect: 'follow' });
    } finally {
      lastRequestAt = Date.now();
    }
  }

  async function robotsFor(url) {
    const { origin } = new URL(url);
    if (!robotsByOrigin.has(origin)) {
      const file = join(cacheDir, 'robots', `${cacheKey(`${origin}/robots.txt`)}.txt`);
      let text = '';
      if (existsSync(file)) {
        text = readFileSync(file, 'utf8');
      } else {
        const response = await rawFetch(`${origin}/robots.txt`);
        text = response.ok ? await response.text() : '';
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, text);
      }
      robotsByOrigin.set(origin, parseRobots(text, 'dvk-style-redesign-collector'));
    }
    return robotsByOrigin.get(origin);
  }

  async function assertAllowed(url) {
    const rules = await robotsFor(url);
    if (!isAllowed(rules, url)) throw new Error(`robots.txt запрещает ${url}`);
  }

  /** HTML-страница: из кэша или с паузой из сети. */
  async function getText(url) {
    await assertAllowed(url);
    const file = join(cacheDir, 'html', `${cacheKey(url)}.html`);
    if (existsSync(file)) return readFileSync(file, 'utf8');
    const response = await rawFetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
    const text = await response.text();
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
    return text;
  }

  /** Двоичный файл (оригинал фото): из кэша или с паузой из сети. */
  async function getBuffer(url) {
    await assertAllowed(url);
    const file = join(cacheDir, 'files', cacheKey(url));
    if (existsSync(file)) return readFileSync(file);
    const response = await rawFetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, buffer);
    return buffer;
  }

  return { getText, getBuffer, isAllowedUrl: async (url) => isAllowed(await robotsFor(url), url), stats: () => ({ requests }) };
}
