#!/usr/bin/env node
// Генератор фикстуры для демо-страницы скролл-видео: poster.jpg и demo.webm (все кадры ключевые, 640×360, 3 с).
// Это синтетический «интерьер» из прямоугольников, а не настоящий ролик. Запуск (нужен установленный Chrome):
//   node tests/fixtures/scroll-video/generate.mjs
// Кадры рисуются на canvas и кодируются WebCodecs (VP8, каждый кадр — ключевой, как просит docs/hero-video/README.md),
// затем упаковываются в WebM с индексом (Cues), чтобы перемотка по скроллу работала так же, как на настоящем ролике.
import { writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const OUT_DIR = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const WIDTH = 640;
const HEIGHT = 360;
const FPS = 24;
const FRAMES = 72;

// ---- Кадры и кодирование внутри Chrome ----------------------------------------------------------

/* eslint-disable no-undef -- код ниже выполняется в браузере */
async function renderInBrowser({ width, height, fps, frames }) {
  const drawScene = (ctx, w, h, t) => {
    // Стена: цвет плавно меняется от тёплого к холодному вдоль ролика.
    const wall = ctx.createLinearGradient(0, 0, w, 0);
    wall.addColorStop(0, `hsl(${28 + t * 150} 28% ${30 + t * 8}%)`);
    wall.addColorStop(1, `hsl(${40 + t * 150} 22% ${18 + t * 6}%)`);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, w, h);
    // Пол.
    ctx.fillStyle = `hsl(${30 + t * 20} 12% 12%)`;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    // «Камера» едет вдоль витрин: смещение зависит от t.
    const shift = -t * w * 0.35;
    for (let i = 0; i < 6; i += 1) {
      const x = shift + w * (0.08 + i * 0.22);
      const top = h * 0.2;
      const bottom = h * 0.74;
      ctx.fillStyle = 'rgba(18, 18, 18, 0.9)';
      ctx.fillRect(x, top, w * 0.17, bottom - top);
      const glow = ctx.createLinearGradient(0, top, 0, bottom);
      glow.addColorStop(0, `hsla(${44 + i * 6} 80% 70% / 0.9)`);
      glow.addColorStop(1, `hsla(${44 + i * 6} 60% 30% / 0.25)`);
      ctx.fillStyle = glow;
      ctx.fillRect(x + w * 0.012, top + h * 0.02, w * 0.146, bottom - top - h * 0.04);
      for (let shelf = 1; shelf < 4; shelf += 1) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(x + w * 0.012, top + ((bottom - top) / 4) * shelf, w * 0.146, h * 0.012);
      }
    }
    // Бегущая шкала прогресса и счётчик — по ним видно, что кадр перематывается.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(w * 0.06, h * 0.9, w * 0.88 * t, h * 0.012);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = `${Math.round(h * 0.055)}px sans-serif`;
    ctx.fillText(`ФИКСТУРА · ${Math.round(t * 100)}%`, w * 0.06, h * 0.87);
  };

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const chunks = [];
  const encoder = new VideoEncoder({
    output: (chunk) => {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      chunks.push({ timestamp: chunk.timestamp, key: chunk.type === 'key', data: Array.from(data) });
    },
    error: (error) => {
      throw error;
    },
  });
  encoder.configure({ codec: 'vp8', width, height, bitrate: 1_500_000, framerate: fps });
  for (let i = 0; i < frames; i += 1) {
    drawScene(ctx, width, height, i / (frames - 1));
    const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1_000_000) / fps) });
    encoder.encode(frame, { keyFrame: true });
    frame.close();
  }
  await encoder.flush();
  encoder.close();

  const poster = document.createElement('canvas');
  poster.width = 1600;
  poster.height = 900;
  drawScene(poster.getContext('2d'), 1600, 900, 0);
  return { chunks, poster: poster.toDataURL('image/jpeg', 0.84) };
}
/* eslint-enable no-undef */

// ---- Упаковка WebM (Matroska-подмножество) -------------------------------------------------------

const id = (...bytes) => Buffer.from(bytes);
const uint = (value, bytes) => {
  const out = Buffer.alloc(bytes);
  out.writeUIntBE(value, 0, bytes);
  return out;
};
const size = (length) => {
  const out = Buffer.alloc(8);
  out[0] = 0x01; // восьмибайтовая длина
  out.writeUIntBE(length, 2, 6);
  return out;
};
const element = (elementId, ...payload) => {
  const body = Buffer.concat(payload);
  return Buffer.concat([elementId, size(body.length), body]);
};
const unsigned = (elementId, value) => element(elementId, uint(value, value > 0xffffff ? 4 : value > 0xffff ? 3 : value > 0xff ? 2 : 1));
const text = (elementId, value) => element(elementId, Buffer.from(value, 'ascii'));
const float64 = (elementId, value) => {
  const out = Buffer.alloc(8);
  out.writeDoubleBE(value);
  return element(elementId, out);
};

function muxWebm({ chunks, width, height, fps }) {
  const header = element(
    id(0x1a, 0x45, 0xdf, 0xa3),
    unsigned(id(0x42, 0x86), 1),
    unsigned(id(0x42, 0xf7), 1),
    unsigned(id(0x42, 0xf2), 4),
    unsigned(id(0x42, 0xf3), 8),
    text(id(0x42, 0x82), 'webm'),
    unsigned(id(0x42, 0x87), 4),
    unsigned(id(0x42, 0x85), 2),
  );
  const durationMs = (chunks.length * 1000) / fps;
  const info = element(
    id(0x15, 0x49, 0xa9, 0x66),
    unsigned(id(0x2a, 0xd7, 0xb1), 1_000_000),
    float64(id(0x44, 0x89), durationMs),
    text(id(0x4d, 0x80), 'fixture'),
    text(id(0x57, 0x41), 'fixture'),
  );
  const tracks = element(
    id(0x16, 0x54, 0xae, 0x6b),
    element(
      id(0xae),
      unsigned(id(0xd7), 1),
      unsigned(id(0x73, 0xc5), 1),
      unsigned(id(0x83), 1),
      text(id(0x86), 'V_VP8'),
      element(id(0xe0), unsigned(id(0xb0), width), unsigned(id(0xba), height)),
    ),
  );

  // Один кластер на кадр: так положение каждого кадра для индекса известно точно.
  const parts = [info, tracks];
  const cuePoints = [];
  let offset = parts.reduce((sum, part) => sum + part.length, 0);
  chunks.forEach((chunk, index) => {
    const timeMs = Math.round((chunk.timestamp / 1_000_000) * 1000);
    const block = Buffer.concat([Buffer.from([0x81, 0x00, 0x00, chunk.key ? 0x80 : 0x00]), Buffer.from(chunk.data)]);
    const cluster = element(id(0x1f, 0x43, 0xb6, 0x75), unsigned(id(0xe7), timeMs), element(id(0xa3), block));
    cuePoints.push(
      element(id(0xbb), unsigned(id(0xb3), timeMs), element(id(0xb7), unsigned(id(0xf7), 1), unsigned(id(0xf1), offset))),
    );
    parts.push(cluster);
    offset += cluster.length;
  });
  parts.push(element(id(0x1c, 0x53, 0xbb, 0x6b), ...cuePoints));
  return Buffer.concat([header, element(id(0x18, 0x53, 0x80, 0x67), ...parts)]);
}

// ---- Запуск ---------------------------------------------------------------------------------------

// WebCodecs доступны только в защищённом контексте: открываем пустую страницу с http://127.0.0.1.
const server = createServer((request, response) => {
  response.setHeader('content-type', 'text/html');
  response.end('<!doctype html><title>fixture</title>');
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const { chunks, poster } = await page.evaluate(renderInBrowser, { width: WIDTH, height: HEIGHT, fps: FPS, frames: FRAMES });
  const webm = muxWebm({ chunks, width: WIDTH, height: HEIGHT, fps: FPS });
  writeFileSync(resolve(OUT_DIR, 'demo.webm'), webm);
  writeFileSync(resolve(OUT_DIR, 'poster.jpg'), Buffer.from(poster.split(',')[1], 'base64'));
  console.log(`demo.webm: ${chunks.length} кадров, ${(webm.length / 1024).toFixed(0)} КБ; poster.jpg записан`);
} finally {
  await browser.close();
  server.close();
}
