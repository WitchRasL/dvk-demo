// Все пути к ассетам — через asset(): на GitHub Pages сайт живёт в /dvk-style-redesign/.
const EXTERNAL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

/**
 * @param {string} path путь внутри public/, например 'images/products/<slug>/1-800.webp'
 * @returns {string} путь от import.meta.env.BASE_URL; внешние адреса и data: — без изменений
 */
export function asset(path) {
  const value = String(path ?? '');
  if (EXTERNAL.test(value)) return value;
  const base = import.meta.env.BASE_URL || '/';
  return `${base.endsWith('/') ? base : `${base}/`}${value.replace(/^\/+/, '')}`;
}
