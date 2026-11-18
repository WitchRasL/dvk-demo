// Контракт разметки ScrollVideo для вариантов: классы, по которым hero варианта находит сцену и стилизует её.
// Переименование класса из контракта ломает три главные — поэтому он закреплён здесь.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SCROLL_VIDEO_CLASSES, SCROLL_VIDEO_MODE_ATTRIBUTE, ScrollVideo, findScrollVideoRoot, findScrollVideoStage } from './index.js';

afterEach(() => {
  cleanup();
  delete window.matchMedia;
});

const callouts = [{ id: 'a', from: 0.1, to: 0.4, x: 0.3, y: 0.4, title: 'Подсветка', text: 'Тёплый свет в нише' }];
const poster = { base: 'media/test/poster', alt: 'Интерьер аптеки' };

function renderScene(props = {}) {
  return render(<ScrollVideo poster={poster} callouts={callouts} renderOverlay={() => <h1>Заголовок</h1>} renderCallout={(callout) => <b>{callout.title}</b>} {...props} />);
}

describe('контракт классов ScrollVideo', () => {
  it('имена классов контракта', () => {
    expect(SCROLL_VIDEO_CLASSES).toEqual({
      root: 'scroll-video',
      stage: 'scroll-video__stage',
      poster: 'scroll-video__poster',
      video: 'scroll-video__video',
      callouts: 'scroll-video__callouts',
      callout: 'scroll-video__callout',
      label: 'scroll-video__label',
      overlay: 'scroll-video__overlay',
      list: 'scroll-video__list',
    });
    expect(SCROLL_VIDEO_MODE_ATTRIBUTE).toBe('data-mode');
  });

  it('заглушка: корень с режимом, в нём сцена, в сцене — кадр, слой пояснений, пометка и оверлей варианта', () => {
    const { container } = renderScene();
    const root = container.querySelector('.scroll-video');
    expect(root.getAttribute('data-mode')).toBe('placeholder');
    const stage = root.querySelector(':scope > .scroll-video__stage');
    expect(stage).not.toBeNull();
    for (const name of ['scroll-video__poster', 'scroll-video__callouts', 'scroll-video__label', 'scroll-video__overlay']) {
      expect(stage.querySelector(`:scope > .${name}`), name).not.toBeNull();
    }
    expect(stage.querySelector('.scroll-video__callouts > .scroll-video__callout b').textContent).toBe('Подсветка');
    // то, что рисует вариант (оверлей, пояснение), лежит внутри сцены: от своего элемента он находит сцену и корень
    expect(findScrollVideoStage(stage.querySelector('h1'))).toBe(stage);
    expect(findScrollVideoStage(stage.querySelector('b'))).toBe(stage);
    expect(findScrollVideoRoot(stage.querySelector('h1'))).toBe(root);
    expect(findScrollVideoStage(document.body)).toBeNull();
    expect(findScrollVideoRoot(null)).toBeNull();
  });

  it('ролик: кадр ролика — класс video внутри сцены', () => {
    const { container } = renderScene({ sources: { desktop: 'media/test/hero.mp4' } });
    expect(container.querySelector('.scroll-video').getAttribute('data-mode')).toBe('video');
    expect(container.querySelector('.scroll-video__stage > video.scroll-video__video')).not.toBeNull();
  });

  it('статика (reduced-motion): пояснения — видимый список list рядом со сценой, слоя callouts нет', () => {
    window.matchMedia = (query) => ({ media: query, matches: query.includes('prefers-reduced-motion'), addEventListener() {}, removeEventListener() {} });
    const { container } = renderScene();
    const root = container.querySelector('.scroll-video');
    expect(root.getAttribute('data-mode')).toBe('static');
    expect(root.querySelector(':scope > ol.scroll-video__list > li b').textContent).toBe('Подсветка');
    expect(root.querySelector('.scroll-video__callouts')).toBeNull();
    expect(root.querySelector(':scope > .scroll-video__stage > .scroll-video__overlay h1')).not.toBeNull();
  });
});

describe('варианты пользуются только классами контракта', () => {
  const VARIANTS_DIR = resolve(process.cwd(), 'src/variants');
  const files = readdirSync(VARIANTS_DIR, { recursive: true })
    .map(String)
    .filter((name) => /\.(css|jsx?)$/.test(name) && !/\.test\./.test(name));
  const allowed = new Set(Object.values(SCROLL_VIDEO_CLASSES));

  it('в CSS и коде вариантов нет классов движка вне контракта', () => {
    expect(files.length).toBeGreaterThan(20);
    const foreign = [];
    for (const name of files) {
      const text = readFileSync(join(VARIANTS_DIR, name), 'utf8');
      for (const match of text.matchAll(/scroll-video(?:__[a-z]+(?:-[a-z]+)*)?(?:--[a-z-]+)?/g)) {
        const index = match.index ?? 0;
        // пути импорта ('core/scroll-video/…', docs/…) — не классы
        if (/[/\w]$/.test(text.slice(Math.max(0, index - 1), index)) || text[index + match[0].length] === '/') continue;
        if (!allowed.has(match[0])) foreign.push(`${name}: ${match[0]}`);
      }
    }
    expect(foreign).toEqual([]);
  });

  it('в коде вариантов сцена ищется через константы контракта, а не строкой', () => {
    const literal = files
      .filter((name) => /\.jsx?$/.test(name))
      .filter((name) => /['"`]\.scroll-video/.test(readFileSync(join(VARIANTS_DIR, name), 'utf8')));
    expect(literal).toEqual([]);
  });
});
