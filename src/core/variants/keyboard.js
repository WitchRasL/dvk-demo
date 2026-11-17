import { VARIANTS } from './registry.js';

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isEditable(target) {
  if (!target) return false;
  return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable === true;
}

/**
 * Клавиши 1/2/3 → id варианта; null, если событие не про переключение:
 * поле ввода, модификаторы, автоповтор, уже обработанное событие, другая клавиша.
 * @param {{ key: string, target?: any, ctrlKey?: boolean, metaKey?: boolean, altKey?: boolean, repeat?: boolean, defaultPrevented?: boolean }} event
 * @returns {string | null}
 */
export function variantForKey(event) {
  if (event.defaultPrevented || event.repeat) return null;
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (isEditable(event.target)) return null;
  const variant = VARIANTS.find((item) => String(item.number) === event.key);
  return variant ? variant.id : null;
}
