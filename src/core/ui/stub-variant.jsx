// Рабочая заглушка варианта для каркаса: шапка, футер и главная на токенах варианта.
// Таски вариантов заменяют свой src/variants/<id>/index.jsx целиком и этим файлом не пользуются.
import { Link, NavLink } from 'react-router';
import { cn } from '../../lib/utils.js';
import { useNav } from '../layout/nav.js';
import { useVariant } from '../variants/VariantContext.jsx';

function StubHeader() {
  const { id, ui } = useVariant();
  const { items } = useNav();
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 md:px-6">
        <Link to={`/${id}`} className="font-display text-xl">
          ДВК Стиль
        </Link>
        <nav aria-label="Основная навигация" className="order-3 w-full md:order-none md:w-auto md:flex-1">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {items.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => cn('hover:underline', isActive ? 'text-fg underline' : 'text-fg-muted')}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <ui.Button to={`/${id}/request`} className="ml-auto md:ml-0">
          Заявка на подбор
        </ui.Button>
      </div>
    </header>
  );
}

function StubFooter() {
  const { id } = useVariant();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 pb-24 text-sm text-fg-muted md:px-6">
        <p>Концепт редизайна dvk-style.ru</p>
        <Link to={`/${id}/privacy`} className="hover:text-fg hover:underline">
          Политика обработки персональных данных
        </Link>
      </div>
    </footer>
  );
}

const PROTOTYPE_PAGES = [
  ['catalog', 'Каталог'],
  ['catalog/retail', 'Каталог: ритейл'],
  ['catalog/landscape', 'Каталог: благоустройство'],
  ['catalog/metal?q=шкаф', 'Каталог: металл, поиск «шкаф»'],
  ['product/primer', 'Карточка товара (адрес-пример)'],
  ['solutions/pharmacy', 'Решение: аптеки'],
  ['projects', 'Проекты'],
  ['projects/primer', 'Кейс (адрес-пример)'],
  ['about', 'Производство'],
  ['contacts', 'Контакты'],
  ['request', 'Запрос КП'],
  ['privacy', 'Политика обработки ПД'],
  ['net-takoy-stranitsy', 'Несуществующая страница'],
];

function StubHome() {
  const { id, meta, ui } = useVariant();
  return (
    <main className="page page-home">
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-14 md:px-6 md:pt-24">
        <h1 className="max-w-4xl font-display text-5xl leading-[1.05] text-balance md:text-7xl">{meta.name}</h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-fg-muted">{meta.description.metaphor}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ui.Button to={`/${id}/request`}>Заявка на подбор</ui.Button>
          <ui.Button variant="secondary" to={`/${id}/catalog`}>
            Каталог
          </ui.Button>
        </div>
        <p className="mt-8 font-mono text-sm text-fg-muted">Заглушка главной: вариант {meta.number} собирается.</p>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
        <ui.SectionHeading title="Страницы прототипа" lead="Маршруты каркаса — у каждой пока заглушка." />
        <ul className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {PROTOTYPE_PAGES.map(([path, label]) => (
            <li key={path}>
              <Link to={`/${id}/${path}`} className="underline-offset-4 hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

/**
 * Модуль варианта-заглушки по контракту interfaces.md («Модуль варианта»).
 * @param {{ id: string, css: string }} options css — токены на [data-variant="<id>"]
 */
export function createStubVariant({ id, css }) {
  function Tokens() {
    // React 19 поднимает <style href precedence> в <head> и не дублирует.
    return (
      <style href={`variant-stub-${id}`} precedence="default">
        {css}
      </style>
    );
  }

  function Header() {
    return (
      <>
        <Tokens />
        <StubHeader />
      </>
    );
  }

  return {
    id,
    Header,
    Footer: StubFooter,
    Home: StubHome,
    ui: {},
    heroConfig: {
      sources: { desktop: `media/${id}/hero.mp4` },
      poster: null,
      camera: { from: { x: 50, y: 50, scale: 1 }, to: { x: 50, y: 50, scale: 1.15 } },
      callouts: [],
      phases: [],
      lengthVh: 350,
      mobileLengthVh: 220,
    },
  };
}
