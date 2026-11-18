// Шапка «Палитры RAL»: общая для всех полей. data-field задаёт цвет всего сайта (см. tokens.js).
// Каталог — мега-меню из трёх полей-направлений; Решения — отрасли по направлениям; город, телефон, запрос КП,
// сигнальная «Заявка на подбор». На телефоне — меню на всё поле.
import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router';
import { ChevronDown, ClipboardList, Menu, Phone, X } from 'lucide-react';
import { getIndustries } from '../../core/catalog/index.js';
import { useCity } from '../../core/city/index.js';
import { useFocusTrap } from '../../core/hooks/useFocusTrap.js';
import { useHeaderMenu } from '../../core/hooks/useHeaderMenu.js';
import { useKp } from '../../core/kp/index.js';
import { useNav } from '../../core/layout/nav.js';
import { CitySwitch as CoreCitySwitch } from '../../core/ui/CitySwitch.jsx';
import { countText, toTel } from '../../core/ui/format.js';
import { useVariant } from '../../core/variants/VariantContext.jsx';
import { cn } from '../../lib/utils.js';
import { DirectionSwatch, FieldLink, RepaintLayer, useFanDirections } from './Fan.jsx';
import { useCurrentDirection } from './field-store.js';
import { fieldFor } from './palette.js';
import { Button, FieldCode } from './ui.jsx';
import { TOKENS_CSS } from './tokens.js';

const CITY_SHORT = { spb: 'СПб', msk: 'Москва' };
/** Меню телефона нажатие вне шапки не закрывает: оно на всё поле, закрывается кнопкой и Esc. */
const MODAL_MENUS = ['mobile'];

function Tokens() {
  // React 19 поднимает <style href precedence> в <head> и не дублирует.
  return (
    <style href="ral-tokens" precedence="default">
      {TOKENS_CSS}
    </style>
  );
}

export function CitySwitch({ className }) {
  return <CoreCitySwitch className={cn('ral-city', className)} labels={CITY_SHORT} />;
}

function PhoneLink({ className }) {
  const { contacts } = useCity();
  const phone = contacts?.phones?.[0];
  if (!phone) return null;
  return (
    <a href={`tel:${toTel(phone)}`} className={cn('ral-phone', className)}>
      <Phone className="size-4" aria-hidden="true" />
      <span className="ral-phone__num tabular">{phone}</span>
      <span className="sr-only">, {contacts.label}</span>
    </a>
  );
}

function KpLink() {
  const { id } = useVariant();
  const kp = useKp();
  return (
    <Link to={`/${id}/request`} className="ral-kp" aria-label={`Запрос КП: ${countText(kp.count, 'position')}`}>
      <ClipboardList className="size-4" aria-hidden="true" />
      <span className="ral-kp__label">Запрос КП</span>
      <span className="ral-kp__count tabular">{kp.count}</span>
    </Link>
  );
}

function CatalogMenu({ id, onClose }) {
  const directions = useFanDirections();
  const { id: variantId } = useVariant();
  return (
    <div id={id} className="ral-mega" role="region" aria-label="Каталог по направлениям">
      <ul className="ral-mega__cols">
        {directions.map((direction, index) => (
          <li key={direction.id} className="ral-mega__col" data-field-scope={direction.field.id} style={{ '--i': index }}>
            <FieldLink direction={direction.id} to={direction.to} className="ral-mega__head" onClickCapture={onClose}>
              <span className="ral-mono">{direction.field.code}</span>
              <span className="ral-mega__title">{direction.name}</span>
              <span className="ral-mega__summary">{direction.summary}</span>
            </FieldLink>
            <ul className="ral-mega__list">
              {direction.sections.map((section) => (
                <li key={section.id}>
                  <Link to={`${direction.to}/${section.slug}`} onClick={onClose}>
                    <span>{section.name}</span>
                    <span className="tabular" title="Позиций на dvk-style.ru">
                      {section.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="ral-mega__note">
        Числа — позиции на dvk-style.ru. <Link to={`/${variantId}/catalog`} onClick={onClose}>Весь каталог с поиском и фильтрами</Link>
      </p>
    </div>
  );
}

function SolutionsMenu({ id, onClose }) {
  const { id: variantId } = useVariant();
  const directions = useFanDirections();
  const industries = getIndustries();
  return (
    <div id={id} className="ral-mega" role="region" aria-label="Решения по отраслям">
      <ul className="ral-mega__cols">
        {directions.map((direction, index) => (
          <li key={direction.id} className="ral-mega__col" data-field-scope={direction.field.id} style={{ '--i': index }}>
            <p className="ral-mega__head is-static">
              <span className="ral-mono">{direction.field.code}</span>
              <span className="ral-mega__title">{direction.name}</span>
            </p>
            <ul className="ral-mega__list">
              {industries
                .filter((industry) => industry.directions?.[0] === direction.id)
                .map((industry) => (
                  <li key={industry.id}>
                    <Link to={`/${variantId}/solutions/${industry.slug}`} onClick={onClose}>
                      <span>{industry.name}</span>
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

/** Меню телефона — модальное (role="dialog", aria-modal): фокус ходит по кругу «кнопка закрытия → пункты меню». */
function MobileMenu({ id, field, onClose, closeRef }) {
  const { items } = useNav();
  const directions = useFanDirections();
  const { id: variantId } = useVariant();
  const industries = getIndustries();
  const panelRef = useRef(null);

  // Удержание фокуса и первый фокус — из ядра; кнопка закрытия стоит в шапке и входит в круг.
  useFocusTrap(panelRef, { include: [closeRef] });

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  return (
    <div id={id} ref={panelRef} className="ral-mobile" data-field-scope={field} role="dialog" aria-modal="true" aria-label="Меню">
      <div className="ral-mobile__inner">
        <p className="ral-mobile__group">Каталог — выберите направление</p>
        <nav aria-label="Направления каталога" className="ral-mobile__fan">
          {directions.map((direction) => (
            <DirectionSwatch key={direction.id} direction={direction} size="chip" />
          ))}
        </nav>
        <nav aria-label="Разделы сайта">
          <ul className="ral-mobile__list">
            {items
              .filter((item) => item.id !== 'solutions')
              .map((item) => (
                <li key={item.id}>
                  <NavLink to={item.to} onClick={onClose} end={item.id === 'catalog'}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>
        <p className="ral-mobile__group">Решения по отраслям</p>
        <ul className="ral-mobile__industries">
          {industries.map((industry) => (
            <li key={industry.id}>
              <Link to={`/${variantId}/solutions/${industry.slug}`} onClick={onClose}>
                {industry.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="ral-mobile__tools">
          <CitySwitch />
          <PhoneLink />
          <Button to={`/${variantId}/request`} size="lg" onClick={onClose}>
            Заявка на подбор
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const { id } = useVariant();
  const { items } = useNav();
  const direction = useCurrentDirection();
  const field = fieldFor(direction).id;
  const headerRef = useRef(null);
  const burgerRef = useRef(null);
  // Общее состояние меню шапки (ядро): 'catalog' | 'solutions' | 'mobile' | null; Esc, клик мимо и смена страницы закрывают.
  const { open, toggle, close, panelId, triggerProps } = useHeaderMenu({ containerRef: headerRef, keepOnOutsidePress: MODAL_MENUS });

  return (
    <header ref={headerRef} className="ral-header" data-field={field} data-open={open ?? undefined}>
      <Tokens />
      <div className="ral-header__bar">
        <Link to={`/${id}`} className="ral-logo" aria-label="ДВК Стиль — главная">
          <span className="ral-logo__mark" aria-hidden="true">
            <span data-field-scope="retail" />
            <span data-field-scope="landscape" />
            <span data-field-scope="metal" />
          </span>
          <span className="ral-logo__word">ДВК Стиль</span>
        </Link>
        <FieldCode direction={direction} className="ral-header__code" />

        <nav aria-label="Основная навигация" className="ral-nav">
          <ul>
            {items.map((item) =>
              item.id === 'catalog' || item.id === 'solutions' ? (
                <li key={item.id}>
                  <button
                    type="button"
                    className="ral-nav__link"
                    {...triggerProps(item.id)}
                    onClick={() => toggle(item.id)}
                  >
                    {item.label}
                    <ChevronDown className="ral-nav__chev size-4" aria-hidden="true" />
                  </button>
                </li>
              ) : (
                <li key={item.id}>
                  <NavLink to={item.to} className="ral-nav__link">
                    {item.label}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="ral-header__tools">
          <CitySwitch className="ral-header__city" />
          <PhoneLink />
          <KpLink />
          <Button to={`/${id}/request`} size="sm" className="ral-header__cta">
            <span>
              Заявка<span className="ral-narrow-hide"> на подбор</span>
            </span>
          </Button>
          <button
            ref={burgerRef}
            type="button"
            className="ral-burger"
            {...triggerProps('mobile')}
            onClick={() => toggle('mobile')}
          >
            {open === 'mobile' ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            <span className="sr-only">{open === 'mobile' ? 'Закрыть меню' : 'Меню'}</span>
          </button>
        </div>
      </div>

      {open === 'catalog' ? <CatalogMenu id={panelId('catalog')} onClose={close} /> : null}
      {open === 'solutions' ? <SolutionsMenu id={panelId('solutions')} onClose={close} /> : null}
      {open === 'mobile' ? <MobileMenu id={panelId('mobile')} field={field} onClose={close} closeRef={burgerRef} /> : null}
      <RepaintLayer />
    </header>
  );
}

export { PhoneLink, KpLink };
