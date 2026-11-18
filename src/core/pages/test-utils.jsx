// Общие помощники для тестов страниц: приложение в MemoryRouter, сброс хранилищ ядра, заглушки jsdom.
import { useEffect } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { act, cleanup, render } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../../App.jsx';
import { useCity } from '../city/index.js';
import { useKp } from '../kp/index.js';
import { useQuiz } from '../request/index.js';

/** В jsdom нет части браузерных API, на которые опираются страницы. */
export function installBrowserStubs() {
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

export function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

/** Рендерит весь сайт по адресу (маршруты, ленивые страницы, оболочка варианта). */
export async function renderApp(path) {
  let view;
  await act(async () => {
    view = render(
      <MemoryRouter initialEntries={[path]}>
        <App />
        <LocationProbe />
      </MemoryRouter>,
    );
  });
  return view;
}

function Reset({ seed }) {
  const kp = useKp();
  const quiz = useQuiz();
  const { setCity } = useCity();
  useEffect(() => {
    kp.clear();
    quiz.reset();
    setCity('spb');
    for (const [id, qty] of seed) kp.add(id, qty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Чистое состояние хранилищ: пустой запрос КП, пустой квиз, город — Санкт-Петербург; seed — [[id, qty]] в КП. */
export async function resetStores(seed = []) {
  await act(async () => {
    render(<Reset seed={seed} />);
  });
  cleanup();
  localStorage.removeItem('dvk-quiz-v1');
}
