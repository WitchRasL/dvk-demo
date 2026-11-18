// Состояние меню шапки — одно на три варианта: мега-меню и меню телефона.
// Открыто не больше одного меню; его закрывают смена страницы, Esc (фокус возвращается на кнопку меню,
// если он был в шапке или в меню) и нажатие вне шапки. Разметку, вид и наведение мышью задаёт вариант.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router';

/**
 * @param {{ containerRef?: { current: Element|null }, keepOnOutsidePress?: string[] }} [options]
 *   containerRef — шапка: нажатие вне её закрывает меню; keepOnOutsidePress — меню, которые нажатие вне не закрывает
 * @returns {{ open: string|null, isOpen: (name: string) => boolean, show: (name: string) => void,
 *   toggle: (name: string) => void, close: () => void, panelId: (name: string) => string,
 *   triggerProps: (name: string) => { 'aria-expanded': boolean, 'aria-controls': string } }}
 */
export function useHeaderMenu({ containerRef, keepOnOutsidePress } = {}) {
  const baseId = useId();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(null);
  const panelId = useCallback((name) => `${baseId}-${name}`, [baseId]);
  const keepRef = useRef(keepOnOutsidePress);
  keepRef.current = keepOnOutsidePress;
  const restoreRef = useRef(null); // кнопка меню, закрытого по Esc: на неё вернётся фокус

  // Новая страница — меню закрыты.
  useEffect(() => {
    setOpen(null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      const container = containerRef?.current;
      const id = panelId(open);
      // Фокус возвращается на кнопку меню, только если он был в шапке или в самом меню:
      // меню, открытое наведением, по Esc не забирает фокус у поля на странице.
      const focused = document.activeElement;
      const inside = Boolean(focused) && (container ? container.contains(focused) : Boolean(focused.closest?.(`[id="${id}"], [aria-controls="${id}"]`)));
      restoreRef.current = inside ? ([...(container ?? document).querySelectorAll('[aria-controls]')].find((node) => node.getAttribute('aria-controls') === id) ?? null) : null;
      setOpen(null);
    };
    const onPointer = (event) => {
      if (keepRef.current?.includes(open)) return;
      const container = containerRef?.current;
      if (container && !container.contains(event.target)) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, containerRef, panelId]);

  // Фокус на кнопку меню возвращается после того, как меню убрано со страницы:
  // пока открыт модальный <dialog>, кнопка под ним инертна и фокус не принимает.
  useEffect(() => {
    if (open !== null || !restoreRef.current) return;
    const trigger = restoreRef.current;
    restoreRef.current = null;
    if (trigger.isConnected) trigger.focus();
  }, [open]);

  const show = useCallback((name) => setOpen(name), []);
  const close = useCallback(() => setOpen(null), []);
  const toggle = useCallback((name) => setOpen((current) => (current === name ? null : name)), []);

  return {
    open,
    isOpen: (name) => open === name,
    show,
    toggle,
    close,
    panelId,
    triggerProps: (name) => ({ 'aria-expanded': open === name, 'aria-controls': panelId(name) }),
  };
}
