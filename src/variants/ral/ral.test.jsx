// Модуль варианта «Палитра RAL» на его публичном интерфейсе: контракт модуля (interfaces.md → «Модуль варианта»),
// первый экран (R13, R14, R14.1, R11.1), сигнальный оранжевый только у заявки, футер концепта (R63).
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { installBrowserStubs, renderApp, resetStores } from '../../core/pages/test-utils.jsx';
import { VariantProvider } from '../../core/variants/VariantContext.jsx';
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
