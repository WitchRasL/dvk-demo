// heroConfig «Шоурума»: ролик, его первый кадр, фазы, пояснения и светильники заглушки.
// Тексты пояснений берутся из данных (company.json, projects.json); чего нет — видимая заглушка «[уточнить]».
// Точки сняты с ролика покадрово: что сделано и чем ролик отличается от раскадровки — docs/hero-video/showroom.md.
import { UNKNOWN, getCycleStep, getFactText, getProject } from '../../core/catalog/index.js';

/** Проект, фото которого доработано в ролик: зал парфюмерии в Балашихе. */
export const HERO_PROJECT = 'perfume-balashikha';

const project = getProject(HERO_PROJECT);
const projectPlace = [project?.title, project?.city].filter(Boolean).join(', ') || UNKNOWN;

/** Вторая фраза описания проекта («Оборудование изготовлено по дизайн-проекту…») — то, что видно в кадре. */
function projectSentence(item) {
  const sentences = String(item?.summary ?? '')
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.find((sentence) => /изготовлено/i.test(sentence)) ?? sentences[0] ?? UNKNOWN;
}

/** Размер кадра ролика: в его долях заданы все точки ниже. */
export const HERO_FRAME = Object.freeze({ width: 1280, height: 704 });

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
 * Пояснения. x, y — доли кадра ролика в середине отрезка (камера за отрезок смещает деталь меньше чем на 1 %).
 * side — куда от точки уходит табличка, grow — вниз или вверх она растёт: левая часть сцены занята заголовком,
 * низ — входами в направления, поэтому таблички живут справа вверху, над дальней стеной, и не закрывают
 * ни деталь, на которую указывают, ни стойки переднего плана.
 */
export const HERO_CALLOUTS = [
  {
    // Пристенные витрины правой стены — зажигаются первыми; встроены в стены зала по месту.
    id: 'measure',
    from: 0.04,
    to: 0.17,
    x: 0.89,
    y: 0.37,
    side: 'left',
    grow: 'up',
    title: getCycleStep('measure')?.title ?? 'Замер',
    text: getFactText('same-day-measure'),
  },
  {
    // Золотой орнамент на панели центральной стойки.
    id: 'design',
    from: 0.18,
    to: 0.33,
    x: 0.612,
    y: 0.5,
    side: 'right',
    grow: 'up',
    title: getCycleStep('design')?.title ?? 'Дизайн-проект',
    text: getFactText('free-shop-design'),
  },
  {
    // Центральная стойка со стеклянными полками: её подсветка только что включилась. Точка — на верхней кромке.
    id: 'frame',
    from: 0.36,
    to: 0.5,
    x: 0.53,
    y: 0.412,
    side: 'right',
    grow: 'up',
    title: projectPlace,
    text: projectSentence(project),
  },
  {
    // Низкая стойка-тумба справа: дерево, ящики, стеклянные полки. Точка — на её панели с орнаментом.
    id: 'production',
    from: 0.52,
    to: 0.66,
    x: 0.814,
    y: 0.47,
    side: 'left',
    grow: 'up',
    title: getCycleStep('production')?.title ?? 'Производство',
    text: getCycleStep('production')?.text ?? UNKNOWN,
  },
  {
    // Зал собран и освещён: пристенная витрина с ромбами на правой стене, левее стойки-тумбы.
    id: 'install',
    from: 0.7,
    to: 0.94,
    x: 0.775,
    y: 0.39,
    side: 'left',
    grow: 'up',
    title: getCycleStep('install')?.title ?? 'Монтаж',
    text: getFactText('night-install'),
  },
];

/**
 * Светильники заглушки — только на случай, когда ролик не загрузился и в кадре стоит его первый кадр.
 * Повторяют порядок самого ролика: первая витрина справа уже горит в кадре (её не дублируем),
 * остальные зажигаются справа налево, к середине зал освещён. x, y — доли кадра, at — прогресс сцены.
 */
export const HERO_LAMPS = [
  { id: 'wall-right', x: 0.8, y: 0.46, at: 0.06, size: 0.34 },
  { id: 'stand-low', x: 0.8, y: 0.6, at: 0.12, size: 0.24 },
  { id: 'wall-middle', x: 0.6, y: 0.38, at: 0.2, size: 0.3 },
  { id: 'stand', x: 0.5, y: 0.7, at: 0.28, size: 0.36 },
  { id: 'wall-left', x: 0.16, y: 0.46, at: 0.42, size: 0.44 },
];

const posterAlt = `${projectPlace}: ночной зал с подсветкой витрин, кадр ролика на основе фото объекта`;

/** Кадры ролика: первый — постер и заглушка, последний — статичный кадр при reduced-motion (всё освещено). */
export const HERO_POSTERS = {
  first: { src: 'media/showroom/hero-poster.jpg', alt: posterAlt },
  lit: { src: 'media/showroom/hero-lit.jpg', alt: posterAlt },
};

/** Подпись кадра: что это за интерьер и откуда он. */
export const HERO_CREDIT = {
  text: `Кадр: доработанное фото проекта ДВК — ${projectPlace.charAt(0).toLowerCase()}${projectPlace.slice(1)}`,
  to: project ? `projects/${project.slug}` : 'projects',
};

export const heroConfig = {
  sources: { desktop: 'media/showroom/hero.mp4', mobile: 'media/showroom/hero-mobile.mp4' },
  poster: HERO_POSTERS.first,
  // Заглушка повторяет движение ролика: медленный наезд, зал уходит вправо (камера смещается влево).
  camera: { from: { x: 0, y: 0, scale: 1.02 }, to: { x: 3.5, y: 0.5, scale: 1.1 } },
  callouts: HERO_CALLOUTS,
  phases: HERO_PHASES,
  lengthVh: 360,
  mobileLengthVh: 230,
};
