// Контракт варианта «Шоурум»: heroConfig (ролик, фазы, пояснения из данных), первый экран главной, шапка.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import company from '../../data/company.json';
import projects from '../../data/projects.json';
import products from '../../data/products.json';
import { installBrowserStubs, renderApp, resetStores } from '../../core/pages/test-utils.jsx';
import { HERO_FRAME, HERO_LAMPS, frameToStage } from './hero-config.js';
import showroom from './index.jsx';

installBrowserStubs();
beforeEach(() => resetStores());
afterEach(cleanup);

// Шапка сайта — первый <header> в документе (шапки внутренних страниц тоже <header>, но внутри main).
const siteHeader = () => screen.getAllByRole('banner')[0];
const norm = (text) => String(text).replace(/\s+/g, ' ').trim();
const stripDot = (text) => norm(text).replace(/\.$/, '');

/** Все строки из company.json и projects.json — пояснения hero могут брать текст только отсюда. */
function collectStrings(value, out = new Set()) {
  if (typeof value === 'string') out.add(stripDot(value));
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, out));
  return out;
}
const DATA_STRINGS = [...collectStrings([company, projects])];
/** Текст — строка данных или её фраза целиком (например, вторая фраза описания проекта). */
const fromData = (text) => text.includes('[уточнить]') || DATA_STRINGS.some((value) => value.includes(stripDot(text)));

describe('heroConfig «Шоурума»', () => {
  const { heroConfig } = showroom;

  it('ролик лежит в media/showroom, постер — первый кадр ролика рядом с ним, есть версия для телефона', () => {
    expect(heroConfig.sources.desktop).toBe('media/showroom/hero.mp4');
    expect(heroConfig.sources.mobile).toBe('media/showroom/hero-mobile.mp4');
    expect(heroConfig.poster.src).toBe('media/showroom/hero-poster.jpg');
    for (const file of [heroConfig.sources.desktop, heroConfig.sources.mobile, heroConfig.poster.src]) {
      expect(existsSync(resolve(process.cwd(), 'public', file)), `${file} лежит в public`).toBe(true);
    }
    expect(heroConfig.poster.alt.length).toBeGreaterThan(0);
    // R06: закреплённая сцена 300–400vh, на телефоне 200–250vh
    expect(heroConfig.lengthVh).toBeGreaterThanOrEqual(300);
    expect(heroConfig.lengthVh).toBeLessThanOrEqual(400);
    expect(heroConfig.mobileLengthVh).toBeGreaterThanOrEqual(200);
    expect(heroConfig.mobileLengthVh).toBeLessThanOrEqual(250);
  });

  it('фазы «Проектирование / Производство / Монтаж» идут подряд и покрывают весь ролик', () => {
    const { phases } = heroConfig;
    expect(phases.map((phase) => phase.label.toUpperCase())).toEqual(['ПРОЕКТИРОВАНИЕ', 'ПРОИЗВОДСТВО', 'МОНТАЖ']);
    expect(phases[0].from).toBe(0);
    expect(phases[phases.length - 1].to).toBe(1);
    phases.slice(1).forEach((phase, index) => expect(phase.from).toBe(phases[index].to));
  });

  it('4–6 пояснений: каждое на своём отрезке внутри фазы, в точке кадра, текст — факт из данных', () => {
    const { callouts, phases } = heroConfig;
    expect(callouts.length).toBeGreaterThanOrEqual(4);
    expect(callouts.length).toBeLessThanOrEqual(6);
    expect(new Set(callouts.map((callout) => callout.id)).size).toBe(callouts.length);
    const sorted = [...callouts].sort((a, b) => a.from - b.from);
    sorted.forEach((callout, index) => {
      expect(callout.from).toBeGreaterThanOrEqual(0);
      expect(callout.to).toBeLessThanOrEqual(1);
      expect(callout.to).toBeGreaterThan(callout.from);
      if (index > 0) expect(callout.from, `${callout.id} не перекрывает соседа`).toBeGreaterThanOrEqual(sorted[index - 1].to);
      for (const axis of ['x', 'y']) {
        expect(callout[axis]).toBeGreaterThan(0);
        expect(callout[axis]).toBeLessThan(1);
      }
      const phase = phases.find((item) => callout.from >= item.from && callout.to <= item.to);
      expect(phase, `${callout.id} внутри одной фазы`).toBeTruthy();
      expect(norm(callout.title).length).toBeGreaterThan(0);
      expect(fromData(callout.text), `«${callout.text}» есть в данных`).toBe(true);
    });
  });

  it('точка кадра ролика переводится в точку сцены: кадр закрывает сцену (cover), лишнее обрезается поровну', () => {
    // Ролик 1280×704. Сцена тех же пропорций — точка на месте.
    expect(HERO_FRAME).toEqual({ width: 1280, height: 704 });
    const same = frameToStage({ x: 0.25, y: 0.4 }, { width: 1280, height: 704 });
    expect(same.x).toBeCloseTo(0.25, 5);
    expect(same.y).toBeCloseTo(0.4, 5);
    expect(same.visible).toBe(true);
    // 1440×900: кадр растянут по высоте до 1636,36 px, слева и справа срезано по 98,18 px.
    const desktop = frameToStage({ x: 0.89, y: 0.37 }, { width: 1440, height: 900 });
    expect(desktop.x).toBeCloseTo((0.89 * 1636.3636 - 98.1818) / 1440, 4);
    expect(desktop.y).toBeCloseTo(0.37, 5);
    expect(desktop.visible).toBe(true);
    // 1920×800: кадр растянут по ширине до 1056 px по высоте, сверху и снизу срезано по 128 px.
    const wide = frameToStage({ x: 0.5, y: 0.25 }, { width: 1920, height: 800 });
    expect(wide.x).toBeCloseTo(0.5, 5);
    expect(wide.y).toBeCloseTo((0.25 * 1056 - 128) / 800, 4);
    // Портрет 390×844: правая витрина остаётся за краем сцены.
    expect(frameToStage({ x: 0.89, y: 0.37 }, { width: 390, height: 844 }).visible).toBe(false);
    // Смещение кадра (object-position): 100 % по горизонтали — срезается только слева.
    const shifted = frameToStage({ x: 1, y: 0.5 }, { width: 1440, height: 900 }, { x: 1, y: 0.5 });
    expect(shifted.x).toBeCloseTo(1, 5);
  });

  it('светильники заглушки не спорят с роликом: первая витрина уже горит в кадре, остальные зажигаются справа налево', () => {
    const byTime = [...HERO_LAMPS].sort((a, b) => a.at - b.at);
    expect(byTime.length).toBeGreaterThanOrEqual(3);
    byTime.forEach((lamp, index) => {
      expect(lamp.at, `${lamp.id} зажигается по скроллу, а не с загрузки`).toBeGreaterThan(0);
      expect(lamp.at).toBeLessThanOrEqual(0.5); // к середине ролика зал освещён
      if (index > 0) expect(lamp.x, `${lamp.id} левее предыдущего`).toBeLessThanOrEqual(byTime[index - 1].x);
    });
  });
});

describe('главная «Шоурума»', () => {
  it('первый экран: позиционирование в h1, заявка, телефон города, обещание, фазы ролика и три равных входа', async () => {
    const { container } = await renderApp('/showroom');
    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(norm(h1.textContent)).toBe(company.positioning);

    const main = container.querySelector('main');
    const hero = h1.closest('section');
    expect(within(hero).getAllByRole('link', { name: /Заявка на подбор/ })[0].getAttribute('href')).toBe('/showroom/request');
    expect(hero.querySelector('a[href="tel:+78124619751"]')).toBeTruthy();
    expect(within(hero).getByText(company.promise)).toBeTruthy();

    const directions = within(hero).getByRole('navigation', { name: 'Направления' });
    expect(within(directions).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/showroom/catalog/retail',
      '/showroom/catalog/landscape',
      '/showroom/catalog/metal',
    ]);

    const phases = within(hero).getByRole('group', { name: /Ход ролика/ });
    expect(within(phases).getAllByRole('button').map((button) => norm(button.textContent).toUpperCase())).toEqual([
      'ПРОЕКТИРОВАНИЕ',
      'ПРОИЗВОДСТВО',
      'МОНТАЖ',
    ]);

    // G04: кадр подписан как доработанное фото реального проекта ДВК и ведёт на этот проект
    const project = projects.find((item) => item.slug === 'perfume-balashikha');
    const credit = within(hero).getByRole('link', { name: /доработанное фото проекта ДВК/i });
    expect(credit.getAttribute('href')).toBe('/showroom/projects/perfume-balashikha');
    expect(credit.textContent).toContain(project.city);
    expect(within(hero).queryByText('Здесь будет видео-интерьер')).toBeNull();

    // R09: главная — 6–8 экранов
    const screens = main.querySelectorAll(':scope > section');
    expect(screens.length).toBeGreaterThanOrEqual(6);
    expect(screens.length).toBeLessThanOrEqual(8);
  });

  it('каталог-витрина: товары с «В запрос КП» трёх направлений, кнопка кладёт товар в запрос', async () => {
    await renderApp('/showroom');
    await screen.findByRole('heading', { level: 1 });
    const showcase = screen.getByRole('heading', { level: 2, name: /Каталог под подсветкой/ }).closest('section');
    const names = within(showcase).getAllByRole('article').map((card) => within(card).getByRole('heading').textContent);
    // названия выводятся с ёлочками вместо прямых кавычек
    expect(names.some((name) => name.includes('"'))).toBe(false);
    expect(names).toContain('Игровой комплекс МГМ-78 «Кораблик»');
    const plain = (name) => name.replace(/["«»]/g, '');
    const directionsShown = new Set(names.map((name) => products.find((product) => plain(product.name) === plain(name))?.direction));
    expect(names.length).toBeGreaterThanOrEqual(6);
    expect([...directionsShown].sort()).toEqual(['landscape', 'metal', 'retail']);

    fireEvent.click(within(showcase).getAllByRole('button', { name: /В запрос КП/ })[0]);
    expect(JSON.parse(localStorage.getItem('dvk-kp-v1')).length).toBe(1);
  });
});

describe('тексты и порядок экранов главной', () => {
  it('для посетителя нет слов о прототипе, госзаказ — один факт без повтора, заявка: заголовок → квиз → площадки', async () => {
    const { container } = await renderApp('/showroom');
    await screen.findByRole('heading', { level: 1 });
    const mainText = container.querySelector('main').textContent;
    expect(/в прототипе/i.test(mainText), 'в текстах главной нет слов о прототипе').toBe(false);
    expect(/равного веса/i.test(mainText), 'в текстах главной нет языка брифа').toBe(false);

    const gov = screen.getByRole('heading', { level: 3, name: 'Госзаказ и тендеры' }).closest('aside');
    expect(gov.textContent.match(/Более 9 лет/g)).toHaveLength(1);
    expect(within(gov).getAllByText(/тендер/i).length).toBeGreaterThanOrEqual(1);

    const request = screen.getByRole('heading', { level: 2, name: /Включим свет/ }).closest('section');
    const quiz = request.querySelector('.sr-request__form');
    const places = request.querySelector('.sr-request__places');
    expect(quiz && places).toBeTruthy();
    // DOCUMENT_POSITION_FOLLOWING: площадки идут в документе после квиза
    expect(quiz.compareDocumentPosition(places) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('шапка «Шоурума»', () => {
  it('переключатель города меняет телефон в шапке', async () => {
    await renderApp('/showroom/about');
    await screen.findByRole('heading', { level: 1 });
    const banner = siteHeader();
    expect(banner.querySelector('a[href="tel:+78124619751"]')).toBeTruthy();
    fireEvent.click(within(banner).getAllByRole('button', { name: 'Москва' })[0]);
    expect(banner.querySelector('a[href="tel:+74952681521"]')).toBeTruthy();
    expect(banner.querySelector('a[href="tel:+78124619751"]')).toBeNull();
  });

  it('счётчик запроса КП ведёт на страницу запроса и показывает число позиций', async () => {
    await resetStores([[products[0].id, 2], [products[1].id, 1]]);
    await renderApp('/showroom/about');
    await screen.findByRole('heading', { level: 1 });
    const link = within(siteHeader()).getAllByRole('link', { name: /Запрос КП/ })[0];
    expect(link.getAttribute('href')).toBe('/showroom/request');
    expect(link.textContent).toMatch(/2/);
  });

  it('мега-меню «Каталог»: три направления равного веса с разделами', async () => {
    await renderApp('/showroom/about');
    await screen.findByRole('heading', { level: 1 });
    const banner = siteHeader();
    const toggle = within(banner).getAllByRole('button', { name: 'Каталог' })[0];
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const menu = within(banner).getByRole('region', { name: 'Каталог по направлениям' });
    for (const [name, slug] of [
      ['Ритейл и экспозиция', 'retail'],
      ['Благоустройство', 'landscape'],
      ['Металлическая мебель', 'metal'],
    ]) {
      expect(within(menu).getByRole('link', { name }).getAttribute('href')).toBe(`/showroom/catalog/${slug}`);
    }
    expect(within(menu).getByRole('link', { name: /Детские игровые площадки/ }).getAttribute('href')).toBe('/showroom/catalog/landscape/playgrounds');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
