// Чистая логика «Режима чертёж» и спецификации: что рисовать по данным товара. Ничего не выдумываем:
// нет размера — на размерной линии [уточнить]; подсветка не указана — слоя LED нет, есть пометка.

import { UNKNOWN } from '../../../core/ui/format.js';

// Маркер «[уточнить]» — общий, из ядра; переэкспорт — для модулей варианта.
export { UNKNOWN };

/** Шаблоны чертежей по `product.kind` (interfaces.md); всё прочее — «other». */
export const TEMPLATES = ['showcase', 'counter', 'cabinet', 'rack', 'workbench', 'bench', 'playground', 'island', 'other'];

// Уточнения шаблона, чтобы чертёж повторял форму изделия. Карусель узнаётся по названию из данных;
// дуговая скамья — по фото товара: в данных формы в плане нет, поэтому список позиций — здесь.
const CAROUSEL = /карусел/i;
const ARC_BENCHES = ['skameyka-na-betonnom-osnovanii-s-222'];

/** Шаблоны, где рисуется условная компоновка, а не изделие: под ними подпись «Габаритная схема». */
const CONDITIONAL = ['playground', 'other'];

const specValue = (product, pattern) => product?.specs?.find((spec) => pattern.test(spec.label))?.value ?? null;

function templateFor(product) {
  const base = TEMPLATES.includes(product?.kind) ? product.kind : 'other';
  if (base === 'playground' && CAROUSEL.test(product?.name ?? '')) return 'carousel';
  if (base === 'bench' && ARC_BENCHES.includes(product?.slug)) return 'bench-arc';
  return base;
}

/** Детали шаблона из характеристик: тумба и экран верстака, число ярусов стеллажа. Нет в данных — не рисуем. */
function partsFor(product, dimensions) {
  const labels = (product?.specs ?? []).map((spec) => `${spec.label} ${spec.value}`).join(' ');
  const screen = specValue(product, /наличие экрана/i);
  // обозначение стеллажа «2500/1010x800/4»: высота / ширина × глубина / ярусы
  const levels = String(product?.name ?? '').match(/\d+\/\d+[xх]\d+\/(\d)(?!\d)/i);
  return {
    pedestal: /тумб/i.test(labels),
    screen: screen ? /есть/i.test(screen) : (dimensions?.h ?? 0) > 1300,
    levels: levels ? Number(levels[1]) : null,
  };
}

/** Тип листа по направлению (R18): ритейл — фасады и узлы, благоустройство — генплан, металл — деталировка и нагрузки. */
export const SHEET_TYPES = {
  retail: { view: 'facade', name: 'Фасады и узлы' },
  landscape: { view: 'plan', name: 'Генплан' },
  metal: { view: 'detail', name: 'Деталировка и нагрузки' },
};

const LIT = ['warm', 'cold', 'rgb'];

// Обозначение — токен с цифрой и разделителем (МВП-30, ТРК-1.1, ШК-8(A4), 2500/1010x800/4).
const CODE = /^№?[A-Za-zА-ЯЁа-яё0-9()]+(?:[-./][A-Za-zА-ЯЁа-яё0-9()]+)+$/;
const SERIES = /^[A-ZА-ЯЁ]{2,}$/; // серия капсом перед числовым кодом: «СТФ 1034-2.5», «HARD 2000-062000»

/**
 * Обозначение позиции из названия товара.
 * @param {{ name?: string }} product
 * @returns {string|null} null — в названии обозначения нет (интерфейс покажет [уточнить])
 */
export function designation(product) {
  const tokens = String(product?.name ?? '')
    .replace(/["«»“”]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const index = tokens.findIndex((token) => /\d/.test(token) && CODE.test(token));
  if (index < 0) return null;
  const code = tokens[index];
  const previous = tokens[index - 1];
  // числовой код без букв — с серией перед ним, если она есть
  if (!/[A-Za-zА-ЯЁа-яё]/.test(code.replace(/x/gi, '')) && previous && SERIES.test(previous)) return `${previous} ${code}`;
  return code;
}

const size = (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? String(value) : UNKNOWN);

/**
 * Что рисует «Режим чертёж» для товара.
 * @param {object} product
 * @returns {{
 *   template: string, view: 'facade'|'plan'|'detail',
 *   layers: ('frame'|'glass'|'led'|'dims')[],
 *   led: 'yes'|'no'|'unknown',
 *   dims: { w: string, h: string, d: string },
 *   ratio: { w: number, h: number, d: number }|null,
 *   load: string|null,
 *   schematic: boolean,                 // шаблон условный или пропорции не по габаритам — «Габаритная схема»
 *   parts: { pedestal: boolean, screen: boolean, levels: number|null },
 * }}
 */
export function drawingSpec(product) {
  const template = templateFor(product);
  const materials = Array.isArray(product?.materials) ? product.materials : [];
  const lighting = product?.lighting ?? null;
  const led = LIT.includes(lighting) ? 'yes' : lighting === 'none' ? 'no' : 'unknown';
  const glass = materials.includes('glass');
  const dimensions = product?.dimensions ?? null;
  const known = dimensions && [dimensions.w, dimensions.h, dimensions.d].every((value) => typeof value === 'number' && value > 0);

  return {
    template,
    view: SHEET_TYPES[product?.direction]?.view ?? 'facade',
    layers: ['frame', ...(glass ? ['glass'] : []), ...(led === 'yes' ? ['led'] : []), 'dims'],
    led,
    dims: { w: size(dimensions?.w), h: size(dimensions?.h), d: size(dimensions?.d) },
    ratio: known ? { w: dimensions.w, h: dimensions.h, d: dimensions.d } : null,
    load: typeof product?.load === 'number' && product.load > 0 ? String(product.load) : null,
    schematic: CONDITIONAL.includes(template) || !known,
    parts: partsFor(product, dimensions),
  };
}

/** Материалы строкой для спецификации: «стекло, ЛДСП»; аббревиатуры остаются заглавными. */
export function materialsText(product, label = (value) => value) {
  const list = Array.isArray(product?.materials) ? product.materials : [];
  return list
    .map((value) => {
      const text = String(label(value));
      return text === text.toUpperCase() ? text : text.toLowerCase();
    })
    .join(', ');
}

/** Подпись слоя для переключателей. */
export const LAYER_LABELS = { frame: 'Каркас', glass: 'Стекло', led: 'LED', dims: 'Размеры' };

/** Подпись под видом: условный шаблон — схема, а не чертёж. */
export const SCHEMATIC_LABEL = 'Габаритная схема';
