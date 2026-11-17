#!/usr/bin/env node
// Скриншот страницы через puppeteer-core и установленный Chrome.
//   npm run shot -- <url> <out.png> [--width 1440] [--height 900 | 844 на ширине < 768] [--full] [--wait 600] [--reduced-motion]
// Chrome: переменная CHROME_PATH или стандартный путь установки.
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATHS = {
  win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: '/usr/bin/google-chrome',
};

function parseArgs(argv) {
  const options = { width: 1440, height: undefined, full: false, wait: 600, reducedMotion: false, positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--full') options.full = true;
    else if (arg === '--reduced-motion') options.reducedMotion = true;
    else if (arg === '--width') options.width = Number(argv[++i]);
    else if (arg === '--height') options.height = Number(argv[++i]);
    else if (arg === '--wait') options.wait = Number(argv[++i]);
    else options.positional.push(arg);
  }
  return options;
}

const options = parseArgs(process.argv.slice(2));
const [url, out] = options.positional;

if (!url || !out || !Number.isFinite(options.width) || options.width <= 0) {
  console.error('Использование: npm run shot -- <url> <out.png> [--width 1440] [--height 900] [--full] [--wait 600] [--reduced-motion]');
  process.exit(1);
}

const executablePath = process.env.CHROME_PATH || CHROME_PATHS[process.platform];
const outPath = resolve(out);
mkdirSync(dirname(outPath), { recursive: true });

const mobile = options.width < 768;
const height = Number.isFinite(options.height) && options.height > 0 ? options.height : mobile ? 844 : 900;

const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: options.width, height, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  if (options.reducedMotion) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  }
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((done) => setTimeout(done, options.wait));
  await page.screenshot({ path: outPath, fullPage: options.full });
  console.log(`Скриншот: ${outPath} (${options.width}×${height}${options.full ? ', вся страница' : ''})`);
} finally {
  await browser.close();
}
