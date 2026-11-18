// Этикетка карточки-образца: одна сетка подписи на каждой карточке (название · RAL/материал · габариты · артикул).
// Всё — из данных товара; чего нет — «[уточнить]».
import { UNKNOWN, materialLabel } from '../../core/ui/format.js';

// Обозначение модели в названии: «ШАМ-11-920», «ВТ-К-1», «LS-052F»; затем «HARD 2000-062000», «MS Pro 2500/…», «СТФ 1034-2.5», «BOXES №1-2».
const START = String.raw`(?<=^|[\s"«(])`;
const ARTICLE_PATTERNS = [
  new RegExp(`${START}[A-ZА-ЯЁ]{1,5}(?:-[A-ZА-ЯЁ]{1,3})?-\\d[\\dA-Za-zА-ЯЁа-яё.\\-()]*`, 'u'),
  new RegExp(`${START}[A-Z]{2,}(?:\\s[A-Z][a-z]+)*\\s\\d[\\d/x.\\-]*`, 'u'),
  new RegExp(`${START}[A-ZА-ЯЁ]{2,}\\s\\d[\\d.\\-]*`, 'u'),
  new RegExp(`${START}[A-ZА-ЯЁ]{2,}\\s№\\s?\\d[\\d\\-]*`, 'u'),
];

/** @param {string} name */
export function articleOf(name) {
  for (const pattern of ARTICLE_PATTERNS) {
    const match = String(name ?? '').match(pattern);
    if (match) return match[0];
  }
  return null;
}

function specValue(product, pattern) {
  const spec = (product?.specs ?? []).find((item) => pattern.test(String(item?.label ?? '')));
  const value = spec?.value == null ? '' : String(spec.value).trim();
  return value || null;
}

function finishOf(product) {
  const colour = specValue(product, /цвет/i);
  const codes = colour ? [...new Set([...colour.matchAll(/RAL\s?(\d{4})/gi)].map((match) => `RAL ${match[1]}`))] : [];
  if (codes.length) return { finish: codes.join(' / '), finishCaption: 'RAL' };
  const materials = (product?.materials ?? []).map(materialLabel).filter(Boolean);
  if (materials.length) return { finish: materials.join(', '), finishCaption: 'Материал' };
  return { finish: UNKNOWN, finishCaption: 'RAL / материал' };
}

function sizeOf(product) {
  const d = product?.dimensions;
  if (d && [d.w, d.h, d.d].every((value) => typeof value === 'number')) return `${d.w}×${d.h}×${d.d}`;
  return specValue(product, /размер|габарит/i) ?? UNKNOWN;
}

/**
 * @param {object} product товар из products.json
 * @returns {{ finish: string, finishCaption: string, size: string, article: string }}
 */
export function swatchLabel(product) {
  return {
    ...finishOf(product),
    size: sizeOf(product),
    article: articleOf(product?.name) ?? UNKNOWN,
  };
}
