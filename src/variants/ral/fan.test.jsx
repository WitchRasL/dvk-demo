// «Веер направлений» и меню телефона «Палитры RAL»: незавершённая перекраска не переживает смену варианта,
// модальное меню удерживает фокус.
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { LocationProbe, installBrowserStubs, resetStores } from '../../core/pages/test-utils.jsx';
import { VariantProvider } from '../../core/variants/VariantContext.jsx';
import { FieldLink, RepaintLayer } from './Fan.jsx';
import { Header } from './Header.jsx';

beforeAll(installBrowserStubs);
afterEach(() => {
  cleanup();
  delete Element.prototype.animate;
});

describe('перекраска веером', () => {
  function Site() {
    return (
      <MemoryRouter initialEntries={['/ral']}>
        <FieldLink direction="metal" to="/ral/catalog/metal">
          Металлическая мебель
        </FieldLink>
        <RepaintLayer />
        <LocationProbe />
      </MemoryRouter>
    );
  }

  it('вариант сменили посреди заливки — при возврате заливка не доигрывается и не уводит на старый адрес', () => {
    // заливка идёт (Web Animations есть) и не успевает закончиться
    Element.prototype.animate = () => ({ finished: new Promise(() => {}) });
    const first = render(<Site />);
    fireEvent.click(screen.getByRole('link', { name: 'Металлическая мебель' }));
    expect(first.container.querySelector('.ral-repaint')).not.toBeNull();
    expect(screen.getByTestId('location').textContent).toBe('/ral');

    first.unmount(); // переключили вариант: шапка «Палитры RAL» со слоем заливки размонтирована

    const second = render(<Site />); // вернулись в «Палитру RAL»
    expect(second.container.querySelector('.ral-repaint')).toBeNull();
    expect(screen.getByTestId('location').textContent).toBe('/ral');
  });
});

describe('меню телефона', () => {
  async function renderHeader() {
    await resetStores();
    let view;
    await act(async () => {
      view = render(
        <MemoryRouter initialEntries={['/ral']}>
          <Suspense fallback={null}>
            <VariantProvider id="ral">
              <Header />
              <a href="#under">ссылка на странице под меню</a>
            </VariantProvider>
          </Suspense>
        </MemoryRouter>,
      );
    });
    await waitFor(() => screen.getByRole('button', { name: 'Меню' }), { timeout: 4000 });
    return view;
  }
  const tab = (shiftKey = false) => fireEvent.keyDown(document.activeElement, { key: 'Tab', shiftKey });

  it('объявлено модальным и удерживает фокус: с последней ссылки Tab ведёт на кнопку закрытия, а не на страницу', async () => {
    await renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    const dialog = screen.getByRole('dialog', { name: 'Меню' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.contains(document.activeElement)).toBe(true); // фокус вошёл в меню

    const inside = within(dialog).getAllByRole('link');
    const last = inside.at(-1);
    last.focus();
    tab();
    const burger = screen.getByRole('button', { name: 'Закрыть меню' });
    expect(document.activeElement).toBe(burger);
    tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    burger.focus();
    tab(true);
    expect(document.activeElement).toBe(last);
  });

  it('Esc закрывает меню и возвращает фокус на кнопку меню', async () => {
    await renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Меню' }));
    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Меню' }));
  });
});
