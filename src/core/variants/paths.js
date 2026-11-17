// Чистые функции адресов: вариант — первый сегмент пути (`/#/<variant>/…`).
import { DEFAULT_VARIANT, isVariantId } from './registry.js';

/** Первые сегменты страниц ядра (см. маршруты в interfaces.md). */
export const PAGE_ROOTS = ['catalog', 'product', 'solutions', 'projects', 'about', 'contacts', 'request', 'privacy'];

function normalizeSearch(search) {
  if (!search) return '';
  const query = search.startsWith('?') ? search.slice(1) : search;
  return query ? `?${query}` : '';
}

function splitPath(pathname) {
  const path = pathname && pathname.startsWith('/') ? pathname : `/${pathname || ''}`;
  const [, first, rest] = /^\/([^/]*)(.*)$/.exec(path);
  return { first, rest };
}

/**
 * Тот же путь и query, но с другим вариантом в первом сегменте.
 * `/ral/catalog/metal` + `?q=шкаф` + `blueprint` → `/blueprint/catalog/metal?q=шкаф`.
 * Если первый сегмент — не вариант, вариант добавляется перед путём.
 * Неизвестный nextId заменяется DEFAULT_VARIANT.
 * @param {string} pathname @param {string} search @param {string} nextId @returns {string}
 */
export function swapVariantInPath(pathname, search, nextId) {
  const target = isVariantId(nextId) ? nextId : DEFAULT_VARIANT;
  const { first, rest } = splitPath(pathname);
  const tail = isVariantId(first) || !first ? rest : `/${first}${rest}`;
  return `/${target}${tail}${normalizeSearch(search)}`;
}

/**
 * Адрес для неизвестного варианта: DEFAULT_VARIANT с тем же остатком пути.
 * `/nope/catalog/metal` → `/showroom/catalog/metal`; путь страницы без варианта
 * (`/contacts`) получает вариант впереди: `/showroom/contacts`.
 * @param {string} pathname @param {string} search @returns {string}
 */
export function fallbackVariantPath(pathname, search) {
  const { first, rest } = splitPath(pathname);
  if (isVariantId(first)) return `/${first}${rest}${normalizeSearch(search)}`;
  const tail = PAGE_ROOTS.includes(first) ? `/${first}${rest}` : rest;
  return `/${DEFAULT_VARIANT}${tail}${normalizeSearch(search)}`;
}
