// Мелкие форматтеры текстов интерфейса: склонение, цена, габариты, телефон для tel:.

/** Склонение по числу: plural(21, ['товар', 'товара', 'товаров']) → 'товар'. */
export function plural(count, [one, few, many]) {
  const n = Math.abs(Math.trunc(Number(count))) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
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

/** Подписи материалов. В ядре каталога нет подписей для МДФ, фанеры и бетона (в фасетах они остаются английскими) — полный список здесь. */
const MATERIAL_NAMES = {
  metal: 'Металл',
  glass: 'Стекло',
  ldsp: 'ЛДСП',
  mdf: 'МДФ',
  wood: 'Дерево',
  plywood: 'Фанера',
  plastic: 'Пластик',
  concrete: 'Бетон',
  stone: 'Камень',
};

export function materialLabel(value) {
  return MATERIAL_NAMES[value] ?? value;
}
