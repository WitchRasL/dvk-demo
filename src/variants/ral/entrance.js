// Появление по скроллу без «пустого» первого кадра: прячется только то, что в момент монтирования ниже экрана.
// 'idle' — видно сразу (уже на экране, reduced-motion, нет IntersectionObserver); 'pending' — ждёт; 'shown' — играет вход.
import { useLayoutEffect, useState } from 'react';
import { prefersReducedMotion } from '../../core/hooks/media.js';

/**
 * @param {{ current: Element|null }} ref
 * @param {{ immediate?: boolean | ((element: Element) => boolean), threshold?: number }} [options] immediate — играть сразу (шаг квиза)
 */
export function useEntrance(ref, { immediate = false, threshold = 0.9 } = {}) {
  const [state, setState] = useState('idle');
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion() || typeof window === 'undefined') return undefined;
    if (immediate === true || (typeof immediate === 'function' && immediate(element))) {
      setState('shown');
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') return undefined;
    if (element.getBoundingClientRect().top < window.innerHeight * threshold) return undefined;
    setState('pending');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setState('shown');
        observer.disconnect();
      },
      { rootMargin: '0px 0px -14% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}
