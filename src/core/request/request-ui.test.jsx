import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import products from '../../data/products.json';
import { installBrowserStubs, renderApp, resetStores } from '../pages/test-utils.jsx';

installBrowserStubs();

const [first, second] = products;
const pick = (name) => fireEvent.click(screen.getByRole('radio', { name: new RegExp(name) }));
const next = () => fireEvent.click(screen.getByRole('button', { name: /^Далее/ }));
const legend = (text) => screen.findByText(text, { selector: 'legend' });

async function openRequest() {
  await renderApp('/showroom/request');
  await screen.findByRole('heading', { level: 1, name: 'Запрос КП' });
}

/** Проходит три первых шага квиза и оказывается на «Контактах». */
async function reachContacts() {
  pick('Ритейл и экспозиция');
  next();
  await legend('Для какого объекта?');
  pick('Аптеки');
  next();
  await legend('Когда нужно оборудование?');
  pick('Как можно скорее');
  next();
  await legend('Как с вами связаться?');
}

function fillContacts({ name = 'Анна', phone = '9123456789' } = {}) {
  fireEvent.change(screen.getByLabelText('Имя'), { target: { value: name } });
  fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: phone } });
  fireEvent.click(screen.getByRole('checkbox', { name: /Согласен на обработку/ }));
}

beforeEach(() => resetStores());
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('запрос КП: список', () => {
  it('пусто: понятное состояние со ссылкой в каталог и переходом к заявке', async () => {
    await openRequest();
    expect(screen.getByRole('heading', { name: 'В запросе пока нет товаров' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Выбрать в каталоге' }).getAttribute('href')).toBe('/showroom/catalog');
    fireEvent.click(screen.getByRole('button', { name: 'Перейти к заявке' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('позиции с количеством: изменить, убрать; последняя убрана — снова пусто', async () => {
    await resetStores([[first.id, 2], [second.id, 1]]);
    await openRequest();
    expect(screen.getByText('2 позиции, 3 шт.')).toBeTruthy();
    expect(screen.getByRole('link', { name: first.name }).getAttribute('href')).toBe(`/showroom/product/${first.slug}`);

    const group = screen.getByRole('group', { name: `Количество: ${first.name}` });
    fireEvent.click(within(group).getByRole('button', { name: 'Увеличить количество' }));
    expect(within(group).getByRole('textbox', { name: 'Количество' }).value).toBe('3');
    expect(JSON.parse(localStorage.getItem('dvk-kp-v1'))[0]).toEqual({ id: first.id, qty: 3 });

    fireEvent.click(screen.getByRole('button', { name: `Убрать из запроса: ${first.name}` }));
    fireEvent.click(screen.getByRole('button', { name: `Убрать из запроса: ${second.name}` }));
    expect(await screen.findByRole('heading', { name: 'В запросе пока нет товаров' })).toBeTruthy();
  });
});

describe('квиз: четыре шага', () => {
  it('без ответа дальше нельзя: ошибка у поля по-русски; ответы по шагам ведут к контактам', async () => {
    await openRequest();
    next();
    expect(await screen.findByText('Выберите направление')).toBeTruthy();
    await reachContacts();
    expect(screen.getByRole('list', { name: 'Шаги заявки' }).querySelector('[aria-current="step"]').textContent).toMatch(/Контакты/);
  });

  it('контакты: ошибки по полям; маска телефона; согласие со ссылкой на /privacy; файл проверяется сразу', async () => {
    await openRequest();
    await reachContacts();
    fireEvent.click(screen.getByRole('button', { name: 'Отправить заявку' }));
    expect(await screen.findByText('Укажите имя')).toBeTruthy();
    expect(screen.getByText('Укажите телефон')).toBeTruthy();
    expect(screen.getByText('Нужно согласие на обработку персональных данных')).toBeTruthy();

    const phone = screen.getByLabelText('Телефон');
    fireEvent.change(phone, { target: { value: '89123456789' } });
    expect(phone.value).toBe('+7 (912) 345-67-89');
    expect(screen.getByRole('link', { name: 'Политика обработки данных' }).getAttribute('href')).toBe('/showroom/privacy');

    const file = screen.getByLabelText(/План помещения/);
    fireEvent.change(file, { target: { files: [new File(['x'], 'plan.exe', { type: 'application/x-msdownload' })] } });
    expect(await screen.findByText('Подходят PDF, JPG, PNG и DWG. Этот формат не принимаем.')).toBeTruthy();
  });

  it('без настроенного адреса — демо: экран успеха с пометкой «Демо: заявка не отправлена»', async () => {
    await openRequest();
    await reachContacts();
    fillContacts();
    fireEvent.click(screen.getByRole('button', { name: 'Отправить заявку' }));
    expect(await screen.findByRole('heading', { name: 'Демо: заявка не отправлена' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'В каталог' }).getAttribute('href')).toBe('/showroom/catalog');
    fireEvent.click(screen.getByRole('button', { name: 'Новая заявка' }));
    expect(await legend('Какое направление вас интересует?')).toBeTruthy();
  });

  it('сервис упал: сообщение, введённое на месте, телефон города для звонка, повтор возможен', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', 'https://forms.example.test/send');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    await openRequest();
    await reachContacts();
    fillContacts({ name: 'Анна' });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить заявку' }));

    const alert = await screen.findByText('Заявка не отправилась');
    const panel = alert.closest('[role="alert"]');
    expect(panel.textContent).toMatch(/Сервис приёма заявок сейчас недоступен/);
    expect(panel.textContent).toMatch(/Введённые данные сохранены/);
    expect(within(panel).getByRole('link', { name: '+7 (812) 461-97-51' }).getAttribute('href')).toBe('tel:+78124619751');
    expect(screen.getByLabelText('Имя').value).toBe('Анна');
    expect(screen.getByLabelText('Телефон').value).toBe('+7 (912) 345-67-89');
    expect(screen.getByRole('button', { name: 'Отправить ещё раз' })).toBeTruthy();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('вторая отправка заблокирована, пока идёт первая', async () => {
    vi.stubEnv('VITE_FORM_ENDPOINT', 'https://forms.example.test/send');
    let release;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => (release = () => resolve({ ok: true, json: async () => ({}) })))));
    await openRequest();
    await reachContacts();
    fillContacts();
    const form = screen.getByRole('button', { name: 'Отправить заявку' }).closest('form');
    fireEvent.submit(form);
    fireEvent.submit(form);
    const busy = await screen.findByRole('button', { name: 'Отправляем…' });
    expect(busy.disabled).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    release();
    expect(await screen.findByRole('heading', { name: 'Заявка отправлена' })).toBeTruthy();
  });

  it('закрыли страницу на середине — ответы восстановились: тот же шаг и выбранные ответы', async () => {
    await openRequest();
    pick('Ритейл и экспозиция');
    next();
    await legend('Для какого объекта?');
    pick('Аптеки');
    cleanup();

    await openRequest();
    await legend('Для какого объекта?');
    expect(screen.getByRole('radio', { name: /Аптеки/ }).checked).toBe(true);
  });

  it('подборка из запроса КП идёт вместе с заявкой: на последнем шаге о ней сказано', async () => {
    await resetStores([[first.id, 1]]);
    await openRequest();
    await reachContacts();
    await waitFor(() => expect(screen.getByText('К заявке приложим вашу подборку: 1 из запроса КП.')).toBeTruthy());
  });
});
