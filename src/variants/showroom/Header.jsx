// Шапка «Шоурума»: знак и меню, мега-меню каталога по трём равным направлениям, решения по отраслям,
// город, телефон, счётчик запроса КП и золотая заявка. На главной лежит поверх hero и проявляется, когда hero ушёл.
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowUpRight, ChevronDown, ClipboardList, Menu, Phone, X } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { useCity, CITIES } from '../../core/city/index.js';
import { getCompany } from '../../core/catalog/index.js';
import { useKp } from '../../core/kp/index.js';
import { useNav } from '../../core/layout/nav.js';
import { plural, toTel } from '../../core/ui/format.js';
import { useVariant } from '../../core/variants/VariantContext.jsx';
import { Button } from './ui.jsx';

const POSITION_FORMS = ['позиция', 'позиции', 'позиций'];
const CITY_SHORT = { spb: 'Петербург', msk: 'Москва' };
const HOVER_OPEN_MS = 90;
const HOVER_CLOSE_MS = 220;

/** Знак ДВК: две латунные наклонные планки (развитие знака из референса) и словесный знак. */
export function Logo({ to, className }) {
  const gradient = useId();
  return (
    <Link to={to} className={cn('sr-logo', className)} aria-label="ДВК Стиль — на главную">
      <svg className="sr-logo__mark" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6dfa4" />
            <stop offset="0.55" stopColor="#d4a659" />
            <stop offset="1" stopColor="#8d6730" />
          </linearGradient>
        </defs>
        <path d="M11.5 28 22 2h4.5L16 28z" fill={`url(#${gradient})`} />
        <path d="M3.5 28 9 14.5h3.4L6.9 28z" fill={`url(#${gradient})`} opacity="0.72" />
      </svg>
      <span className="sr-logo__word">ДВК Стиль</span>
    </Link>
  );
}

/** Город в шапке: две кнопки, выбранная подсвечена. Меняет телефон, почту и адрес по всему сайту. */
export function CitySwitch({ className }) {
  const { city, setCity } = useCity();
  const company = getCompany();
  return (
    <div role="group" aria-label="Выбор города" className={cn('sr-city', className)}>
      {CITIES.filter((id) => company.cities?.[id]).map((id) => (
        <button key={id} type="button" aria-pressed={city === id} onClick={() => setCity(id)} className="sr-city__btn">
          {CITY_SHORT[id] ?? company.cities[id].label}
        </button>
      ))}
    </div>
  );
}

function KpLink({ to, className }) {
  const { count } = useKp();
  return (
    <Link to={to} className={cn('sr-kp', className)} data-filled={count > 0 || undefined}>
      <ClipboardList className="size-[1.15rem]" aria-hidden="true" />
      <span className="sr-kp__label">Запрос КП</span>
      <span className="sr-kp__count tabular">
        {count}
        <span className="sr-only"> {plural(count, POSITION_FORMS)}</span>
      </span>
    </Link>
  );
}

function PhoneLink({ className }) {
  const { contacts } = useCity();
  const phone = contacts?.phones?.[0];
  if (!phone) return null;
  return (
    <a href={`tel:${toTel(phone)}`} className={cn('sr-phone tabular', className)}>
      <Phone className="size-4" aria-hidden="true" />
      <span className="sr-phone__number">{phone}</span>
      <span className="sr-only">, {contacts.label}</span>
    </a>
  );
}

/** Мега-меню каталога: три направления равного веса, у каждого разделы с числом позиций на dvk-style.ru. */
function CatalogPanel({ id, variantId, directions, onNavigate, onPointerEnter }) {
  return (
    <section id={id} aria-label="Каталог по направлениям" className="sr-mega" onPointerEnter={onPointerEnter}>
      <div className="sr-mega__inner">
        <ul className="sr-mega__grid">
          {directions.map((direction) => (
            <li key={direction.id} className="sr-mega__col" data-direction={direction.id}>
              <span className="sr-mega__lamp" aria-hidden="true" />
              <Link to={direction.to} className="sr-mega__dir" onClick={onNavigate}>
                {direction.name}
              </Link>
              {direction.summary ? <p className="sr-mega__summary">{direction.summary}</p> : null}
              <ul className="sr-mega__sections">
                {direction.sections.map((section) => (
                  <li key={section.id}>
                    <Link to={section.to} onClick={onNavigate} className="sr-mega__section">
                      <span>{section.name}</span>
                      <span className="tabular sr-mega__count" title="Позиций на dvk-style.ru">
                        {section.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="sr-mega__foot">
          <Link to={`/${variantId}/catalog`} onClick={onNavigate} className="sr-mega__all">
            Весь каталог
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
          <p className="sr-mega__note">Число у раздела — позиций на dvk-style.ru.</p>
        </div>
      </div>
    </section>
  );
}

function SolutionsPanel({ id, industries, onNavigate, onPointerEnter }) {
  return (
    <section id={id} aria-label="Решения по отраслям" className="sr-mega sr-mega--solutions" onPointerEnter={onPointerEnter}>
      <div className="sr-mega__inner">
        <ul className="sr-mega__industries">
          {industries.map((industry) => (
            <li key={industry.id}>
              <Link to={industry.to} onClick={onNavigate} className="sr-mega__industry">
                {industry.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Меню телефона: модальный <dialog> внутри корня варианта — токены на месте, фокус заперт, Esc закрывает. */
function MobileMenu({ id, variantId, items, directions, onClose }) {
  const dialogRef = useRef(null);
  const company = getCompany();
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      // Фокус — на «Закрыть меню», а не на логотип: первый Tab ведёт в навигацию.
      dialog.querySelector('[data-close]')?.focus();
    }
    return () => {
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus();
    };
  }, []);
  const solutions = items.find((item) => item.id === 'solutions');
  const plain = items.filter((item) => !item.children);
  return (
    <dialog id={id} ref={dialogRef} aria-label="Меню" className="sr-drawer" onClose={onClose} onCancel={onClose}>
      <div className="sr-drawer__top">
        <Logo to={`/${variantId}`} />
        <button type="button" className="sr-icon-btn" onClick={onClose} aria-label="Закрыть меню" data-close>
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <nav aria-label="Меню сайта" className="sr-drawer__nav">
        <p className="sr-drawer__group">Каталог</p>
        <ul className="sr-drawer__dirs">
          {directions.map((direction) => (
            <li key={direction.id} data-direction={direction.id}>
              <details>
                <summary>
                  {direction.name}
                  <ChevronDown className="size-4" aria-hidden="true" />
                </summary>
                <ul>
                  <li>
                    <Link to={direction.to} onClick={onClose}>
                      Всё направление
                    </Link>
                  </li>
                  {direction.sections.map((section) => (
                    <li key={section.id}>
                      <Link to={section.to} onClick={onClose}>
                        {section.name}
                        <span className="tabular">{section.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
        {solutions ? (
          <details className="sr-drawer__solutions">
            <summary>
              Решения по отраслям
              <ChevronDown className="size-4" aria-hidden="true" />
            </summary>
            <ul>
              {solutions.children.map((industry) => (
                <li key={industry.id}>
                  <Link to={industry.to} onClick={onClose}>
                    {industry.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <ul className="sr-drawer__links">
          {plain.map((item) => (
            <li key={item.id}>
              <Link to={item.to} onClick={onClose}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <KpLink to={`/${variantId}/request`} className="sr-kp--drawer" />
          </li>
        </ul>
      </nav>
      <div className="sr-drawer__foot">
        <CitySwitch />
        <PhoneLink className="sr-phone--large" />
        <Button to={`/${variantId}/request`} onClick={onClose} className="sr-drawer__cta">
          Заявка на подбор
        </Button>
        <p className="sr-drawer__promise">{company.promise}</p>
      </div>
    </dialog>
  );
}

/** Шапка прозрачна, пока под ней hero главной; дальше — сплошная. */
function useOverHero(active) {
  const [over, setOver] = useState(active);
  useEffect(() => {
    if (!active) {
      setOver(false);
      return undefined;
    }
    let frame = 0;
    const check = () => {
      frame = 0;
      const hero = document.querySelector('.sr-hero');
      setOver(hero ? hero.getBoundingClientRect().bottom > 96 : false);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [active]);
  return over;
}

export function Header() {
  const { id: variantId } = useVariant();
  const { items, directions } = useNav();
  const { pathname } = useLocation();
  const headerRef = useRef(null);
  const timer = useRef(null);
  const [menu, setMenu] = useState(null); // 'catalog' | 'solutions' | null
  const [drawer, setDrawer] = useState(false);
  const catalogId = useId();
  const solutionsId = useId();
  const drawerId = useId();
  const isHome = pathname === `/${variantId}` || pathname === `/${variantId}/`;
  const overHero = useOverHero(isHome);
  const pageRoot = pathname.split('/')[2] ?? '';

  // Новая страница — меню закрыты.
  useEffect(() => {
    setMenu(null);
    setDrawer(false);
  }, [pathname]);

  // Esc и клик мимо шапки закрывают выпадающее меню; фокус возвращается на его кнопку.
  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      const toggle = headerRef.current?.querySelector(`[aria-controls="${menu === 'catalog' ? catalogId : solutionsId}"]`);
      setMenu(null);
      toggle?.focus();
    };
    const onPointer = (event) => {
      if (!headerRef.current?.contains(event.target)) setMenu(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menu, catalogId, solutionsId]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const openedBy = useRef(null);
  const hoverOpen = (next) => (event) => {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      openedBy.current = 'hover';
      setMenu(next);
    }, HOVER_OPEN_MS);
  };
  const hoverClose = (event) => {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMenu(null), HOVER_CLOSE_MS);
  };
  const hoverKeep = () => clearTimeout(timer.current);
  // Клик по уже открытому наведением меню его не закрывает: мышь сначала наводит, потом кликает.
  const toggle = (next) => () => {
    clearTimeout(timer.current);
    if (menu === next && openedBy.current === 'hover') {
      openedBy.current = 'click';
      return;
    }
    openedBy.current = 'click';
    setMenu((current) => (current === next ? null : next));
  };
  const closeMenu = () => setMenu(null);
  const solutions = items.find((item) => item.id === 'solutions');

  return (
    <header
      ref={headerRef}
      className="sr-header"
      data-over-hero={overHero || undefined}
      data-menu={menu || undefined}
      onPointerLeave={menu ? hoverClose : undefined}
      onPointerEnter={hoverKeep}
    >
      <div className="sr-header__bar">
        <Logo to={`/${variantId}`} className="sr-header__logo" />

        <nav aria-label="Основная навигация" className="sr-header__nav">
          <ul>
            {items.map((item) => {
              const root = item.id === 'solutions' ? 'solutions' : item.to.split('/')[2];
              const active = pageRoot === root || (item.id === 'catalog' && pageRoot === 'product');
              if (item.id === 'catalog' || item.id === 'solutions') {
                const key = item.id;
                const panelId = key === 'catalog' ? catalogId : solutionsId;
                return (
                  <li key={item.id} onPointerEnter={hoverOpen(key)}>
                    <button
                      type="button"
                      className="sr-nav__item"
                      data-active={active || undefined}
                      aria-expanded={menu === key}
                      aria-controls={panelId}
                      onClick={toggle(key)}
                    >
                      {item.label}
                      <ChevronDown className="sr-nav__chevron size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                );
              }
              return (
                <li key={item.id} onPointerEnter={menu ? hoverClose : undefined}>
                  <Link to={item.to} className="sr-nav__item" data-active={active || undefined} aria-current={active ? 'page' : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sr-header__tools">
          <div className="sr-header__contact">
            <CitySwitch className="sr-header__city" />
            <PhoneLink className="sr-header__phone" />
          </div>
          <KpLink to={`/${variantId}/request`} className="sr-header__kp" />
          <Button to={`/${variantId}/request`} size="sm" className="sr-header__cta">
            Заявка на подбор
          </Button>
          <button
            type="button"
            className="sr-icon-btn sr-header__burger"
            aria-expanded={drawer}
            aria-controls={drawerId}
            onClick={() => setDrawer(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
            <span className="sr-only">Меню</span>
          </button>
        </div>
      </div>

      {menu === 'catalog' ? <CatalogPanel id={catalogId} variantId={variantId} directions={directions} onNavigate={closeMenu} onPointerEnter={hoverKeep} /> : null}
      {menu === 'solutions' && solutions ? <SolutionsPanel id={solutionsId} industries={solutions.children} onNavigate={closeMenu} onPointerEnter={hoverKeep} /> : null}
      {drawer ? <MobileMenu id={drawerId} variantId={variantId} items={items} directions={directions} onClose={() => setDrawer(false)} /> : null}
    </header>
  );
}
