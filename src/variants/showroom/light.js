// Свет «Шоурума»: когда зажигать подсветку (по скроллу), где луч курсора, магнит кнопки.
// Всё, что движется, двигается через transform; без тонкого указателя и при reduced-motion — без движения.
import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '../../core/scroll-video/useScrollVideo.js';

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
/** Мышь или тачпад: только здесь курсор работает лучом света. */
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)');

/**
 * Подсветка зажигается, когда элемент вошёл в окно, и больше не гаснет.
 * Без IntersectionObserver и при reduced-motion — горит сразу.
 * @returns {[import('react').RefObject<HTMLElement>, boolean]}
 */
export function useLitOnView({ threshold = 0.2, rootMargin = '0px 0px -12% 0px' } = {}) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || seen) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [seen, threshold, rootMargin]);
  return [ref, seen || reduce];
}

/**
 * Пятна света внутри контейнера идут за курсором: каждому элементу `selector` ставится transform
 * в координатах его родителя (родитель — рамка или фото плитки, `overflow: hidden`).
 * На контейнере, пока курсор внутри, стоит `data-pointer="in"` — по нему CSS проявляет пятна.
 */
export function usePointerLight(containerRef, { selector = '[data-spot]', enabled = true } = {}) {
  useEffect(() => {
    const root = containerRef.current;
    if (!enabled || !root) return undefined;
    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      root.querySelectorAll(selector).forEach((spot) => {
        const box = spot.parentElement.getBoundingClientRect();
        spot.style.transform = `translate3d(${(x - box.left).toFixed(1)}px, ${(y - box.top).toFixed(1)}px, 0)`;
      });
    };
    const move = (event) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const enter = (event) => {
      move(event);
      root.setAttribute('data-pointer', 'in');
    };
    const leave = () => root.removeAttribute('data-pointer');
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerenter', enter);
    root.addEventListener('pointerleave', leave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerenter', enter);
      root.removeEventListener('pointerleave', leave);
      root.removeAttribute('data-pointer');
    };
  }, [containerRef, selector, enabled]);
}

/** Магнитная кнопка: подтягивается к курсору на несколько пикселей и плавно возвращается. */
export function useMagnetic(ref, { strength = 0.3, max = 10, enabled = true } = {}) {
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return undefined;
    const target = element.firstElementChild ?? element;
    let frame = 0;
    let next = '';
    const apply = () => {
      frame = 0;
      target.style.transform = next;
    };
    const set = (value) => {
      next = value;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const move = (event) => {
      const box = element.getBoundingClientRect();
      const clamp = (value) => Math.max(-max, Math.min(max, value));
      const dx = clamp((event.clientX - (box.left + box.width / 2)) * strength);
      const dy = clamp((event.clientY - (box.top + box.height / 2)) * strength);
      set(`translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`);
    };
    const leave = () => set('');
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', leave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
      target.style.transform = '';
    };
  }, [ref, strength, max, enabled]);
}
