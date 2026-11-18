// Общее поведение для шапок и экранов вариантов: медиазапросы, меню шапки, клавиатура табов, удержание фокуса.
// Проверяется снаружи — на маленьких компонентах с той же разметкой, что у вариантов.
import { useRef } from 'react';
import { MemoryRouter, useNavigate } from 'react-router';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import * as scrollVideoHooks from '../scroll-video/useScrollVideo.js';
import { matchesMedia, prefersReducedMotion, useFinePointer, useMediaQuery, usePrefersReducedMotion } from './media.js';
import { useFocusTrap } from './useFocusTrap.js';
import { useHeaderMenu } from './useHeaderMenu.js';
import { tabKeyTarget, useTabs } from './useTabs.js';

afterEach(() => {
  cleanup();
  delete window.matchMedia;
});

/** matchMedia, у которого можно переключить ответ и оповестить подписчиков. */
function stubMedia(initial = {}) {
  const state = { ...initial };
  const listeners = new Map();
  window.matchMedia = (query) => ({
    media: query,
    get matches() {
      return Boolean(state[query]);
    },
    addEventListener: (_type, listener) => listeners.set(listener, query),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  });
  return (query, value) => {
    state[query] = value;
    act(() => listeners.forEach((target, listener) => target === query && listener()));
  };
}

const REDUCE = '(prefers-reduced-motion: reduce)';
const FINE = '(hover: hover) and (pointer: fine)';

describe('медиазапросы', () => {
  function Probe() {
    const reduce = usePrefersReducedMotion();
    const fine = useFinePointer();
    const wide = useMediaQuery('(min-width: 1024px)');
    return <output>{`${reduce}|${fine}|${wide}`}</output>;
  }

  it('без matchMedia (старое окружение) — всё false, без падения', () => {
    expect(matchesMedia(REDUCE)).toBe(false);
    expect(prefersReducedMotion()).toBe(false);
    render(<Probe />);
    expect(screen.getByRole('status').textContent).toBe('false|false|false');
  });

  it('читают настройку и перерисовываются, когда она меняется', () => {
    const setMedia = stubMedia({ [REDUCE]: true });
    expect(prefersReducedMotion()).toBe(true);
    render(<Probe />);
    expect(screen.getByRole('status').textContent).toBe('true|false|false');
    setMedia(FINE, true);
    setMedia(REDUCE, false);
    expect(screen.getByRole('status').textContent).toBe('false|true|false');
  });

  it('скролл-видео отдаёт те же хуки, а не свою копию', () => {
    expect(scrollVideoHooks.useMediaQuery).toBe(useMediaQuery);
    expect(scrollVideoHooks.usePrefersReducedMotion).toBe(usePrefersReducedMotion);
  });
});

describe('tabKeyTarget: куда ведёт клавиша в списке табов', () => {
  it.each([
    ['ArrowDown', 0, 1],
    ['ArrowRight', 3, 4],
    ['ArrowDown', 7, 0],
    ['ArrowUp', 0, 7],
    ['ArrowLeft', 4, 3],
    ['Home', 5, 0],
    ['End', 2, 7],
  ])('%s с таба %i → таб %i (из восьми)', (key, from, expected) => {
    expect(tabKeyTarget(key, from, 8)).toBe(expected);
  });

  it('прочие клавиши и пустой список табы не трогают', () => {
    expect(tabKeyTarget('Enter', 2, 8)).toBeNull();
    expect(tabKeyTarget('Tab', 2, 8)).toBeNull();
    expect(tabKeyTarget('ArrowDown', 0, 0)).toBeNull();
  });
});

describe('useTabs', () => {
  const NAMES = ['Аптеки', 'Музеи', 'Склады'];
  function Tabs({ initial }) {
    const tabs = useTabs({ count: NAMES.length, initial });
    return (
      <div>
        <div {...tabs.listProps} aria-label="Отрасли">
          {NAMES.map((name, index) => (
            <button key={name} {...tabs.tabProps(index)}>
              {name}
            </button>
          ))}
        </div>
        <div {...tabs.panelProps}>{NAMES[tabs.selected]}</div>
      </div>
    );
  }
  const selectedTab = () => screen.getAllByRole('tab').find((tab) => tab.getAttribute('aria-selected') === 'true');

  it('разметка: tablist, выбранный таб один, панель подписана им', () => {
    render(<Tabs />);
    const tabs = screen.getAllByRole('tab');
    expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical');
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0].id);
    expect(tabs.every((tab) => tab.getAttribute('aria-controls') === panel.id)).toBe(true);
    expect(panel.textContent).toBe('Аптеки');
  });

  it('стрелки, Home и End переносят выбор и фокус; с краёв — по кругу', () => {
    render(<Tabs />);
    const list = screen.getByRole('tablist');
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(selectedTab().textContent).toBe('Музеи');
    expect(document.activeElement).toBe(selectedTab());
    fireEvent.keyDown(list, { key: 'End' });
    expect(selectedTab().textContent).toBe('Склады');
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(selectedTab().textContent).toBe('Аптеки');
    fireEvent.keyDown(list, { key: 'ArrowUp' });
    expect(selectedTab().textContent).toBe('Склады');
    expect(document.activeElement).toBe(selectedTab());
    expect(screen.getByRole('tabpanel').textContent).toBe('Склады');
    expect(screen.getAllByRole('tab').map((tab) => tab.tabIndex)).toEqual([-1, -1, 0]);
  });

  it('клик выбирает таб; начальный таб задаётся', () => {
    render(<Tabs initial={1} />);
    expect(selectedTab().textContent).toBe('Музеи');
    fireEvent.click(screen.getByRole('tab', { name: 'Склады' }));
    expect(selectedTab().textContent).toBe('Склады');
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(selectedTab().id);
  });
});

describe('useHeaderMenu', () => {
  function Header() {
    const ref = useRef(null);
    const navigate = useNavigate();
    const menu = useHeaderMenu({ containerRef: ref });
    return (
      <div>
        <header ref={ref}>
          {['catalog', 'solutions'].map((name) => (
            <button key={name} type="button" {...menu.triggerProps(name)} onClick={() => menu.toggle(name)}>
              {name}
            </button>
          ))}
          {menu.open ? (
            <div id={menu.panelId(menu.open)} data-testid="panel">
              {menu.open}
            </div>
          ) : null}
        </header>
        <button type="button" onClick={() => navigate('/next')}>
          дальше
        </button>
        <p data-testid="outside">страница</p>
        <input aria-label="Поле на странице" />
      </div>
    );
  }
  const renderHeader = () =>
    render(
      <MemoryRouter initialEntries={['/start']}>
        <Header />
      </MemoryRouter>,
    );
  const panel = () => screen.queryByTestId('panel');
  const trigger = (name) => screen.getByRole('button', { name });

  it('открыто не больше одного меню; повторное нажатие закрывает', () => {
    renderHeader();
    expect(panel()).toBeNull();
    fireEvent.click(trigger('catalog'));
    expect(panel().textContent).toBe('catalog');
    expect(trigger('catalog').getAttribute('aria-expanded')).toBe('true');
    expect(trigger('catalog').getAttribute('aria-controls')).toBe(panel().id);
    fireEvent.click(trigger('solutions'));
    expect(panel().textContent).toBe('solutions');
    expect(trigger('catalog').getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger('solutions'));
    expect(panel()).toBeNull();
  });

  it('Esc закрывает меню и возвращает фокус на его кнопку, если фокус был в шапке', () => {
    renderHeader();
    trigger('solutions').focus();
    fireEvent.click(trigger('solutions'));
    trigger('catalog').focus(); // фокус ушёл на соседний элемент шапки
    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger('solutions'));
  });

  it('Esc закрывает меню, но не забирает фокус у поля на странице вне шапки', () => {
    renderHeader();
    fireEvent.click(trigger('catalog')); // меню открыто (в вариантах — ещё и наведением), а посетитель печатает в поле
    const field = screen.getByRole('textbox', { name: 'Поле на странице' });
    field.focus();
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(field);
  });

  it('нажатие вне шапки закрывает меню, внутри — нет', () => {
    renderHeader();
    fireEvent.click(trigger('catalog'));
    fireEvent.pointerDown(panel());
    expect(panel()).not.toBeNull();
    fireEvent.pointerDown(screen.getByTestId('outside'));
    expect(panel()).toBeNull();
  });

  it('смена страницы закрывает меню', () => {
    renderHeader();
    fireEvent.click(trigger('catalog'));
    fireEvent.click(screen.getByRole('button', { name: 'дальше' }));
    expect(panel()).toBeNull();
  });
});

describe('useFocusTrap: модальное меню удерживает фокус', () => {
  function Menu({ active = true, burgerStyle, hiddenStyle = { display: 'none' } }) {
    const panelRef = useRef(null);
    const burgerRef = useRef(null);
    useFocusTrap(panelRef, { active, include: [burgerRef] });
    return (
      <div>
        <a href="#before">до меню</a>
        <div style={burgerStyle}>
          <button type="button" ref={burgerRef}>
            Закрыть меню
          </button>
        </div>
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Меню">
          <a href="#one">Каталог</a>
          <button type="button" disabled>
            выключена
          </button>
          <a href="#hidden" style={hiddenStyle}>
            скрытый пункт
          </a>
          <a href="#two">Контакты</a>
        </div>
        <a href="#after">страница под меню</a>
      </div>
    );
  }
  const tab = (shiftKey = false) => fireEvent.keyDown(document.activeElement, { key: 'Tab', shiftKey });

  it('при открытии фокус уходит на первый элемент меню', () => {
    render(<Menu />);
    expect(document.activeElement.textContent).toBe('Каталог');
  });

  it('Tab с последнего элемента идёт на кнопку закрытия, а не на страницу под меню', () => {
    render(<Menu />);
    tab();
    expect(document.activeElement.textContent).toBe('Контакты');
    tab();
    expect(document.activeElement.textContent).toBe('Закрыть меню');
    tab();
    expect(document.activeElement.textContent).toBe('Каталог');
  });

  it('Shift+Tab с первого элемента круга идёт на последний', () => {
    render(<Menu />);
    screen.getByRole('button', { name: 'Закрыть меню' }).focus();
    tab(true);
    expect(document.activeElement.textContent).toBe('Контакты');
  });

  it('фокус, оказавшийся вне меню, возвращается в него', () => {
    render(<Menu />);
    screen.getByText('страница под меню').focus();
    tab();
    expect(document.activeElement.textContent).toBe('Закрыть меню');
  });

  it.each([
    ['display: none', { display: 'none' }],
    ['visibility: hidden', { visibility: 'hidden' }],
  ])('скрытая кнопка закрытия (%s — окно расширили) в круг не входит: Tab не застревает', (_name, burgerStyle) => {
    render(<Menu burgerStyle={burgerStyle} />);
    expect(document.activeElement.textContent).toBe('Каталог');
    tab();
    expect(document.activeElement.textContent).toBe('Контакты');
    tab(); // с последнего пункта — на первый, минуя скрытую кнопку
    expect(document.activeElement.textContent).toBe('Каталог');
    tab(true); // и обратно
    expect(document.activeElement.textContent).toBe('Контакты');
  });

  it('скрытый пункт внутри меню (visibility: hidden) пропускается', () => {
    render(<Menu hiddenStyle={{ visibility: 'hidden' }} />);
    tab();
    expect(document.activeElement.textContent).toBe('Контакты');
  });

  it('в браузере видимость спрашивается у checkVisibility вместе с visibility: hidden', () => {
    const asked = [];
    Element.prototype.checkVisibility = function checkVisibility(options) {
      asked.push(options);
      return !(options?.visibilityProperty && this.textContent.includes('Закрыть меню'));
    };
    try {
      render(<Menu />);
      screen.getByText('Контакты').focus();
      tab();
      expect(document.activeElement.textContent).toBe('Каталог');
      expect(asked.every((options) => options?.visibilityProperty === true)).toBe(true);
    } finally {
      delete Element.prototype.checkVisibility;
    }
  });

  it('выключенная ловушка клавишу Tab не перехватывает', () => {
    render(<Menu active={false} />);
    const link = screen.getByText('Контакты');
    link.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(link);
  });
});
