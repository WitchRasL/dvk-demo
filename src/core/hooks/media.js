// Медиазапросы — один источник для ядра и вариантов: reduced-motion, тонкий указатель, ширина окна.
// Хуки подписаны на изменение настройки; функции без «use» — разовая проверка в обработчиках и сторах.
import { useCallback, useSyncExternalStore } from 'react';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
/** Мышь или тачпад: есть наведение и точный указатель. */
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

/** Разовая проверка media query; без matchMedia (старые окружения, тесты) — false. */
export function matchesMedia(query) {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/** Подписка на media query без провайдера; без matchMedia — false. */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (notify) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const list = window.matchMedia(query);
      if (list.addEventListener) list.addEventListener('change', notify);
      else list.addListener?.(notify);
      return () => {
        if (list.removeEventListener) list.removeEventListener('change', notify);
        else list.removeListener?.(notify);
      };
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => matchesMedia(query), () => false);
}

export const usePrefersReducedMotion = () => useMediaQuery(REDUCED_MOTION_QUERY);
export const useFinePointer = () => useMediaQuery(FINE_POINTER_QUERY);

export const prefersReducedMotion = () => matchesMedia(REDUCED_MOTION_QUERY);
export const hasFinePointer = () => matchesMedia(FINE_POINTER_QUERY);
