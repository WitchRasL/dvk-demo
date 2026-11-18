// Текущее поле сайта: направление страницы (каталог, товар, отрасль, проект) или последнее выбранное в веере.
// Выбор запоминается (localStorage['dvk-ral-field']); без хранилища — в памяти.
// Перекраска веером: слой-заливка цвета нового поля раскрывается clip-path от точки клика, затем переход в направление.
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';
import { getDirections, getIndustry, getProduct, getProject } from '../../core/catalog/index.js';
import { createPersistedStore, useStore } from '../../core/kp/persisted-store.js';
import { DIRECTION_FIELDS } from './palette.js';

export const FIELD_KEY = 'dvk-ral-field';

const isDirection = (value) => DIRECTION_FIELDS.includes(value);

const storedField = createPersistedStore({
  key: FIELD_KEY,
  reducer: (state, next) => (isDirection(next) ? next : state),
  initial: () => null,
  serialize: (state) => state,
  deserialize: (raw) => (isDirection(raw) ? raw : null),
  sync: true,
});

/** Направление, которое задаёт открытая страница, или null. */
export function directionFromRoute(pathname, search = '') {
  const [, section, slug] = pathname.split('/').filter(Boolean);
  if (section === 'catalog' && slug) return getDirections().find((direction) => direction.slug === slug)?.id ?? null;
  if (section === 'product' && slug) return getProduct(slug)?.direction ?? null;
  if (section === 'solutions' && slug) return getIndustry(slug)?.directions?.[0] ?? null;
  if (section === 'projects') {
    const direction = slug ? getProject(slug)?.direction : new URLSearchParams(search).get('direction');
    return isDirection(direction) ? direction : null;
  }
  return null;
}

/** @returns {string|null} направление поля сейчас: со страницы, иначе последнее выбранное; null — грунт */
export function useCurrentDirection() {
  const { pathname, search } = useLocation();
  const stored = useStore(storedField);
  const fromRoute = useMemo(() => directionFromRoute(pathname, search), [pathname, search]);
  useEffect(() => {
    if (fromRoute && fromRoute !== stored) storedField.dispatch(fromRoute);
  }, [fromRoute, stored]);
  return fromRoute ?? stored;
}

export function chooseDirection(direction) {
  storedField.dispatch(direction);
}

// --- перекраска -------------------------------------------------------------

let repaint = null; // { id, direction, to, x, y }
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());
let counter = 0;

const subscribeRepaint = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useRepaint() {
  return useSyncExternalStore(subscribeRepaint, () => repaint, () => null);
}

export function finishRepaint(id) {
  if (repaint?.id === id) {
    repaint = null;
    emit();
  }
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Обработчик клика по образцу направления: заливка цветом и переход. Без анимаций (reduced-motion,
 * нет Web Animations) — мгновенная смена поля и переход.
 */
export function useRepaintLink(direction, to, navigate) {
  return useCallback(
    (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const canAnimate = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function' && !prefersReducedMotion();
      if (!canAnimate || repaint) {
        chooseDirection(direction);
        navigate(to);
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX || rect.left + rect.width / 2;
      const y = event.clientY || rect.top + rect.height / 2;
      counter += 1;
      repaint = { id: counter, direction, to, x, y };
      emit();
    },
    [direction, to, navigate],
  );
}
