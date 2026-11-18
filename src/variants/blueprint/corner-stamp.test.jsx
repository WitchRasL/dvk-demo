// Штамп в углу главной «Чертежа»: содержание комплекта с клавиатуры — фокус после выбора листа не теряется,
// скрытый на первом листе штамп недоступен.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CornerStamp } from './home/CornerStamp.jsx';
import { Sheet } from './home/Sheet.jsx';

let observers = [];
const NativeObserver = globalThis.IntersectionObserver;

beforeEach(() => {
  observers = [];
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  globalThis.IntersectionObserver = NativeObserver;
});

/** Лист с номером n вошёл в середину окна. */
function showSheet(n) {
  const target = document.querySelector(`[data-sheet="${n}"]`);
  act(() => observers.forEach((observer) => observer.callback([{ isIntersecting: true, target }])));
}

function renderHome() {
  return render(
    <>
      <Sheet id="hero" labelledBy="t-hero">
        <h1 id="t-hero">Проектируем, производим и монтируем</h1>
      </Sheet>
      <Sheet id="cycle" labelledBy="t-cycle">
        <div>
          <h2 id="t-cycle">Полный цикл</h2>
          <a href="#step">Шаг цикла</a>
        </div>
      </Sheet>
      <CornerStamp />
    </>,
  );
}

describe('штамп в углу главной', () => {
  it('на первом листе штамп скрыт и недоступен с клавиатуры и для скринридера', () => {
    const { container } = renderHome();
    const stamp = container.querySelector('.bp-corner');
    expect(stamp.classList.contains('is-shown')).toBe(false);
    expect(stamp.hasAttribute('inert')).toBe(true);

    showSheet(3);
    expect(stamp.classList.contains('is-shown')).toBe(true);
    expect(stamp.hasAttribute('inert')).toBe(false);
  });

  it('после выбора листа в содержании фокус стоит на заголовке этого листа', () => {
    const { container } = renderHome();
    showSheet(3);
    fireEvent.click(container.querySelector('.bp-corner__stamp'));
    const list = screen.getByRole('list', { name: 'Содержание комплекта' });
    fireEvent.click(within(list).getByRole('button', { name: /Полный цикл/ }));

    const heading = document.getElementById('t-cycle');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(heading);
    expect(container.querySelector('.bp-corner__list').hidden).toBe(true);
  });

  it('первый лист: фокус уходит на его заголовок (h1), а не пропадает в скрытом штампе', () => {
    const { container } = renderHome();
    showSheet(3);
    fireEvent.click(container.querySelector('.bp-corner__stamp'));
    fireEvent.click(within(screen.getByRole('list', { name: 'Содержание комплекта' })).getByRole('button', { name: /Общий вид/ }));
    expect(document.activeElement).toBe(document.getElementById('t-hero'));
  });

  it('Esc закрывает содержание и возвращает фокус на кнопку штампа', () => {
    const { container } = renderHome();
    showSheet(3);
    const button = container.querySelector('.bp-corner__stamp');
    fireEvent.click(button);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(container.querySelector('.bp-corner__list').hidden).toBe(true);
    expect(document.activeElement).toBe(button);
  });
});
