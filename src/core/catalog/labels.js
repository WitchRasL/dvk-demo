// Словарь подписей каталога — единственный источник: фасеты, чипы фильтров, характеристики и варианты
// читают подписи материалов и подсветки отсюда. Здесь же маркер того, чего нет в данных.

/** Видимая заглушка вместо факта, которого нет в данных (цена, срок, размер…). Ничего не выдумываем. */
export const UNKNOWN = '[уточнить]';

/** Подписи материалов (значения `product.materials`). */
export const MATERIAL_LABELS = Object.freeze({
  metal: 'Металл',
  glass: 'Стекло',
  ldsp: 'ЛДСП',
  mdf: 'МДФ',
  wood: 'Дерево',
  plywood: 'Фанера',
  plastic: 'Пластик',
  concrete: 'Бетон',
  stone: 'Камень',
});

/** Подписи подсветки (значения `product.lighting`). */
export const LIGHT_LABELS = Object.freeze({ warm: 'Тёплый свет', cold: 'Холодный свет', rgb: 'RGB', none: 'Без подсветки' });

/** Подпись материала; неизвестное значение из данных показывается как есть. */
export function materialLabel(value) {
  return MATERIAL_LABELS[value] ?? value;
}

/** Подпись подсветки; неизвестное значение из данных показывается как есть. */
export function lightLabel(value) {
  return LIGHT_LABELS[value] ?? value;
}
