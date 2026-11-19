// heroConfig «Шоурума»: ролик, его первый кадр, фазы, пояснения и светильники заглушки.
// Ролик — визуализация: ночной атриум торгового центра, камера по дуге обходит торговый островок, и на нём
// по очереди включается свет — споты навеса, витрины, подсветка цоколя (Higgsfield, Seedance 2.5, 4K).
// Тексты пояснений берутся из данных (company.json); чего нет — видимая заглушка «[уточнить]».
// Точки сняты с ролика покадрово — docs/hero-video/showroom.md.
import { UNKNOWN, getCycleStep, getFactText } from '../../core/catalog/index.js';

/** Размер кадра ролика: в его долях заданы все точки ниже. */
export const HERO_FRAME = Object.freeze({ width: 1920, height: 1080 });

/** Какая часть кадра остаётся в сцене, когда он обрезается (совпадает с object-position в home.css). */
export const HERO_FOCUS = Object.freeze({ x: 0.5, y: 0.5 });

/**
 * Точка кадра ролика → точка сцены. Кадр закрывает сцену целиком (object-fit: cover): по одной оси он
 * совпадает со сценой, по другой выходит за край, и лишнее срезается согласно focus.
 * @param {{ x: number, y: number }} point доли кадра 0..1
 * @param {{ width: number, height: number }} stage размер сцены в px
 * @param {{ x: number, y: number }} [focus] доля лишнего, срезаемая слева и сверху (0.5 — поровну)
 * @returns {{ x: number, y: number, visible: boolean }} доли сцены; visible — точка попала в сцену
 */
export function frameToStage(point, stage, focus = HERO_FOCUS) {
  const width = Number(stage?.width);
  const height = Number(stage?.height);
  if (!(width > 0) || !(height > 0)) return { x: point.x, y: point.y, visible: true };
  const scale = Math.max(width / HERO_FRAME.width, height / HERO_FRAME.height);
  const shown = { width: HERO_FRAME.width * scale, height: HERO_FRAME.height * scale };
  const x = (point.x * shown.width - (shown.width - width) * focus.x) / width;
  const y = (point.y * shown.height - (shown.height - height) * focus.y) / height;
  return { x, y, visible: x >= 0 && x <= 1 && y >= 0 && y <= 1 };
}

export const HERO_PHASES = [
  { id: 'design', label: 'Проектирование', from: 0, to: 0.34 },
  { id: 'production', label: 'Производство', from: 0.34, to: 0.67 },
  { id: 'install', label: 'Монтаж', from: 0.67, to: 1 },
];

/*
 * Пояснения. x, y — доли кадра ролика в середине отрезка: камера идёт по дуге, и за отрезок деталь смещается
 * на несколько процентов кадра. side — куда от точки уходит табличка, grow — вниз или вверх она растёт:
 * левая часть сцены занята заголовком, низ — входами в направления, поэтому точки стоят в правой половине кадра.
 */
export const HERO_CALLOUTS = [
  {
    // Островок ещё тёмный: латунная рама навеса, правый край. Табличка — под рамой.
    id: 'measure',
    from: 0.04,
    to: 0.15,
    x: 0.76,
    y: 0.25,
    side: 'left',
    grow: 'down',
    title: getCycleStep('measure')?.title ?? 'Замер',
    text: getFactText('same-day-measure'),
  },
  {
    // Витрины только что зажглись: правая стеклянная витрина островка, верхняя кромка.
    id: 'design',
    from: 0.19,
    to: 0.32,
    x: 0.75,
    y: 0.51,
    side: 'left',
    grow: 'up',
    title: getCycleStep('design')?.title ?? 'Дизайн-проект',
    text: getFactText('free-shop-design'),
  },
  {
    // Включилась подсветка цоколя: ореховый шпон и латунная кромка левого блока островка.
    id: 'production',
    from: 0.38,
    to: 0.62,
    x: 0.52,
    y: 0.7,
    side: 'right',
    grow: 'up',
    title: getCycleStep('production')?.title ?? 'Производство',
    text: getCycleStep('production')?.text ?? UNKNOWN,
    // Строке на телефоне хватает двух строк: вместо полного текста шага идёт конец короткого факта
    // («…в одном из цехов «Ижорских заводов» в Колпино»), он продолжает заголовок одной фразой.
    brief: getFactText('izhora').split(' — ').at(-1),
  },
  {
    // Островок собран и освещён, камера у его угла: рама навеса со спотами, правый край. Табличка — под рамой.
    id: 'install',
    from: 0.7,
    to: 0.94,
    x: 0.82,
    y: 0.14,
    side: 'left',
    grow: 'down',
    title: getCycleStep('install')?.title ?? 'Монтаж',
    text: getFactText('night-install'),
  },
];

/**
 * Светильники заглушки — только на случай, когда ролик не загрузился и в кадре стоит его первый кадр.
 * Подсвечивают тёмный островок первого кадра справа налево, к середине он освещён. x, y — доли кадра, at — прогресс сцены.
 */
export const HERO_LAMPS = [
  { id: 'showcase-right', x: 0.74, y: 0.56, at: 0.08, size: 0.3 },
  { id: 'canopy', x: 0.6, y: 0.26, at: 0.18, size: 0.34 },
  { id: 'showcase-left', x: 0.46, y: 0.56, at: 0.3, size: 0.3 },
];

const posterAlt = 'Торговый островок из ореха и латуни со стеклянными витринами в атриуме торгового центра — кадр ролика, визуализация';

/** Кадры ролика: первый — постер и заглушка (островок тёмный), последний — статичный кадр при reduced-motion (островок освещён). */
export const HERO_POSTERS = {
  first: { src: 'media/showroom/hero-poster.jpg', alt: posterAlt },
  lit: { src: 'media/showroom/hero-lit.jpg', alt: posterAlt },
};

/** Подпись кадра: ролик — визуализация, а не съёмка объекта компании. */
export const HERO_CREDIT = { text: 'Ролик: визуализация интерьера, не объект ДВК' };

export const heroConfig = {
  sources: { desktop: 'media/showroom/hero.mp4', mobile: 'media/showroom/hero-mobile.mp4' },
  poster: HERO_POSTERS.first,
  // Заглушка повторяет движение ролика: медленный наезд на островок.
  camera: { from: { x: 0, y: 0, scale: 1.02 }, to: { x: -2, y: -1, scale: 1.16 } },
  callouts: HERO_CALLOUTS,
  phases: HERO_PHASES,
  // Ролик 15 с: сцена длиннее, чтобы облёт не проскакивал за пару прокруток.
  lengthVh: 400,
  mobileLengthVh: 250,
};
