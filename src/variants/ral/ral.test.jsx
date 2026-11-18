// Модуль варианта «Палитра RAL» на его публичном интерфейсе: контракт модуля (interfaces.md → «Модуль варианта»),
// первый экран (R13, R14, R14.1, R11.1), сигнальный оранжевый только у заявки, футер концепта (R63).
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { installBrowserStubs, renderApp, resetStores } from '../../core/pages/test-utils.jsx';
import { VariantProvider } from '../../core/variants/VariantContext.jsx';
import company from '../../data/company.json';
import { chooseDirection } from './field-store.js';
import ral from './index.jsx';

beforeAll(installBrowserStubs);
afterEach(cleanup);

const SIGNAL = '[data-tone="signal"]';
const href = (element) => element.getAttribute('href');

/** Текст, который читает скринридер: без узлов aria-hidden. */
function spokenText(element) {
  const copy = element.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
  return copy.textContent.replace(/\s+/g, ' ').trim();
}

/** Главная тяжёлая (8 экранов, квиз): ждём её заголовок напрямую, без перебора ролей всей страницы. */
async function renderHome() {
  const view = await renderApp('/ral');
  const title = await waitFor(
    () => {
      const element = view.container.querySelector('h1');
      if (!element) throw new Error('главная ещё грузится');
      return element;
    },
    { timeout: 4000 },
  );
  return { ...view, title };
}

describe('модуль варианта', () => {
  it('отдаёт шапку, футер, главную, ui и heroConfig', () => {
    expect(ral.id).toBe('ral');
    for (const key of ['Header', 'Footer', 'Home']) expect(typeof ral[key], key).toBe('function');
    for (const key of ['Button', 'ProductCard', 'ProductList', 'SectionHeading', 'PageHeader', 'Reveal']) expect(typeof ral.ui[key], key).toBe('function');
    expect(ral.heroConfig.callouts.length).toBeGreaterThanOrEqual(4);
  });
});

describe('главная «Палитры RAL»', () => {
  it('первый экран: позиционирование, «Заявка на подбор» + телефон + обещание, три равных входа в направления', async () => {
    await resetStores();
    const { container, title } = await renderHome();
    const hero = title.closest('section');
    expect(hero.getAttribute('aria-labelledby')).toBe(title.id);
    expect(spokenText(title)).toBe('Проектируем, производим и монтируем — от витрины до детской площадки, по всей России');

    const request = within(hero).getByRole('link', { name: /Заявка на подбор/ });
    expect(href(request)).toBe('/ral/request');
    expect(request.matches(SIGNAL)).toBe(true);
    expect(within(hero).getByText(/Бесплатный подбор оборудования, ответ на заявку в течение 2 часов/)).toBeTruthy();
    expect(hero.querySelector('a[href="tel:+78124619751"]')).toBeTruthy();

    const fan = within(hero).getByRole('navigation', { name: /Направления/ });
    const entries = within(fan).getAllByRole('link');
    expect(entries.map(href)).toEqual(['/ral/catalog/retail', '/ral/catalog/landscape', '/ral/catalog/metal']);
    // Равные входы: одинаковое устройство, у каждого свой код RAL.
    expect(new Set(entries.map((entry) => entry.className)).size).toBe(1);
    entries.forEach((entry) => expect(entry.textContent).toMatch(/RAL \d{4}/));

    expect(container.querySelector('footer').textContent).toContain('Концепт редизайна dvk-style.ru');
  });

  it('оранжевый — только у заявки: «В запрос КП» и прочие кнопки другого тона', async () => {
    await resetStores();
    const { container } = await renderHome();
    const signals = [...container.querySelectorAll(SIGNAL)];
    expect(signals.length).toBeGreaterThan(0);
    signals.forEach((element) => expect(href(element) ?? element.textContent).toMatch(/\/ral\/request$|Отправить заявку/));
    const addButtons = [...container.querySelectorAll('button')].filter((button) => /В запрос КП/.test(button.textContent));
    expect(addButtons.length).toBeGreaterThan(0);
    addButtons.forEach((button) => expect(button.matches(SIGNAL)).toBe(false));
  });

  it('в рамке hero — ролик: постер — его первый кадр, кадр подписан как доработанное фото проекта, пометки-заглушки нет', async () => {
    await resetStores();
    const { title } = await renderHome();
    const hero = title.closest('section');
    expect(hero.querySelector('.scroll-video__poster').getAttribute('src')).toMatch(/media\/ral\/hero-poster\.jpg$/);
    expect(hero.querySelector('video')).toBeTruthy();
    expect(hero.textContent).toContain('Доработанное фото проекта ДВК');
    expect(hero.textContent).toContain('Балашиха');
    expect(hero.textContent).not.toContain('Здесь будет видео-интерьер');
    // ни один образец веера не помечен: поле — грунт
    expect(hero.querySelector('[aria-current="true"]')).toBeNull();
  });

  it('«Полный цикл»: число шагов в тексте — из company.cycle', async () => {
    await resetStores();
    const { container } = await renderHome();
    const cycle = container.querySelector('.ral-cycle');
    expect(company.cycle.length).toBe(5);
    expect(cycle.textContent).toContain('5 шагов от замера до монтажа');
    expect(cycle.querySelectorAll('ol > li').length).toBe(company.cycle.length);
  });

  it('поле благоустройства: в рамке кадр направления без ролика, образец текущего поля помечен', async () => {
    await resetStores();
    await act(async () => chooseDirection('landscape'));
    const { title } = await renderHome();
    const hero = title.closest('section');
    expect(hero.querySelector('video')).toBeNull();
    expect(hero.querySelector('.scroll-video__poster').getAttribute('src')).toMatch(/images\/projects\/playground-/);
    expect(hero.textContent).toContain('Фото проекта ДВК');
    expect(hero.textContent).not.toContain('Доработанное фото');
    const fan = within(hero).getByRole('navigation', { name: /Направления/ });
    const current = fan.querySelectorAll('[aria-current="true"]');
    expect(current.length).toBe(1);
    expect(href(current[0])).toBe('/ral/catalog/landscape');
    expect(current[0].textContent).toContain('Текущее поле');
    // образцы остаются равными входами
    expect(new Set(within(fan).getAllByRole('link').map((entry) => entry.className)).size).toBe(1);
  });
});

describe('кнопка варианта', () => {
  async function renderButton(props) {
    await act(async () => {
      render(
        <MemoryRouter>
          <VariantProvider id="ral">
            <ral.ui.Button {...props} />
          </VariantProvider>
        </MemoryRouter>,
      );
    });
  }

  it('отправка квиза — сигнальная, «Далее» и «В каталог» — нет', async () => {
    await renderButton({ type: 'submit', children: 'Отправить заявку' });
    expect(screen.getByRole('button', { name: 'Отправить заявку' }).matches(SIGNAL)).toBe(true);
    cleanup();
    await renderButton({ type: 'submit', children: ['Далее', null] });
    expect(screen.getByRole('button', { name: 'Далее' }).matches(SIGNAL)).toBe(false);
    cleanup();
    await renderButton({ to: '/ral/catalog', children: 'В каталог' });
    expect(screen.getByRole('link', { name: 'В каталог' }).matches(SIGNAL)).toBe(false);
  });
});
