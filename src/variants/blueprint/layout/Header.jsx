// Шапка «Чертежа» — верхняя строка листа, собранная из граф: знак, навигация (мега-меню «Каталог» по трём
// направлениям, «Решения» по отраслям), город, телефон, запрос КП, заявка. На телефоне — лист-меню.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { ChevronDown, ClipboardList, Menu, Phone, X } from 'lucide-react';
import { getDirection, getIndustry } from '../../../core/catalog/index.js';
import { CITIES, useCity } from '../../../core/city/index.js';
import { useKp } from '../../../core/kp/index.js';
import { useNav } from '../../../core/layout/nav.js';
import { toTel } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { cn } from '../../../lib/utils.js';
import { SheetGlyph } from '../drawing/SheetGlyph.jsx';
import { SHEET_TYPES } from '../lib/drawing.js';
import { Button } from '../ui/Button.jsx';

const CITY_SHORT = { spb: 'СПб', msk: 'Москва' };

function CitySwitch({ className }) {
  const { city, setCity } = useCity();
  return (
    <div className={cn('bp-seg bp-seg--city', className)} role="group" aria-label="Город">
      {CITIES.map((id) => (
        <button key={id} type="button" aria-pressed={city === id} onClick={() => setCity(id)}>
          {CITY_SHORT[id] ?? id}
        </button>
      ))}
    </div>
  );
}

function KpLink({ variantId, className }) {
  const { count } = useKp();
  return (
    <Link to={`/${variantId}/request`} className={cn('bp-hd__kp', className)}>
      <ClipboardList className="size-4" aria-hidden="true" />
      <span className="bp-hd__kp-label">Запрос КП</span>
      <span className="bp-hd__count tabular" aria-label={`позиций: ${count}`}>
        {count}
      </span>
    </Link>
  );
}

/** Выпадающая панель пункта меню: открывается кликом и наведением, Esc закрывает и возвращает фокус. */
function MenuItem({ item, open, onOpen, onClose, children }) {
  const panelId = useId();
  const buttonRef = useRef(null);
  const timer = useRef(0);
  const fine = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <li
      className="bp-hd__item"
      onPointerEnter={() => {
        if (!fine) return;
        clearTimeout(timer.current);
        timer.current = setTimeout(onOpen, 90);
      }}
      onPointerLeave={() => {
        if (!fine) return;
        clearTimeout(timer.current);
        timer.current = setTimeout(onClose, 160);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          onClose();
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="bp-hd__link"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? onClose() : onOpen())}
      >
        {item.label}
        <ChevronDown className="bp-hd__chev size-3.5" aria-hidden="true" />
      </button>
      <div id={panelId} className="bp-mega" hidden={!open}>
        {children}
      </div>
    </li>
  );
}

function CatalogPanel({ directions, catalogTo }) {
  return (
    <div className="bp-mega__inner">
      <ul className="bp-mega__cols">
        {directions.map((direction) => {
          const sheet = SHEET_TYPES[direction.id];
          return (
            <li key={direction.id} className="bp-mega__col">
              <SheetGlyph view={sheet?.view} className="bp-mega__glyph" />
              <Link to={direction.to} className="bp-mega__head font-display">
                {direction.name}
              </Link>
              <ul className="bp-mega__rows">
                {direction.sections.map((section, index) => (
                  <li key={section.id}>
                    <Link to={section.to} className="bp-mega__row">
                      <span className="bp-mono bp-mega__pos">{index + 1}</span>
                      <span className="bp-mega__name">{section.name}</span>
                      <span className="tabular bp-mega__count" title="Позиций на dvk-style.ru">
                        {section.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      <p className="bp-mega__foot">
        <Link to={catalogTo} className="bp-link">
          Весь каталог
        </Link>
        <span>Число — позиций в разделе на dvk-style.ru.</span>
      </p>
    </div>
  );
}

function SolutionsPanel({ items }) {
  const groups = Object.keys(SHEET_TYPES).map((directionId) => ({
    id: directionId,
    name: getDirection(directionId)?.name ?? directionId,
    items: items.filter((item) => item.directionId === directionId),
  }));
  return (
    <div className="bp-mega__inner">
      <ul className="bp-mega__cols">
        {groups.map((group) => (
          <li key={group.id} className="bp-mega__col">
            <p className="bp-mega__head font-display">{group.name}</p>
            <ul className="bp-mega__rows">
              {group.items.map((item) => (
                <li key={item.id}>
                  <Link to={item.to} className="bp-mega__row">
                    <span className="bp-mega__name">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Пункты «Решений» с первым направлением отрасли из данных — для группировки в панели. */
function industryItems(items) {
  const solutions = items.find((item) => item.id === 'solutions');
  return (solutions?.children ?? []).map((child) => ({ ...child, directionId: getIndustry(child.to.split('/').pop())?.directions?.[0] }));
}

export function Header() {
  const { id: variantId } = useVariant();
  const { items, directions } = useNav();
  const { contacts } = useCity();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(null); // 'catalog' | 'solutions' | null
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef(null);
  const mobileRef = useRef(null);
  const burgerRef = useRef(null);
  const phone = contacts?.phones?.[0];
  const industries = industryItems(items);

  const close = useCallback(() => setMenu(null), []);

  // Смена страницы закрывает всё.
  useEffect(() => {
    setMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Клик вне шапки закрывает мега-меню.
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (event) => {
      if (!headerRef.current?.contains(event.target)) setMenu(null);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menu]);

  // Лист-меню телефона: Esc закрывает, фокус — внутрь и обратно на кнопку.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    mobileRef.current?.querySelector('a, button')?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const plainItems = items.filter((item) => !['catalog', 'solutions'].includes(item.id));
  const catalogItem = items.find((item) => item.id === 'catalog');
  const solutionsItem = items.find((item) => item.id === 'solutions');

  return (
    <header ref={headerRef} className="bp-hd" data-open={mobileOpen || undefined}>
      <div className="bp-hd__bar">
        <Link to={`/${variantId}`} className="bp-hd__mark">
          <span className="font-display">ДВК Стиль</span>
        </Link>

        <nav aria-label="Основная навигация" className="bp-hd__nav">
          <ul className="bp-hd__list">
            {catalogItem ? (
              <MenuItem item={catalogItem} open={menu === 'catalog'} onOpen={() => setMenu('catalog')} onClose={close}>
                <CatalogPanel directions={directions} catalogTo={catalogItem.to} />
              </MenuItem>
            ) : null}
            {solutionsItem ? (
              <MenuItem item={solutionsItem} open={menu === 'solutions'} onOpen={() => setMenu('solutions')} onClose={close}>
                <SolutionsPanel items={industries} />
              </MenuItem>
            ) : null}
            {plainItems.map((item) => (
              <li key={item.id} className="bp-hd__item">
                <NavLink to={item.to} className="bp-hd__link">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <CitySwitch className="bp-hd__city" />

        {phone ? (
          <a href={`tel:${toTel(phone)}`} className="bp-hd__phone">
            <Phone className="size-4" aria-hidden="true" />
            <span className="tabular bp-hd__phone-num">{phone}</span>
            <span className="sr-only">, {contacts.label}</span>
          </a>
        ) : null}

        <KpLink variantId={variantId} className="bp-hd__kp-cell" />

        <Button to={`/${variantId}/request`} size="sm" className="bp-hd__cta">
          Заявка на подбор
        </Button>

        <button
          ref={burgerRef}
          type="button"
          className="bp-hd__burger"
          aria-expanded={mobileOpen}
          aria-controls="bp-mobile-menu"
          onClick={() => setMobileOpen((value) => !value)}
        >
          {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          <span className="sr-only">{mobileOpen ? 'Закрыть меню' : 'Открыть меню'}</span>
        </button>
      </div>

      <div id="bp-mobile-menu" ref={mobileRef} className="bp-mob" hidden={!mobileOpen}>
        <nav aria-label="Меню" className="bp-mob__nav">
          <p className="bp-mob__group font-display">Каталог</p>
          <ul className="bp-mob__rows">
            {directions.map((direction, index) => (
              <li key={direction.id}>
                <Link to={direction.to} className="bp-mob__row">
                  <span className="bp-mono">{index + 1}</span>
                  {direction.name}
                </Link>
              </li>
            ))}
            {catalogItem ? (
              <li>
                <Link to={catalogItem.to} className="bp-mob__row">
                  <span className="bp-mono">—</span>
                  Весь каталог
                </Link>
              </li>
            ) : null}
          </ul>
          <ul className="bp-mob__rows bp-mob__rows--plain">
            {[solutionsItem, ...plainItems].filter(Boolean).map((item) => (
              <li key={item.id}>
                <Link to={item.to} className="bp-mob__row">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="bp-mob__foot">
          <CitySwitch />
          {phone ? (
            <a href={`tel:${toTel(phone)}`} className="bp-mob__phone tabular">
              <Phone className="size-4" aria-hidden="true" />
              {phone}
            </a>
          ) : null}
          <Button to={`/${variantId}/request`}>Заявка на подбор</Button>
        </div>
      </div>
    </header>
  );
}
