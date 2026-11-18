// Hero «Палитры RAL»: две сцены. Ролик один — зал парфюмерии в Балашихе (доработанное фото проекта ДВК):
// он идёт в поле грунта и ритейла. В полях благоустройства и металлической мебели в рамке стоит фото проекта
// своего направления с движением камеры и тремя пояснениями уровня фаз.
// Тексты пояснений — из данных (company.json, products.json, projects.json); не нашлось — «[уточнить]».
// Точки пояснений заданы в долях кадра и пересчитываются под окно рамки: оно уже кадра и обрезает его края.
// Раскадровка с привязкой каждого пояснения к отрезку и точке кадра — docs/hero-video/ral.md.
import { UNKNOWN, getCompany, getCycleStep, getFactText, getProduct, getProject } from '../../core/catalog/index.js';
import { clamp01, lerp } from '../../core/scroll-video/math.js';

const company = getCompany();

const step = (id) => getCycleStep(id) ?? { title: UNKNOWN, text: UNKNOWN };
const service = (id) => company.services?.find((item) => item.id === id) ?? { title: UNKNOWN, text: UNKNOWN };
const heroPhoto = (slug, direction) =>
  company.heroPhotos?.find((photo) => photo.project === slug) ?? company.heroPhotos?.find((photo) => photo.direction === direction) ?? null;

/** Подпись кадра: чьё это фото и какой объект (short — для узкой рамки: город, а без него название). */
function captionFor(lead, slug) {
  const project = getProject(slug);
  if (!project) return { lead, text: UNKNOWN, short: UNKNOWN };
  return { lead, text: [project.title, project.city].filter(Boolean).join(', '), short: project.city ?? project.title };
}

/**
 * Пояснение о материале. В кадре — объект проекта, а не позиция каталога, поэтому бирка ничего не приписывает
 * предмету на фото: она называет позицию каталога, где такой материал есть, и даёт строку её характеристик справкой.
 */
function catalogNote(slug, label, lead) {
  const product = getProduct(slug);
  const value = product?.specs?.find((item) => item.label === label)?.value;
  if (!product) return { text: UNKNOWN };
  return { text: `${lead} в каталоге: ${product.name}`, note: value ? String(value) : undefined, product: product.name };
}

/** Фазы сцены — они же глаголы заголовка: «проектируем, производим и монтируем». */
export const HERO_PHASES = [
  { id: 'design', label: 'Проектирование', from: 0, to: 0.25 },
  { id: 'production', label: 'Производство', from: 0.25, to: 0.77 },
  { id: 'install', label: 'Монтаж', from: 0.77, to: 1 },
];

const production = step('production');
const install = step('install');

// --- сцена с роликом -----------------------------------------------------------------------

const VIDEO_PROJECT = 'perfume-balashikha';
/** Кадр ролика и постера (hero.mp4 — 1280×704; hero-mobile.mp4 — тех же пропорций). */
const VIDEO_FRAME = { w: 1280, h: 704 };

/**
 * Пояснения ролика: отрезок прогресса [from, to), деталь в начале и в конце отрезка (at → atEnd, доли кадра:
 * камера наезжает, деталь смещается — бирка едет за ней), код-ярлык, заголовок, текст.
 * Отрезки идут по фазам: проектирование → производство → монтаж. Точки сняты с кадров ролика.
 */
const VIDEO_CALLOUTS = [
  // фриз с орнаментом на центральной стойке
  { id: 'design', from: 0.03, to: 0.23, at: [0.5, 0.49], atEnd: [0.51, 0.46], code: 'Проект', title: service('shop-design').title, text: getFactText('free-shop-design') },
  // кромка верхней стеклянной полки стойки
  { id: 'glass', from: 0.26, to: 0.38, at: [0.6, 0.63], atEnd: [0.61, 0.62], code: 'Стекло 5мм', title: 'Полированное стекло', ...catalogNote('vitriny-peredney-linii', 'Материалы', 'Такое стекло —') },
  // тумба второй стойки в глубине зала
  { id: 'board', from: 0.38, to: 0.5, at: [0.82, 0.66], atEnd: [0.83, 0.67], code: 'ДСП 16 мм', title: 'Противоударная кромка', ...catalogNote('vitrina-dlya-chasov-vchyu-23', 'Материалы', 'Такая плита и кромка —') },
  // пристенная витрина с подсветкой слева
  { id: 'light', from: 0.5, to: 0.62, at: [0.27, 0.42], atEnd: [0.27, 0.41], code: 'Подсветка', title: 'Подсветка витрин', ...catalogNote('prilavok-dlya-optiki-pod-20', 'Дополнительные опции', 'Подсветка — опция') },
  // корпус центральной стойки между полками
  { id: 'production', from: 0.62, to: 0.76, at: [0.44, 0.7], atEnd: [0.44, 0.69], code: 'Колпино', title: production.title, text: production.text },
  // основание стойки: зал собран
  { id: 'install', from: 0.79, to: 1, at: [0.6, 0.92], atEnd: [0.62, 0.94], code: 'Монтаж', title: install.title, text: getFactText('night-install') },
];

// --- сцена направления: фото проекта --------------------------------------------------------

/** Проект направления и точки трёх пояснений на его фото (доли кадра). */
const PHOTO_SCENES = {
  // Детская площадка в Москве: башня с крышей, борт горки, основание у земли.
  landscape: { project: 'playground-moscow', points: [[0.43, 0.3], [0.66, 0.66], [0.52, 0.76]], installText: getFactText('own-fleet') },
  // Мастерская: панель с инструментом, высокий шкаф, тумба с ящиками.
  metal: { project: 'workshop-furniture', points: [[0.63, 0.48], [0.425, 0.59], [0.215, 0.82]], installText: install.text },
};

function photoCallouts({ points, installText }) {
  const [design, made, mounted] = points;
  return [
    { id: 'design', from: 0.04, to: 0.25, at: design, atEnd: design, code: 'Проект', title: step('measure').title, text: getFactText('same-day-measure') },
    { id: 'production', from: 0.29, to: 0.75, at: made, atEnd: made, code: 'Колпино', title: production.title, text: production.text },
    { id: 'install', from: 0.79, to: 1, at: mounted, atEnd: mounted, code: 'Монтаж', title: install.title, text: installText },
  ];
}

// --- точка кадра → точка окна рамки ------------------------------------------------------------

/** Окно рамки по умолчанию (пока не измерено): около 4:3, как на широком экране. */
const NOMINAL_VIEW = { w: 4, h: 3 };
/** Точка пояснения не подходит к краю окна ближе этой доли: под кромкой рамки её не видно. */
const EDGE = 0.04;
const insideWindow = (value) => Math.min(1 - EDGE, Math.max(EDGE, value));

/**
 * Точка кадра (u, v — доли исходного кадра) → доли окна, в котором кадр лежит как object-fit: cover
 * с фокусом focus (object-position: x% y%). Лишнее обрезается: точка за окном получает долю вне 0..1.
 * @param {[number, number]} point
 * @param {{ w: number, h: number }} media
 * @param {{ w: number, h: number }} view
 * @param {{ x: number, y: number }} [focus]
 */
export function framePoint([u, v], media, view, focus = { x: 0.5, y: 0.5 }) {
  const scale = Math.max(view.w / media.w, view.h / media.h);
  const width = media.w * scale;
  const height = media.h * scale;
  return {
    x: ((view.w - width) * focus.x + u * width) / view.w,
    y: ((view.h - height) * focus.y + v * height) / view.h,
  };
}

/**
 * Пояснения сцены под размер окна рамки: x, y — точка в начале отрезка (доли окна), dx, dy — её сдвиг к концу
 * отрезка. У ролика деталь ведёт сам кадр; у фото — камера заглушки (масштаб от центра окна).
 * @param {object} scene сцена из heroSceneFor
 * @param {{ w: number, h: number }|null} [view] окно рамки в пикселях; не измерено — пропорции по умолчанию
 */
export function placeCallouts(scene, view) {
  const size = view?.w > 0 && view?.h > 0 ? view : NOMINAL_VIEW;
  const zoomAt = (p) => (scene.sources ? 1 : lerp(scene.camera.from.scale, scene.camera.to.scale, clamp01(p)));
  const place = (point, p) => {
    const flat = framePoint(point, scene.media, size, scene.focus);
    const zoom = zoomAt(p);
    return { x: insideWindow(0.5 + (flat.x - 0.5) * zoom), y: insideWindow(0.5 + (flat.y - 0.5) * zoom) };
  };
  return scene.callouts.map((callout) => {
    const start = place(callout.at, callout.from);
    const end = place(callout.atEnd, callout.to);
    return { ...callout, x: start.x, y: start.y, dx: end.x - start.x, dy: end.y - start.y };
  });
}

// --- прокраска заголовка -----------------------------------------------------------------------

/** Доля сцены, за которую глагол заголовка прокрашивается целиком — с начала своей фазы. */
export const PAINT_SPAN = 0.14;

/**
 * Сколько букв глагола закрашено на прогрессе сцены: край краски встаёт только на границу букв.
 * @param {number} progress 0..1
 * @param {{ from: number, to: number }|undefined} phase фаза этого глагола
 * @param {number} letters букв в слове
 */
export function paintedLetters(progress, phase, letters) {
  if (!phase || !(letters > 0)) return 0;
  const span = Math.min(PAINT_SPAN, phase.to - phase.from);
  if (!(span > 0)) return progress >= phase.from ? letters : 0;
  return Math.min(letters, Math.floor(clamp01((progress - phase.from) / span) * letters + 1e-6));
}

// --- сцены -------------------------------------------------------------------------------------

function withPlacedCallouts(scene) {
  return { ...scene, callouts: placeCallouts(scene, NOMINAL_VIEW) };
}

function buildPhotoScene(direction) {
  const setup = PHOTO_SCENES[direction];
  const photo = heroPhoto(setup.project, direction);
  if (!photo) return null;
  return withPlacedCallouts({
    id: direction,
    poster: { base: photo.base, alt: photo.alt },
    media: { w: photo.w, h: photo.h },
    focus: { x: 0.5, y: 0.5 },
    // Ролика нет: кадр медленно приближается, пока идут фазы.
    camera: { from: { x: 0, y: 0, scale: 1 }, to: { x: 0, y: 0, scale: 1.1 } },
    callouts: photoCallouts(setup),
    phases: HERO_PHASES,
    lengthVh: 300,
    mobileLengthVh: 200,
    caption: captionFor('Фото проекта ДВК', photo.project),
  });
}

/** Сцена с роликом — она же heroConfig модуля варианта. */
export const heroConfig = withPlacedCallouts({
  id: 'video',
  sources: { desktop: 'media/ral/hero.mp4', mobile: 'media/ral/hero-mobile.mp4' },
  // Постер — первый кадр ролика: подмена постера роликом не заметна.
  poster: { src: 'media/ral/hero-poster.jpg', alt: heroPhoto(VIDEO_PROJECT, 'retail')?.alt ?? 'Интерьер магазина, проект ДВК Стиль' },
  media: VIDEO_FRAME,
  // Окно рамки уже кадра: держим в нём центральную стойку и вторую стойку справа.
  focus: { x: 0.58, y: 0.5 },
  // Если ролик не открылся, постер повторяет его наезд; при прогрессе 0 кадр стоит как в ролике.
  camera: { from: { x: 0, y: 0, scale: 1 }, to: { x: -2, y: 1, scale: 1.14 } },
  callouts: VIDEO_CALLOUTS,
  phases: HERO_PHASES,
  lengthVh: 360,
  mobileLengthVh: 230,
  caption: captionFor('Доработанное фото проекта ДВК', VIDEO_PROJECT),
});

export const HERO_CALLOUTS = heroConfig.callouts;

const PHOTO_SCENE_CACHE = Object.fromEntries(Object.keys(PHOTO_SCENES).map((direction) => [direction, buildPhotoScene(direction)]));

/**
 * Сцена hero для текущего поля: грунт и ритейл — ролик; благоустройство и металлическая мебель — фото проекта
 * своего направления. Объекты постоянные: их можно класть в зависимости хуков.
 * @param {string|null|undefined} direction
 */
export function heroSceneFor(direction) {
  return (Object.hasOwn(PHOTO_SCENE_CACHE, direction) && PHOTO_SCENE_CACHE[direction]) || heroConfig;
}
