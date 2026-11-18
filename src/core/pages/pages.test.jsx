import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import products from '../../data/products.json';
import { installBrowserStubs, renderApp, resetStores } from './test-utils.jsx';

installBrowserStubs();

const plain = (text) => String(text).replace(/\s/g, ' ');
const bySlug = (slug) => products.find((product) => product.slug === slug);

beforeEach(() => resetStores());
afterEach(cleanup);

const heading1 = (name) => screen.findByRole('heading', { level: 1, name });
const cards = (container) => container.querySelectorAll('main article');
const countLine = (text) => screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === text);

describe('каталог: фильтры живут в адресе', () => {
  it('открытая по ссылке страница восстанавливает направление, материал и сортировку', async () => {
    await renderApp('/showroom/catalog/metal?material=metal&sort=name');
    await heading1('Металлическая мебель');
    // 11 товаров металлической мебели, у всех материал «металл» (данные src/data/products.json)
    expect(countLine('Найдено: 11 товаров')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /Сортировка/ }).value).toBe('name');
    expect(screen.getByRole('link', { name: 'Металлическая мебель', current: 'page' })).toBeTruthy();
  });

  it('мусор в адресе игнорируется, страница не падает и показывает весь каталог', async () => {
    await renderApp('/showroom/catalog/nope/zzz?material=zzz&page=-4&sort=abc&industry=x&light=laser');
    await heading1('Каталог');
    expect(countLine('Найдено: 35 товаров')).toBeTruthy();
  });

  it('нумерация: вторая страница — ссылка с page в адресе, на ней остаток товаров', async () => {
    const { container } = await renderApp('/showroom/catalog');
    await heading1('Каталог');
    expect(cards(container).length).toBe(24);
    expect(screen.getByRole('link', { name: 'Страница 2' }).getAttribute('href')).toBe('/showroom/catalog?page=2');

    cleanup();
    const second = await renderApp('/showroom/catalog?page=2');
    await heading1('Каталог');
    expect(cards(second.container).length).toBe(11);
    expect(screen.getByRole('link', { name: 'Страница 2' }).getAttribute('aria-current')).toBe('page');
  });

  it('ничего не найдено: что искали, «Сбросить фильтры» и «Подберём сами» с переходом к заявке', async () => {
    await renderApp('/showroom/catalog?q=ъъъъ');
    await screen.findByRole('heading', { level: 2, name: 'Ничего не найдено' });
    expect(screen.getByText(/По запросу «ъъъъ» товаров нет/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Подберём сами — оставьте заявку' }).getAttribute('href')).toBe('/showroom/request');

    fireEvent.click(screen.getAllByRole('button', { name: 'Сбросить фильтры' })[0]);
    await waitFor(() => expect(countLine('Найдено: 35 товаров')).toBeTruthy());
    expect(screen.getByTestId('location').textContent).toBe('/showroom/catalog');
  });

  it('поиск пишет запрос в адрес, а «е» находит «ё»', async () => {
    await renderApp('/showroom/catalog');
    await heading1('Каталог');
    const search = screen.getByRole('searchbox', { name: 'Поиск по каталогу' });
    fireEvent.change(search, { target: { value: 'Тренажерная  беседка' } });
    fireEvent.submit(search.closest('form'));
    await waitFor(() => expect(countLine('Найдено: 1 товар')).toBeTruthy());
    expect(decodeURIComponent(screen.getByTestId('location').textContent)).toBe('/showroom/catalog?q=Тренажерная+беседка');
  });
});

describe('быстрый просмотр', () => {
  async function openFirstQuickView() {
    const view = await renderApp('/showroom/catalog/retail');
    await heading1('Ритейл и экспозиция');
    const trigger = screen.getAllByRole('button', { name: /Быстрый просмотр/ })[0];
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog');
    return { ...view, trigger, dialog };
  }

  it('показывает фото, главные характеристики, «Добавить в запрос КП» и ссылку на страницу товара', async () => {
    const { dialog } = await openFirstQuickView();
    const first = products[0]; // первый товар ритейла в данных
    expect(within(dialog).getByRole('heading', { name: first.name })).toBeTruthy();
    expect(within(dialog).getByRole('img', { name: first.name })).toBeTruthy();
    expect(within(dialog).getByText('Размеры ВхШхГ, мм')).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Добавить в запрос КП' })).toBeTruthy();
    expect(within(dialog).getByRole('link', { name: 'Открыть страницу товара' }).getAttribute('href')).toBe(`/showroom/product/${first.slug}`);
  });

  it('закрывается крестиком, кликом по подложке и событием close (так браузер закрывает по Esc); фокус возвращается', async () => {
    const closers = [
      ({ dialog }) => fireEvent.click(within(dialog).getByRole('button', { name: 'Закрыть быстрый просмотр' })),
      ({ dialog }) => fireEvent.click(dialog),
      ({ dialog }) => fireEvent(dialog, new Event('close')),
    ];
    for (const close of closers) {
      const opened = await openFirstQuickView();
      close(opened);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(opened.trigger);
      cleanup();
    }
  });
});

describe('страница товара', () => {
  const watch = bySlug('vitrina-dlya-chasov-vchyu-23');

  it('галерея: первое фото сразу и с srcset, остальные лениво; alt — название; ссылка на dvk-style.ru', async () => {
    const { container } = await renderApp(`/ral/product/${watch.slug}`);
    await heading1(watch.name);
    const main = container.querySelector('.gallery img[alt]:not([alt=""])');
    expect(main.getAttribute('alt')).toBe(watch.name);
    expect(main.getAttribute('loading')).toBe('eager');
    expect(main.getAttribute('srcset')).toMatch(/-800\.webp 800w, .*-1600\.webp 1600w/);
    const thumbs = [...container.querySelectorAll('.gallery ul img')];
    expect(thumbs.length).toBe(watch.images.length);
    expect(thumbs.every((image) => image.getAttribute('loading') === 'lazy')).toBe(true);
    expect(screen.getByRole('link', { name: /Смотреть товар на dvk-style\.ru/ }).getAttribute('href')).toBe(watch.sourceUrl);
  });

  // Слепая приёмка (F2, P1): миниатюры галереи шли с пустым alt. Ожидаемые подписи — из названий в products.json.
  it.each(['showroom', 'ral', 'blueprint'])('картинки страницы товара, вариант %s: у каждой alt из названия, фото товара не помечены декоративными', async (variantId) => {
    const showcase = bySlug('vitrina-pristennaya-s-nakopitelem-vod-24'); // 6 фото
    const { container } = await renderApp(`/${variantId}/product/${showcase.slug}`);
    await heading1(showcase.name);

    const images = [...container.querySelectorAll('img')];
    const isDecorative = (image) => image.getAttribute('alt') === '' && image.getAttribute('aria-hidden') === 'true';
    const unlabelled = images.filter((image) => !isDecorative(image) && !(image.getAttribute('alt') ?? '').trim());
    expect(unlabelled.map((image) => image.getAttribute('src'))).toEqual([]);

    const gallery = [...container.querySelectorAll('.gallery img')];
    expect(gallery.filter(isDecorative)).toEqual([]);
    const thumbs = [...container.querySelectorAll('.gallery ul img')];
    expect(thumbs.map((image) => image.getAttribute('alt'))).toEqual(showcase.images.map((_, index) => `${showcase.name}, фото ${index + 1}`));
    const stage = gallery.find((image) => !thumbs.includes(image));
    expect(stage.getAttribute('alt')).toBe(showcase.name);

    // Вне галереи на странице — только фото похожих товаров: подпись — название этого товара.
    const names = new Set(products.map((product) => product.name));
    const related = [...container.querySelectorAll('main img')].filter((image) => !gallery.includes(image) && !isDecorative(image));
    expect(related.length).toBeGreaterThan(0);
    expect(related.filter((image) => !names.has(image.getAttribute('alt')) || image.getAttribute('alt') === showcase.name).map((image) => image.getAttribute('alt'))).toEqual([]);
  });

  it('цена из данных или «по запросу»; характеристики, «Как мы работаем» из 5 шагов и похожие товары', async () => {
    await renderApp(`/ral/product/${watch.slug}`);
    await heading1(watch.name);
    expect(plain(screen.getByText(/^11\s260\s₽$/).textContent)).toBe('11 260 ₽');
    expect(screen.getByRole('heading', { name: 'Похожие товары' })).toBeTruthy();
    const how = screen.getByRole('heading', { name: 'Как мы работаем' });
    const steps = within(how.closest('.how-we-work')).getAllByRole('listitem');
    expect(steps.map((step) => within(step).getByRole('heading').textContent.replace(/^Шаг \d\. /, ''))).toEqual([
      'Замер и планировка',
      'Дизайн-проект',
      'Собственное производство',
      'Доставка',
      'Монтаж и такелаж',
    ]);

    cleanup();
    await renderApp('/ral/product/karusel-next-mk-27');
    await heading1('Карусель NEXT МК-27');
    expect(screen.getAllByText('по запросу').length).toBeGreaterThan(0);
  });

  it('«Добавить в запрос КП» меняется на «В запросе · изменить количество», количество уходит в хранилище', async () => {
    await renderApp(`/showroom/product/${watch.slug}`);
    await heading1(watch.name);
    fireEvent.click(screen.getByRole('button', { name: 'Добавить в запрос КП' }));
    expect(await screen.findByText('В запросе · изменить количество')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Увеличить количество' }));
    expect(screen.getByRole('textbox', { name: 'Количество' }).value).toBe('2');
    expect(JSON.parse(localStorage.getItem('dvk-kp-v1'))).toEqual([{ id: watch.id, qty: 2 }]);
    expect(screen.getByRole('link', { name: /Открыть запрос КП \(1\)/ }).getAttribute('href')).toBe('/showroom/request');
  });

  it('неизвестный товар — страница «не найдено» с путём назад', async () => {
    await renderApp('/showroom/product/nope');
    await heading1('Страница не найдена');
    expect(screen.getByText(/Товара с таким адресом в каталоге нет/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'В каталог' }).getAttribute('href')).toBe('/showroom/catalog');
  });
});

describe('решение для отрасли', () => {
  it('аптеки: 11 серий с сайта, четыре типа оборудования, товары отрасли, разделы и проекты', async () => {
    await renderApp('/showroom/solutions/pharmacy');
    await heading1('Аптеки');
    expect(screen.getByText(/11 серий из каталога dvk-style\.ru/)).toBeTruthy();
    const series = screen.getByRole('heading', { name: 'Серии оборудования' }).parentElement.parentElement;
    expect(within(series).getAllByRole('link').length).toBe(11);
    for (const name of ['Аптечная витрина', 'Витрина-касса', 'Рецептурный шкаф', 'Стеллаж']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
    expect(screen.getByRole('heading', { name: 'Товары: аптеки' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Все товары отрасли в каталоге' }).getAttribute('href')).toBe('/showroom/catalog?industry=pharmacy');
    expect(screen.getByRole('link', { name: /Оборудование для аптеки/ }).getAttribute('href')).toBe('/showroom/projects/pharmacy-vladivostok');
  });

  it('шаблон работает для любой отрасли: без серий и типов — страница собирается из данных отрасли', async () => {
    await renderApp('/blueprint/solutions/workshops');
    await heading1('Автосервисы и мастерские');
    expect(screen.queryByRole('heading', { name: 'Серии оборудования' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Типы оборудования' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Товары: автосервисы и мастерские' })).toBeTruthy();
  });

  it('неизвестная отрасль — «не найдено»', async () => {
    await renderApp('/showroom/solutions/nope');
    await heading1('Страница не найдена');
    expect(screen.getByText(/Решения для такой отрасли нет/)).toBeTruthy();
  });
});

describe('проекты', () => {
  it('фильтр по направлению в адресе; мусорное значение — все проекты', async () => {
    const { container } = await renderApp('/showroom/projects?direction=landscape');
    await heading1('Проекты');
    expect(cards(container).length).toBe(2);
    expect(screen.getByRole('link', { name: /Благоустройство/, current: 'page' })).toBeTruthy();

    cleanup();
    const all = await renderApp('/showroom/projects?direction=zzz');
    await heading1('Проекты');
    expect(cards(all.container).length).toBe(9);
  });

  it('кейс: фото, город и «что сделано» — только данные; пустого заказчика и года нет', async () => {
    const { container } = await renderApp('/showroom/projects/duty-free-spb');
    await heading1('Оборудование для магазинов «Дьюти фри»');
    const facts = screen.getByRole('complementary', { name: 'О проекте' });
    expect(within(facts).getByText('Санкт-Петербург')).toBeTruthy();
    expect(within(facts).getByText('Дизайн-проект')).toBeTruthy();
    expect(within(facts).getByText('Производство оборудования')).toBeTruthy();
    expect(within(facts).queryByText('Заказчик')).toBeNull();
    expect(within(facts).queryByText('Год')).toBeNull();
    expect(container.querySelectorAll('.gallery img').length).toBe(4);
  });

  it('неизвестный проект — «не найдено»', async () => {
    await renderApp('/showroom/projects/nope');
    await heading1('Страница не найдена');
  });
});

describe('о компании', () => {
  it('полный цикл, услуги, клиенты, 8 писем без выдуманных сканов; сертификаты — 12 из 20 и «показать все»', async () => {
    const { container } = await renderApp('/showroom/about');
    await heading1('Производство и компания');
    expect(screen.getByRole('heading', { name: 'Полный цикл' })).toBeTruthy();
    expect(screen.getByText('Госзаказы и тендеры')).toBeTruthy();
    expect(screen.getByText('Эрмитаж')).toBeTruthy();
    expect(container.querySelectorAll('blockquote').length).toBe(8);
    expect(screen.getByText(/Сканы писем: \[уточнить\]/)).toBeTruthy();
    expect(container.querySelectorAll('img[src*="/certificates/"]').length).toBe(12);
    fireEvent.click(screen.getByRole('button', { name: /Показать все: 20 документов/ }));
    expect(container.querySelectorAll('img[src*="/certificates/"]').length).toBe(20);
  });
});

describe('контакты', () => {
  const order = () => screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent).filter((text) => ['Санкт-Петербург', 'Москва'].includes(text));

  it('обе площадки: tel:, mailto:, Яндекс Карты, режим работы — [уточнить]; выбранный город первым', async () => {
    await renderApp('/showroom/contacts');
    await heading1('Контакты');
    expect(order()).toEqual(['Санкт-Петербург', 'Москва']);
    expect(screen.getByRole('link', { name: '+7 (495) 268-15-21' }).getAttribute('href')).toBe('tel:+74952681521');
    expect(screen.getByRole('link', { name: 'dvkstyle1@yandex.ru' }).getAttribute('href')).toBe('mailto:dvkstyle1@yandex.ru');
    const maps = screen.getAllByRole('link', { name: /Открыть в Яндекс Картах/ });
    expect(maps.length).toBe(2);
    expect(maps.every((link) => link.getAttribute('href').startsWith('https://yandex.ru/maps'))).toBe(true);
    expect(screen.getAllByText('[уточнить]').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('7817113879')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Показывать в шапке/ }));
    expect(order()).toEqual(['Москва', 'Санкт-Петербург']);
  });
});

describe('на каждой странице есть заявка и телефон выбранного города', () => {
  it.each([
    '/showroom/catalog',
    '/ral/catalog/metal',
    '/blueprint/product/verstak-vs-100-01',
    '/showroom/solutions/pharmacy',
    '/ral/projects',
    '/blueprint/projects/pharmacy-vladivostok',
    '/showroom/about',
    '/ral/contacts',
    '/showroom/nope-nope',
  ])('%s', async (path) => {
    const { container } = await renderApp(path);
    await screen.findByRole('heading', { level: 1 });
    const main = container.querySelector('main.page');
    expect(main, 'корень страницы — main.page').toBeTruthy();
    expect(main.className).toMatch(/\bpage-[a-z-]+\b/);
    const variant = path.split('/')[1];
    expect(within(main).getAllByRole('link', { name: /Заявка на подбор/ })[0].getAttribute('href')).toBe(`/${variant}/request`);
    expect(main.querySelector('a[href="tel:+78124619751"]')).toBeTruthy(); // телефон Санкт-Петербурга — город по умолчанию
  });

  it('телефон следует за городом', async () => {
    await renderApp('/showroom/contacts');
    await heading1('Контакты');
    fireEvent.click(screen.getByRole('button', { name: /Показывать в шапке/ }));
    cleanup();
    const { container } = await renderApp('/showroom/about');
    await heading1('Производство и компания');
    expect(container.querySelector('main a[href="tel:+74952681521"]')).toBeTruthy();
  });
});

describe('направление — хук для варианта', () => {
  it('data-direction стоит на страницах каталога, товара и отрасли', async () => {
    const catalog = await renderApp('/showroom/catalog/landscape');
    await heading1('Благоустройство');
    expect(catalog.container.querySelector('main').getAttribute('data-direction')).toBe('landscape');
    cleanup();
    const product = await renderApp('/showroom/product/verstak-vs-100-01');
    await heading1('Верстак слесарный ВС-100-01');
    expect(product.container.querySelector('main').getAttribute('data-direction')).toBe('metal');
    cleanup();
    const industry = await renderApp('/showroom/solutions/pharmacy');
    await heading1('Аптеки');
    expect(industry.container.querySelector('main').getAttribute('data-direction')).toBe('retail');
  });
});
