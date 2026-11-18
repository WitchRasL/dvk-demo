// heroConfig «Шоурума»: ролик, опорный кадр, движение камеры, фазы и пояснения.
// Тексты пояснений берутся из данных (company.json, projects.json); чего нет — видимая заглушка «[уточнить]».
// Раскадровка, привязанная к этим отрезкам и точкам, — docs/hero-video/showroom.md.
import { UNKNOWN, getCompany, getCycleStep, getFactText, getProject } from '../../core/catalog/index.js';

const POSTER_PROJECT = 'perfume-balashikha';

const company = getCompany();
const posterProject = getProject(POSTER_PROJECT);
const posterPhoto = company.heroPhotos?.find((photo) => photo.project === POSTER_PROJECT) ?? company.heroPhotos?.[0] ?? null;

/** Вторая фраза описания проекта («Оборудование изготовлено по дизайн-проекту…») — то, что видно в кадре. */
function projectSentence(project) {
  const sentences = String(project?.summary ?? '')
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.find((sentence) => /изготовлено/i.test(sentence)) ?? sentences[0] ?? UNKNOWN;
}

export const HERO_PHASES = [
  { id: 'design', label: 'Проектирование', from: 0, to: 0.34 },
  { id: 'production', label: 'Производство', from: 0.34, to: 0.67 },
  { id: 'install', label: 'Монтаж', from: 0.67, to: 1 },
];

/*
 * Точки кадра (x, y — доли сцены) подобраны под опорный кадр: панорама парфюмерии в Балашихе,
 * пристенные витрины с подсветкой справа от центра. Левая нижняя часть сцены — под заголовок и действия,
 * поэтому пояснения живут в правой и верхней части кадра.
 */
export const HERO_CALLOUTS = [
  { id: 'measure', from: 0.03, to: 0.17, x: 0.66, y: 0.26, title: getCycleStep('measure')?.title ?? 'Замер', text: getFactText('same-day-measure') },
  { id: 'design', from: 0.17, to: 0.33, x: 0.84, y: 0.2, title: getCycleStep('design')?.title ?? 'Дизайн-проект', text: getFactText('free-shop-design') },
  {
    id: 'frame',
    from: 0.36,
    to: 0.5,
    x: 0.57,
    y: 0.3,
    title: posterProject ? `${posterProject.title}, ${posterProject.city}` : UNKNOWN,
    text: projectSentence(posterProject),
  },
  { id: 'production', from: 0.5, to: 0.66, x: 0.88, y: 0.5, title: getCycleStep('production')?.title ?? 'Производство', text: getCycleStep('production')?.text ?? UNKNOWN },
  { id: 'delivery', from: 0.69, to: 0.83, x: 0.7, y: 0.56, title: getCycleStep('delivery')?.title ?? 'Доставка', text: getFactText('own-fleet') },
  { id: 'install', from: 0.83, to: 1, x: 0.64, y: 0.22, title: getCycleStep('install')?.title ?? 'Монтаж', text: getFactText('night-install') },
];

/**
 * Светильники заглушки: где в кадре «зажигается» подсветка витрин (доли сцены) и с какого прогресса.
 * Первый горит с загрузки. В режиме ролика не нужны — свет включается в самом ролике.
 */
export const HERO_LAMPS = [
  { id: 'main', x: 0.42, y: 0.42, at: 0, size: 0.55 },
  { id: 'wall-right', x: 0.68, y: 0.4, at: 0.06, size: 0.5 },
  { id: 'stand', x: 0.56, y: 0.55, at: 0.2, size: 0.45 },
  { id: 'wall-left', x: 0.12, y: 0.35, at: 0.36, size: 0.5 },
  { id: 'island', x: 0.9, y: 0.55, at: 0.52, size: 0.45 },
  { id: 'ceiling', x: 0.76, y: 0.1, at: 0.7, size: 0.4 },
];

export const heroConfig = {
  sources: { desktop: 'media/showroom/hero.mp4', mobile: 'media/showroom/hero-mobile.mp4' },
  poster: posterPhoto ? { base: posterPhoto.base, alt: posterPhoto.alt } : null,
  // Медленный наезд на витрины: камера чуть уходит влево-вверх, к подсвеченной стене.
  camera: { from: { x: 2, y: 1, scale: 1.04 }, to: { x: -4, y: -2, scale: 1.16 } },
  callouts: HERO_CALLOUTS,
  phases: HERO_PHASES,
  lengthVh: 360,
  mobileLengthVh: 230,
};
