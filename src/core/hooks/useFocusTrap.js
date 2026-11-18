// Удержание фокуса в модальном меню: Tab и Shift+Tab ходят по кругу внутри, на страницу под меню не уходят.
// Нужен там, где меню объявлено aria-modal, но собрано не на нативном <dialog>.
import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** Элементы контейнера, до которых доходит Tab, в порядке документа. */
export function focusableIn(container) {
  if (!container) return [];
  return [...container.querySelectorAll(FOCUSABLE)].filter(
    (node) => !node.closest('[hidden], [inert]') && (typeof node.checkVisibility !== 'function' || node.checkVisibility()),
  );
}

const inDocumentOrder = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

/**
 * @param {{ current: Element|null }} ref контейнер меню
 * @param {{ active?: boolean, include?: Array<{ current: Element|null }>, initialFocus?: boolean }} [options]
 *   include — элементы вне контейнера, входящие в круг (кнопка закрытия в шапке);
 *   initialFocus — при включении перевести фокус на первый элемент меню
 */
export function useFocusTrap(ref, { active = true, include, initialFocus = true } = {}) {
  const includeRef = useRef(include);
  includeRef.current = include;

  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return undefined;
    const loop = () => {
      const extra = (includeRef.current ?? []).map((item) => item?.current).filter((node) => node && !node.disabled);
      return [...extra, ...focusableIn(container)].sort(inDocumentOrder);
    };
    if (initialFocus && !container.contains(document.activeElement)) focusableIn(container)[0]?.focus();
    const onKey = (event) => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const nodes = loop();
      if (!nodes.length) return;
      event.preventDefault();
      const index = nodes.indexOf(document.activeElement);
      const next = index === -1 ? 0 : (index + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length;
      nodes[next].focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ref, active, initialFocus]);
}
