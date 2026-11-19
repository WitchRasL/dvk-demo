// heroConfig «Шоурума»: ролик, его первый кадр, фазы, пояснения и светильники заглушки.
// Ролик — визуализация: камера входит в ювелирный салон и идёт мимо островного прилавка к пристенным витринам
// (кадр H7 из набора, Higgsfield, Seedance 2.0). Тексты пояснений берутся из данных (company.json); чего нет —
// видимая заглушка «[уточнить]». Точки сняты с ролика покадрово — docs/hero-video/showroom.md.
import { UNKNOWN, getCycleStep, getFactText } from '../../core/catalog/index.js';

/** Размер кадра ролика: в его долях заданы все точки ниже. */
export const HERO_FRAME = Object.freeze({ width: 1280, height: 720 });

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
 * Пояснения. x, y — доли кадра ролика в середине отрезка: камера идёт вперёд, и за отрезок деталь смещается
 * на несколько процентов кадра. side — куда от точки уходит табличка, grow — вниз или вверх она растёт:
 * левая часть сцены занята заголовком, низ — входами в направления, поэтому точки стоят в правой половине
 * кадра, а таблички растут вверх.
 */
export const HERO_CALLOUTS = [
  {
    // Пристенная витрина правой стены: встроена в нишу по месту. Точка — на её верхней кромке.
    id: 'measure',
    from: 0.04,
    to: 0.16,
    x: 0.905,
    y: 0.33,
    side: 'left',
    grow: 'up',
    title: getCycleStep('measure')?.title ?? 'Замер',
    text: getFactText('same-day-measure'),
  },
  {
    // Витрина дальней стены, справа от окна: камера уже вошла в зал, видна вся стена.
    id: 'design',
    from: 0.19,
    to: 0.33,
    x: 0.667,
    y: 0.36,
    side: 'right',
    grow: 'up',
    title: getCycleStep('design')?.title ?? 'Дизайн-проект',
    text: getFactText('free-shop-design'),
  },
  {
    // Островной прилавок: латунная рама и гнутое стекло. Точка — на верхней кромке рамы.
    id: 'production',
    from: 0.38,
    to: 0.62,
    x: 0.61,
    y: 0.57,
    side: 'right',
    grow: 'up',
    title: getCycleStep('production')?.title ?? 'Производство',
    text: getCycleStep('production')?.text ?? UNKNOWN,
  },
  {
    // Камера у прилавка, зал виден целиком: витрина дальней стены справа от окна.
    id: 'install',
    from: 0.7,
    to: 0.94,
    x: 0.66,
    y: 0.34,
    side: 'right',
    grow: 'up',
    title: getCycleStep('install')?.title ?? 'Монтаж',
    text: getFactText('night-install'),
  },
];

/**
 * Светильники заглушки — только на случай, когда ролик не загрузился и в кадре стоит его первый кадр.
 * Подсвечивают витрины первого кадра справа налево, к середине зал освещён. x, y — доли кадра, at — прогресс сцены.
 */
export const HERO_LAMPS = [
  { id: 'wall-right', x: 0.9, y: 0.42, at: 0.06, size: 0.3 },
  { id: 'counter', x: 0.72, y: 0.62, at: 0.14, size: 0.4 },
  { id: 'wall-middle', x: 0.69, y: 0.42, at: 0.22, size: 0.26 },
  { id: 'wall-left', x: 0.45, y: 0.43, at: 0.32, size: 0.28 },
];

const posterAlt = 'Ювелирный салон: изумрудные панели, латунь, овальный стеклянный прилавок и пристенные витрины — кадр ролика, визуализация';

/** Кадры ролика: первый — постер и заглушка, последний — статичный кадр при reduced-motion (камера у прилавка). */
export const HERO_POSTERS = {
  first: { src: 'media/showroom/hero-poster.jpg', alt: posterAlt },
  lit: { src: 'media/showroom/hero-lit.jpg', alt: posterAlt },
};

/** Подпись кадра: ролик — визуализация, а не съёмка объекта компании. */
export const HERO_CREDIT = { text: 'Ролик: визуализация интерьера, не объект ДВК' };

export const heroConfig = {
  sources: { desktop: 'media/showroom/hero.mp4', mobile: 'media/showroom/hero-mobile.mp4' },
  poster: HERO_POSTERS.first,
  // Заглушка повторяет движение ролика: медленный наезд на прилавок и правую стену.
  camera: { from: { x: 0, y: 0, scale: 1.02 }, to: { x: -2, y: -1, scale: 1.16 } },
  callouts: HERO_CALLOUTS,
  phases: HERO_PHASES,
  lengthVh: 360,
  mobileLengthVh: 230,
};
