// Режим показа «только главная» (VITE_DEMO=home): ссылка заказчику открывает одну страницу — главную «Шоурума».
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installBrowserStubs, renderApp, resetStores } from '../pages/test-utils.jsx';
import { DEMO_REQUEST_ID, internalPath, isDemoHome, isHomeOnlyDemo, isRequestPath } from './demo.js';

installBrowserStubs();
beforeEach(() => resetStores());
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

const location = () => screen.getByTestId('location').textContent;

describe('адреса режима показа', () => {
  it('внутренняя ссылка — путь маршрута, внешняя — null', () => {
    expect(internalPath('#/showroom/catalog?industry=pharmacy')).toBe('/showroom/catalog');
    expect(internalPath('/showroom/')).toBe('/showroom');
    expect(internalPath('#/')).toBe('/');
    expect(internalPath('tel:+78124619751')).toBeNull();
    expect(internalPath('https://example.com/')).toBeNull();
    expect(internalPath('//example.com/')).toBeNull();
  });

  it('главная — корень и главная «Шоурума»; заявка — страница заявки любого варианта', () => {
    expect(isDemoHome('/')).toBe(true);
    expect(isDemoHome('/showroom')).toBe(true);
    expect(isDemoHome('/ral')).toBe(false);
    expect(isDemoHome('/showroom/catalog')).toBe(false);
    expect(isRequestPath('/showroom/request')).toBe(true);
    expect(isRequestPath('/showroom/projects')).toBe(false);
  });

  it('без переменной режим выключен: сайт полный', async () => {
    expect(isHomeOnlyDemo()).toBe(false);
    await renderApp('/showroom/about');
    await screen.findByRole('heading', { level: 1 });
    expect(location()).toBe('/showroom/about');
    expect(document.querySelector('.vs')).toBeTruthy();
  });
});

describe('режим показа включён', () => {
  beforeEach(() => vi.stubEnv('VITE_DEMO', 'home'));

  it.each(['/', '/showroom/catalog', '/showroom/product/torgovyy-modul-tmd-3210', '/ral', '/blueprint/projects', '/нет-такого'])(
    'адрес %s возвращает на главную «Шоурума»',
    async (path) => {
      await renderApp(path);
      await screen.findByRole('heading', { level: 1 });
      expect(location()).toBe('/showroom');
    },
  );

  it('на главной нет переключателя вариантов, панели твиков и быстрого просмотра', async () => {
    await renderApp('/showroom');
    await screen.findByRole('heading', { level: 1 });
    expect(document.querySelector('.vs')).toBeNull();
    expect(screen.queryByRole('button', { name: /Быстрый просмотр/ })).toBeNull();
  });

  it('ссылка в каталог не уводит с главной и показывает пометку, которая сама уходит', async () => {
    await renderApp('/showroom');
    const hero = (await screen.findByRole('heading', { level: 1 })).closest('section');
    vi.useFakeTimers();
    const toCatalog = within(hero).getAllByRole('link').find((link) => link.getAttribute('href') === '/showroom/catalog/retail');
    fireEvent.click(toCatalog);
    expect(location()).toBe('/showroom');
    const notice = document.querySelector('.demo-notice');
    expect(notice.textContent).toMatch(/демонстрация главной страницы/);
    act(() => vi.advanceTimersByTime(3000));
    expect(notice.textContent).toBe('');
  });

  it('«Заявка на подбор» прокручивает к блоку заявки на главной, телефон остаётся ссылкой', async () => {
    await renderApp('/showroom');
    const hero = (await screen.findByRole('heading', { level: 1 })).closest('section');
    const target = document.getElementById(DEMO_REQUEST_ID);
    expect(target).toBeTruthy();
    target.scrollIntoView.mockClear();
    fireEvent.click(within(hero).getAllByRole('link', { name: /Заявка на подбор/ })[0]);
    expect(location()).toBe('/showroom');
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.demo-notice').textContent).toBe('');

    const phone = hero.querySelector('a[href^="tel:"]');
    expect(fireEvent.click(phone)).toBe(true); // нажатие не отменено
  });
});
