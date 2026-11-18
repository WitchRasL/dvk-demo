import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollVideo, progressToTime } from './index.js';

const VIEWPORT = 800;
const STAGE = VIEWPORT; // сцена закреплена на всю высоту окна
const BASE = '/dvk-style-redesign/';

let scrolled = 0; // сколько пикселей страницы уже прокручено до верха трека
let trackHeight = 2800; // 350vh при окне 800px

const rect = (top, height) => ({ top, bottom: top + height, left: 0, right: 1000, width: 1000, height, x: 0, y: top, toJSON() {} });

function mockMedia({ reduced = false, mobile = false } = {}) {
  window.matchMedia = (query) => ({
    media: query,
    matches: query.includes('prefers-reduced-motion') ? reduced : query.includes('max-width') ? mobile : false,
    addEventListener() {},
    removeEventListener() {},
  });
}

beforeEach(() => {
  scrolled = 0;
  trackHeight = 2800;
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'performance'] });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.classList?.contains('scroll-video')) return rect(-scrolled, trackHeight);
    if (this.classList?.contains('scroll-video__stage')) return rect(0, STAGE);
    return rect(0, 0);
  });
  window.innerHeight = VIEWPORT;
  window.scrollTo = vi.fn();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  mockMedia();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete window.matchMedia;
});

/** Прокрутить страницу и дать движку отработать кадры. */
function scrollTo(px, ms = 1500) {
  scrolled = px;
  act(() => {
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(ms);
  });
}

const callouts = [
  { id: 'a', from: 0.1, to: 0.4, x: 0.3, y: 0.4, title: 'Подсветка', text: 'Тёплый свет в нише' },
  { id: 'b', from: 0.5, to: 0.9, x: 0.7, y: 0.6, title: 'Фурнитура', text: 'Петли с доводчиком' },
];
const poster = { base: 'media/test/poster', alt: 'Интерьер аптеки' };
const sources = { desktop: 'media/test/hero.mp4' };

const wrapperOf = (container, id) => container.querySelector(`[data-callout="${id}"]`);

/** Подгружает ролик (постер загрузился) и сообщает движку метаданные. */
function readyVideo(container, { duration = 10 } = {}) {
  const image = container.querySelector('img.scroll-video__poster');
  act(() => {
    fireEvent.load(image);
  });
  const video = container.querySelector('video');
  Object.defineProperty(video, 'duration', { configurable: true, value: duration });
  Object.defineProperty(video, 'readyState', { configurable: true, value: 4 });
  Object.defineProperty(video, 'seeking', { configurable: true, writable: true, value: false });
  act(() => {
    fireEvent.loadedMetadata(video);
    fireEvent.loadedData(video);
  });
  return video;
}

describe('ScrollVideo: заглушка (файла ролика нет)', () => {
  it('показывает постер с первого кадра и пометку «Здесь будет видео-интерьер»', () => {
    const { container } = render(<ScrollVideo poster={poster} callouts={callouts} />);
    const image = container.querySelector('img.scroll-video__poster');
    expect(container.firstChild.getAttribute('data-mode')).toBe('placeholder');
    expect(image.getAttribute('alt')).toBe('Интерьер аптеки');
    expect(image.getAttribute('src')).toBe(`${BASE}media/test/poster-1600.webp`);
    expect(image.getAttribute('srcset')).toBe(`${BASE}media/test/poster-800.webp 800w, ${BASE}media/test/poster-1600.webp 1600w`);
    expect(screen.getByText('Здесь будет видео-интерьер')).toBeTruthy();
    expect(container.querySelector('video')).toBeNull();
  });

  it('текст пометки задаёт вызывающий', () => {
    render(<ScrollVideo poster={poster} placeholderLabel="Видео в работе" />);
    expect(screen.getByText('Видео в работе')).toBeTruthy();
    expect(screen.queryByText('Здесь будет видео-интерьер')).toBeNull();
  });

  it('без постера не падает: нейтральный фон вместо картинки', () => {
    const { container } = render(<ScrollVideo />);
    expect(container.querySelector('.scroll-video__poster')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('сцена закреплена на lengthVh (десктоп) и mobileLengthVh (телефон)', () => {
    const { container, unmount } = render(<ScrollVideo poster={poster} lengthVh={300} mobileLengthVh={200} />);
    expect(container.firstChild.style.getPropertyValue('--scroll-video-length')).toBe('300');
    unmount();
    mockMedia({ mobile: true });
    const mobile = render(<ScrollVideo poster={poster} lengthVh={300} mobileLengthVh={200} />);
    expect(mobile.container.firstChild.style.getPropertyValue('--scroll-video-length')).toBe('200');
  });

  it('камера: кадр едет от camera.from к camera.to по прогрессу скролла', () => {
    const camera = { from: { x: 0, y: 0, scale: 1.2 }, to: { x: -5, y: 2, scale: 1.4 } };
    const { container } = render(<ScrollVideo poster={poster} camera={camera} />);
    const image = container.querySelector('img.scroll-video__poster');
    // transform вида «translate3d(x%, y%, 0) scale(s)»: достаём x, y и s
    const parse = () => {
      const [, shift, scale] = image.style.transform.match(/^translate3d\(([^)]*)\) scale\(([^)]*)\)$/);
      const [x, y] = shift.split(',').map(parseFloat);
      return { x, y, scale: parseFloat(scale) };
    };
    expect(parse()).toEqual({ x: 0, y: 0, scale: 1.2 });
    scrollTo(2000); // конец пути сцены: (2800 − 800)
    const end = parse();
    expect(end.x).toBeCloseTo(-5, 2);
    expect(end.y).toBeCloseTo(2, 2);
    expect(end.scale).toBeCloseTo(1.4, 3);
  });
});

describe('ScrollVideo: пояснения', () => {
  it('на своём отрезке прогресса пояснение активно, на чужом — нет', () => {
    const { container } = render(<ScrollVideo poster={poster} callouts={callouts} />);
    expect(wrapperOf(container, 'a').getAttribute('data-active')).toBe('false');
    scrollTo(0.3 * 2000); // прогресс 0.3: внутри отрезка a (0.1–0.4)
    expect(wrapperOf(container, 'a').getAttribute('data-active')).toBe('true');
    expect(wrapperOf(container, 'b').getAttribute('data-active')).toBe('false');
    scrollTo(0.7 * 2000); // прогресс 0.7: внутри b (0.5–0.9)
    expect(wrapperOf(container, 'a').getAttribute('data-active')).toBe('false');
    expect(wrapperOf(container, 'b').getAttribute('data-active')).toBe('true');
  });

  it('внешний вид пояснения рисует вариант: renderCallout получает active и local', () => {
    const renderCallout = vi.fn((callout) => <span>{`вариант: ${callout.title}`}</span>);
    const { container } = render(<ScrollVideo poster={poster} callouts={callouts} renderCallout={renderCallout} />);
    scrollTo(0.3 * 2000);
    expect(within(wrapperOf(container, 'a')).getByText('вариант: Подсветка')).toBeTruthy();
    const last = renderCallout.mock.calls.filter(([callout]) => callout.id === 'a').at(-1);
    expect(last[1].active).toBe(true);
    expect(last[1].local).toBeCloseTo((0.3 - 0.1) / 0.3, 2);
  });

  it('точка пояснения задаётся долями кадра', () => {
    const { container } = render(<ScrollVideo poster={poster} callouts={callouts} />);
    expect(wrapperOf(container, 'a').style.left).toBe('30%');
    expect(wrapperOf(container, 'a').style.top).toBe('40%');
  });

  it('для скринридера пояснения всегда лежат упорядоченным списком; визуальный слой скрыт от него', () => {
    const { container } = render(<ScrollVideo poster={poster} callouts={callouts} />);
    const list = screen.getByRole('list', { name: 'Пояснения к видео' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('Подсветка');
    expect(items[0].textContent).toContain('Тёплый свет в нише');
    expect(items[1].textContent).toContain('Фурнитура');
    expect(container.querySelector('.scroll-video__callouts').getAttribute('aria-hidden')).toBe('true');
  });

  it('без пояснений списка нет', () => {
    render(<ScrollVideo poster={poster} />);
    expect(screen.queryByRole('list')).toBeNull();
  });
});

describe('ScrollVideo: оверлей, фазы и перемотка', () => {
  const phases = [
    { id: 'design', label: 'ПРОЕКТИРОВАНИЕ', from: 0, to: 0.5 },
    { id: 'install', label: 'МОНТАЖ', from: 0.5, to: 1 },
  ];

  it('renderOverlay получает прогресс и текущую фазу', () => {
    const renderOverlay = vi.fn(() => <h1>Заголовок</h1>);
    render(<ScrollVideo poster={poster} phases={phases} renderOverlay={renderOverlay} />);
    expect(screen.getByRole('heading', { name: 'Заголовок' })).toBeTruthy();
    expect(renderOverlay.mock.calls.at(-1)[1].phase).toBe(phases[0]);
    scrollTo(0.75 * 2000);
    const [progress, api] = renderOverlay.mock.calls.at(-1);
    expect(progress).toBeCloseTo(0.75, 2);
    expect(api.phase).toBe(phases[1]);
    expect(api.phaseIndex).toBe(1);
    expect(api.mode).toBe('placeholder');
  });

  it('seekTo(p) прокручивает страницу к доле пути сцены', () => {
    const renderOverlay = vi.fn(() => null);
    render(<ScrollVideo poster={poster} renderOverlay={renderOverlay} />);
    const { seekTo } = renderOverlay.mock.calls.at(-1)[1];
    seekTo(0.5);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    seekTo(5); // за пределами — до конца пути сцены
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 2000, behavior: 'smooth' });
  });
});

describe('ScrollVideo: режим video', () => {
  it('файл ожидается — режим video, пометки заглушки нет; ролик подгружается после постера', () => {
    const { container } = render(<ScrollVideo poster={poster} sources={sources} />);
    expect(container.firstChild.getAttribute('data-mode')).toBe('video');
    expect(screen.queryByText('Здесь будет видео-интерьер')).toBeNull();
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video.getAttribute('src')).toBeNull(); // постер ещё не загрузился — ролик не качаем
    act(() => {
      fireEvent.load(container.querySelector('img.scroll-video__poster'));
    });
    expect(video.getAttribute('src')).toBe(`${BASE}media/test/hero.mp4`);
    expect(video.muted).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.getAttribute('aria-hidden')).toBe('true');
  });

  it('если постер не загрузился, ролик всё равно начнёт грузиться через пару секунд', () => {
    const { container } = render(<ScrollVideo poster={poster} sources={sources} />);
    expect(container.querySelector('video').getAttribute('src')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(container.querySelector('video').getAttribute('src')).toBe(`${BASE}media/test/hero.mp4`);
  });

  it('ролик не нашёлся или не открылся — режим placeholder с пометкой', () => {
    const { container } = render(<ScrollVideo poster={poster} sources={sources} />);
    act(() => {
      fireEvent.load(container.querySelector('img.scroll-video__poster'));
    });
    act(() => {
      fireEvent.error(container.querySelector('video'));
    });
    expect(container.firstChild.getAttribute('data-mode')).toBe('placeholder');
    expect(screen.getByText('Здесь будет видео-интерьер')).toBeTruthy();
    expect(container.querySelector('video')).toBeNull();
  });

  it('на телефоне сначала мобильный файл, при ошибке — основной, при второй — заглушка', () => {
    mockMedia({ mobile: true });
    const { container } = render(<ScrollVideo poster={poster} sources={{ desktop: 'media/test/hero.mp4', mobile: 'media/test/hero-mobile.mp4' }} />);
    act(() => {
      fireEvent.load(container.querySelector('img.scroll-video__poster'));
    });
    expect(container.querySelector('video').getAttribute('src')).toBe(`${BASE}media/test/hero-mobile.mp4`);
    act(() => {
      fireEvent.error(container.querySelector('video'));
    });
    expect(container.querySelector('video').getAttribute('src')).toBe(`${BASE}media/test/hero.mp4`);
    expect(container.firstChild.getAttribute('data-mode')).toBe('video');
    act(() => {
      fireEvent.error(container.querySelector('video'));
    });
    expect(container.firstChild.getAttribute('data-mode')).toBe('placeholder');
  });

  it('ролик показывается поверх постера, когда готов первый кадр', () => {
    const { container } = render(<ScrollVideo poster={poster} sources={sources} />);
    const video = readyVideo(container);
    expect(video.getAttribute('data-ready')).toBe('true');
  });

  it('кадр ролика плавно догоняет прогресс скролла, без рывка', () => {
    const { container } = render(<ScrollVideo poster={poster} sources={sources} />);
    const video = readyVideo(container, { duration: 10 });
    expect(video.currentTime).toBe(0);

    scrolled = 2000; // рывок на самый конец
    const times = [];
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    for (let frame = 0; frame < 120; frame += 1) {
      act(() => {
        vi.advanceTimersByTime(16);
      });
      times.push(video.currentTime);
    }
    const end = progressToTime(1, 10);
    expect(times[0]).toBeGreaterThan(0);
    expect(times[0]).toBeLessThan(end / 2); // первый кадр — лишь часть пути, а не прыжок к концу
    for (let i = 1; i < times.length; i += 1) expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
    expect(times.at(-1)).toBeCloseTo(end, 2);
  });

  it('пока предыдущая перемотка не закончилась, новую не начинает', () => {
    const { container } = render(<ScrollVideo poster={poster} sources={sources} />);
    const video = readyVideo(container, { duration: 10 });
    video.seeking = true;
    scrolled = 1000;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(500);
    });
    expect(video.currentTime).toBe(0);
    video.seeking = false;
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(video.currentTime).toBeCloseTo(progressToTime(0.5, 10), 2);
  });

  it('открытие страницы посреди сцены: кадр сразу на месте, без проезда с нуля', () => {
    scrolled = 1000;
    const { container } = render(<ScrollVideo poster={poster} sources={sources} />);
    const video = readyVideo(container, { duration: 10 });
    act(() => {
      vi.advanceTimersByTime(32);
    });
    expect(video.currentTime).toBeCloseTo(progressToTime(0.5, 10), 2);
  });
});

describe('ScrollVideo: prefers-reduced-motion (режим static)', () => {
  beforeEach(() => {
    mockMedia({ reduced: true });
  });

  it('без закрепления: трек не растягивается, ролик не грузится, кадр — постер', () => {
    const { container } = render(<ScrollVideo poster={poster} sources={sources} callouts={callouts} />);
    expect(container.firstChild.getAttribute('data-mode')).toBe('static');
    expect(container.firstChild.style.getPropertyValue('--scroll-video-length')).toBe('');
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img.scroll-video__poster')).not.toBeNull();
  });

  it('пояснения — видимый упорядоченный список, у каждого свой вид от варианта', () => {
    const renderCallout = (callout) => <span>{`вариант: ${callout.title}`}</span>;
    const { container } = render(<ScrollVideo poster={poster} sources={sources} callouts={callouts} renderCallout={renderCallout} />);
    const list = screen.getByRole('list', { name: 'Пояснения к видео' });
    expect(list.tagName).toBe('OL');
    expect(list.classList.contains('scroll-video__sr')).toBe(false);
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['вариант: Подсветка', 'вариант: Фурнитура']);
    expect(container.querySelector('.scroll-video__callouts')).toBeNull();
  });

  it('пометка заглушки только если видео и не предполагалось', () => {
    const withVideo = render(<ScrollVideo poster={poster} sources={sources} />);
    expect(screen.queryByText('Здесь будет видео-интерьер')).toBeNull();
    withVideo.unmount();
    render(<ScrollVideo poster={poster} />);
    expect(screen.getByText('Здесь будет видео-интерьер')).toBeTruthy();
  });

  it('оверлей рисуется в начальном состоянии', () => {
    const renderOverlay = vi.fn(() => <h1>Заголовок</h1>);
    render(<ScrollVideo poster={poster} renderOverlay={renderOverlay} />);
    expect(renderOverlay.mock.calls.at(-1)[0]).toBe(0);
    expect(renderOverlay.mock.calls.at(-1)[1].mode).toBe('static');
  });
});

describe('стили движка', () => {
  it('анимируются только transform, opacity и clip-path', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/core/scroll-video/scroll-video.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    // Список через запятую делим только вне скобок: в var(--dur, 240ms) запятая — не разделитель.
    const splitTopLevel = (value) => {
      const parts = [];
      let depth = 0;
      let current = '';
      for (const char of value) {
        if (char === '(') depth += 1;
        if (char === ')') depth -= 1;
        if (char === ',' && depth === 0) {
          parts.push(current);
          current = '';
        } else current += char;
      }
      return [...parts, current];
    };
    const animated = [...css.matchAll(/transition(?:-property)?:\s*([^;]+);/g)].flatMap(([, value]) =>
      splitTopLevel(value)
        .map((part) => part.trim().split(/\s+/)[0])
        .filter((property) => property && property !== 'none'),
    );
    expect(animated.length).toBeGreaterThan(0);
    for (const property of animated) expect(['transform', 'opacity', 'clip-path']).toContain(property);
    expect(css).not.toMatch(/animation(?:-name)?:/); // keyframes-анимаций у движка нет
  });
});
