// Hero-ролик «Палитры RAL»: источники, кадр-заглушка, камера, фазы и пояснения-ярлыки.
// Тексты пояснений берутся из данных (company.json, products.json) — без выдумки; не нашлось — «[уточнить]».
// Раскадровка с привязкой каждого пояснения к отрезку и точке кадра — docs/hero-video/ral.md.
import { getCompany, getProduct } from '../../core/catalog/index.js';

const UNKNOWN = '[уточнить]';
const company = getCompany();

const fact = (id) => company.facts?.find((item) => item.id === id)?.text ?? UNKNOWN;
const step = (id) => company.cycle?.find((item) => item.id === id) ?? { title: UNKNOWN, text: UNKNOWN };
const service = (id) => company.services?.find((item) => item.id === id) ?? { title: UNKNOWN, text: UNKNOWN };

/** Значение характеристики товара и его название — источник пояснения. */
function spec(slug, label) {
  const product = getProduct(slug);
  const value = product?.specs?.find((item) => item.label === label)?.value;
  return { text: value ? String(value) : UNKNOWN, note: product?.name ?? null };
}

// Опорный кадр — интерьер магазина парфюмерии в Балашихе (проект ДВК, фото с dvk-style.ru).
const posterPhoto = company.heroPhotos?.find((photo) => photo.project === 'perfume-balashikha') ?? company.heroPhotos?.[0];

const production = step('production');
const install = step('install');
const glass = spec('vitriny-peredney-linii', 'Материалы');
const board = spec('vitrina-dlya-chasov-vchyu-23', 'Материалы');
const light = spec('prilavok-dlya-optiki-pod-20', 'Дополнительные опции');

/**
 * Пояснения: отрезок прогресса [from, to), точка кадра (x, y — доли рамки), код-ярлык, заголовок, текст и источник.
 * Отрезки идут по фазам: проектирование → производство → монтаж.
 */
export const HERO_CALLOUTS = [
  { id: 'design', from: 0.03, to: 0.23, x: 0.56, y: 0.4, code: 'Проект', title: service('shop-design').title, text: fact('free-shop-design') },
  { id: 'glass', from: 0.26, to: 0.38, x: 0.63, y: 0.68, code: 'Стекло 5мм', title: 'Полированное стекло', text: glass.text, note: glass.note },
  { id: 'board', from: 0.38, to: 0.5, x: 0.83, y: 0.72, code: 'ДСП 16 мм', title: 'Противоударная кромка', text: board.text, note: board.note },
  { id: 'light', from: 0.5, to: 0.62, x: 0.2, y: 0.46, code: 'Подсветка', title: 'Подсветка витрин', text: light.text, note: light.note },
  { id: 'production', from: 0.62, to: 0.76, x: 0.4, y: 0.3, code: 'Колпино', title: production.title, text: production.text },
  { id: 'install', from: 0.79, to: 1, x: 0.68, y: 0.84, code: 'Монтаж', title: install.title, text: fact('night-install') },
];

/** Фазы ролика — они же глаголы заголовка: «проектируем, производим и монтируем». */
export const HERO_PHASES = [
  { id: 'design', label: 'Проектирование', from: 0, to: 0.25 },
  { id: 'production', label: 'Производство', from: 0.25, to: 0.77 },
  { id: 'install', label: 'Монтаж', from: 0.77, to: 1 },
];

export const heroConfig = {
  sources: { desktop: 'media/ral/hero.mp4', mobile: 'media/ral/hero-mobile.mp4' },
  poster: { base: posterPhoto?.base, alt: posterPhoto?.alt ?? 'Интерьер магазина, проект ДВК Стиль' },
  // Камера заглушки: медленный наезд и сдвиг к центральной стойке.
  camera: { from: { x: 0, y: 0, scale: 1.03 }, to: { x: -3, y: -2, scale: 1.16 } },
  callouts: HERO_CALLOUTS,
  phases: HERO_PHASES,
  lengthVh: 360,
  mobileLengthVh: 230,
};
