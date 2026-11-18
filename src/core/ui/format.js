// Мелкие форматтеры текстов интерфейса: склонение, общие формы слов, цена, габариты, телефон для tel:.
// Подписи материалов и маркер «[уточнить]» живут в словаре каталога и отсюда только переэкспортируются.
export { UNKNOWN, lightLabel, materialLabel } from '../catalog/labels.js';

/** Склонение по числу: plural(21, ['товар', 'товара', 'товаров']) → 'товар'. */
export function plural(count, [one, few, many]) {
  const n = Math.abs(Math.trunc(Number(count))) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

/** Формы слов для счётчиков — одни на ядро и все варианты. */
export const WORD_FORMS = Object.freeze({
  position: ['позиция', 'позиции', 'позиций'],
  product: ['товар', 'товара', 'товаров'],
  series: ['серия', 'серии', 'серий'],
  section: ['раздел', 'раздела', 'разделов'],
  project: ['проект', 'проекта', 'проектов'],
});

/** Слово в нужной форме: wordFor(408, 'position') → 'позиций'. */
export function wordFor(count, word) {
  return plural(count, WORD_FORMS[word]);
}

/** Число со словом: countText(408, 'position') → '408 позиций'. */
export function countText(count, word) {
  return `${count} ${wordFor(count, word)}`;
}

const priceFormat = new Intl.NumberFormat('ru-RU');

/** Цена товара: «69 734 ₽» или пометка из данных, иначе «по запросу». Цену не выдумываем. */
export function formatPrice(product) {
  if (typeof product?.price === 'number' && Number.isFinite(product.price)) return `${priceFormat.format(product.price)} ₽`;
  return product?.priceNote || 'по запросу';
}

const UNITS = { mm: 'мм', cm: 'см', m: 'м' };

/** Габариты «Ш × В × Г» из product.dimensions; нет ни одного размера — null. */
export function formatDimensions(dimensions) {
  if (!dimensions) return null;
  const parts = [dimensions.w, dimensions.h, dimensions.d];
  if (parts.some((value) => typeof value !== 'number')) return null;
  return `${parts.join(' × ')} ${UNITS[dimensions.unit] ?? dimensions.unit ?? ''}`.trim();
}

/** Телефон для ссылки tel: «+78124619751». Ведущая 8 считается кодом России. */
export function toTel(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return `+${digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits}`;
}
