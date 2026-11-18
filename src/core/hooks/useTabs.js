// Табы (WAI-ARIA Tabs, выбор следует за фокусом): состояние, клавиатура и атрибуты.
// Разметку и вид рисует вариант — он только раскладывает listProps, tabProps(i) и panelProps по своим элементам.
import { useCallback, useId, useRef, useState } from 'react';

const STEPS = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

/**
 * Куда ведёт клавиша: стрелки — соседний таб по кругу, Home и End — края.
 * @returns {number|null} индекс таба или null, если клавиша не про табы
 */
export function tabKeyTarget(key, index, count) {
  if (!(count > 0)) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key in STEPS) return (index + STEPS[key] + count) % count;
  return null;
}

/**
 * @param {{ count: number, initial?: number, orientation?: 'vertical'|'horizontal' }} options
 * @returns {{ selected: number, select: (index: number, options?: { focus?: boolean }) => void,
 *   listProps: object, tabProps: (index: number) => object, panelProps: object }}
 */
export function useTabs({ count, initial = 0, orientation = 'vertical' }) {
  const baseId = useId();
  const nodes = useRef([]);
  const [state, setState] = useState(initial);
  const selected = Math.min(Math.max(0, state), Math.max(0, count - 1));

  const select = useCallback(
    (index, { focus = false } = {}) => {
      if (!(count > 0)) return;
      const next = ((index % count) + count) % count;
      setState(next);
      if (focus) nodes.current[next]?.focus();
    },
    [count],
  );

  const onKeyDown = (event) => {
    const next = tabKeyTarget(event.key, selected, count);
    if (next == null) return;
    event.preventDefault();
    select(next, { focus: true });
  };

  const tabId = (index) => `${baseId}-tab-${index}`;
  const panelId = `${baseId}-panel`;

  return {
    selected,
    select,
    listProps: { role: 'tablist', 'aria-orientation': orientation, onKeyDown },
    tabProps: (index) => ({
      type: 'button',
      role: 'tab',
      id: tabId(index),
      'aria-selected': index === selected,
      'aria-controls': panelId,
      tabIndex: index === selected ? 0 : -1,
      onClick: () => select(index),
      ref: (node) => {
        nodes.current[index] = node;
      },
    }),
    panelProps: { role: 'tabpanel', id: panelId, 'aria-labelledby': tabId(selected), tabIndex: 0 },
  };
}
