// Конфигурация hero «Чертежа»: ролик — проезд по музейному залу (доработанное фото проекта ДВК в Брянске),
// постер — его первый кадр. Выноски — позиции с полкой: тексты только из данных каталога и проекта,
// размеры самих предметов на объекте неизвестны — [уточнить]; артикул каталога назван как источник сравнения.
// Точки x, y — доли кадра ролика; камера едет, поэтому у выноски есть начало (x, y) и конец (end) отрезка.
// Замер положений — по кадрам hero.mp4 (docs/hero-video/blueprint.md → «Что сделано»).
import { LIGHT_LABELS, getCompany, getProduct, getProject } from '../../../core/catalog/index.js';
import { DEFAULT_CAMERA, clamp01, lerp } from '../../../core/scroll-video/math.js';
import { formatDimensions } from '../../../core/ui/format.js';
import { UNKNOWN, designation } from './drawing.js';

const PHOTO_PROJECT = 'museum-bryansk';
const ISLAND = 'muzeynoe-oborudovanie-vt-10-k-1';
const WALL = 'muzeynaya-vitrina-mvp-30';

/** Кадр ролика: hero.mp4 — 1280×704, hero-mobile.mp4 — 720×396 (те же пропорции). */
const FRAME = { w: 1280, h: 704 };

/** Фрагмент про стекло из строки «Материалы» в характеристиках: «стекло полированное 5–6 мм». */
export function glassNote(product) {
  const materials = product?.specs?.find((spec) => /материал/i.test(spec.label))?.value ?? '';
  const match = String(materials).match(/стекл[а-яё]*(?:\s+[а-яё]+)?\s*\d+(?:\s*-\s*\d+)?\s*мм/i);
  if (!match) return null;
  return match[0].replace(/\s*-\s*/g, '–').replace(/(\d)\s*мм/, '$1 мм').replace(/^с/, 'С');
}

/**
 * Точка опорного кадра → доля окна вида: кадр вписан как object-fit: cover, затем камера заглушки
 * (cameraTransform ядра: сдвиг в % окна, ограниченный запасом масштаба, и масштаб от центра).
 */
export function mapPhotoPoint(point, photo, view, camera, p) {
  const px = point?.x ?? 0.5;
  const py = point?.y ?? 0.5;
  let x = px;
  let y = py;
  if (photo?.w && photo?.h && view?.w && view?.h) {
    const s = Math.max(view.w / photo.w, view.h / photo.h);
    x = ((view.w - photo.w * s) / 2 + px * photo.w * s) / view.w;
    y = ((view.h - photo.h * s) / 2 + py * photo.h * s) / view.h;
  }
  const from = { ...DEFAULT_CAMERA.from, ...camera?.from };
  const to = { ...DEFAULT_CAMERA.to, ...(camera?.to ?? from) };
  const t = clamp01(p);
  const scale = Math.max(1, lerp(from.scale, to.scale, t));
  const limit = ((scale - 1) / 2) * 100;
  const shift = (a, b) => Math.min(limit, Math.max(-limit, lerp(a, b, t))) / 100;
  return { x: 0.5 + (x - 0.5) * scale + shift(from.x, to.x), y: 0.5 + (y - 0.5) * scale + shift(from.y, to.y) };
}

/**
 * Где деталь выноски стоит в кадре ролика на прогрессе p: от (x, y) в начале отрезка к `end` в его конце.
 * @param {{ from: number, to: number, x: number, y: number, end?: { x: number, y: number } }} callout
 * @param {number} p прогресс сцены 0..1
 * @returns {{ x: number, y: number }}
 */
export function calloutPoint(callout, p) {
  const start = { x: callout?.x ?? 0.5, y: callout?.y ?? 0.5 };
  const end = callout?.end;
  const span = (callout?.to ?? 0) - (callout?.from ?? 0);
  if (!end || !(span > 0)) return start;
  const t = clamp01((clamp01(p) - callout.from) / span);
  return { x: lerp(start.x, end.x, t), y: lerp(start.y, end.y, t) };
}

/** Размер предмета на фото неизвестен; позиция каталога названа как источник для сравнения, а не как артикул предмета. */
function catalogLine(product) {
  if (!product) return `Размеры на объекте — ${UNKNOWN}`;
  const code = designation(product) ?? UNKNOWN;
  const size = formatDimensions(product.dimensions) ?? `габарит ${UNKNOWN}`;
  return `Размеры на объекте — ${UNKNOWN}. В каталоге: ${code}, ${size}`;
}

function lightLine(product) {
  const label = product?.lighting && product.lighting !== 'none' ? LIGHT_LABELS[product.lighting] : null;
  const onSite = `Тип и цветовая температура — ${UNKNOWN}`;
  return label ? `${onSite}. В каталоге у ${designation(product) ?? UNKNOWN}: ${label.toLowerCase()}` : onSite;
}

function glassLine(product) {
  const note = glassNote(product);
  const onSite = `Толщина на объекте — ${UNKNOWN}`;
  return note ? `${onSite}. В каталоге у ${designation(product) ?? UNKNOWN}: ${note.replace(/^С/, 'с')}` : onSite;
}

function buildCallouts() {
  const island = getProduct(ISLAND);
  const wall = getProduct(WALL);
  const project = getProject(PHOTO_PROJECT);
  const objectLine = project ? [project.title, ...(project.scope ?? []).map((item) => item.toLowerCase())].join(' · ') : UNKNOWN;
  // from / to — доли прогресса (ролик 8,04 с); x, y → end — деталь в кадре в начале и в конце отрезка;
  // photo — та же деталь на первом кадре: по ней выноска стоит, если ролик не открылся и работает заглушка.
  return [
    { id: 'island', from: 0, to: 0.19, x: 0.24, y: 0.52, end: { x: 0.25, y: 0.52 }, photo: { x: 0.24, y: 0.52 }, title: 'Витрина в центре зала', text: catalogLine(island) },
    { id: 'light', from: 0.21, to: 0.38, x: 0.261, y: 0.158, end: { x: 0.267, y: 0.17 }, photo: { x: 0.252, y: 0.146 }, title: 'Подсветка', text: lightLine(island) },
    { id: 'wall', from: 0.4, to: 0.57, x: 0.6, y: 0.46, end: { x: 0.595, y: 0.46 }, photo: { x: 0.62, y: 0.46 }, title: 'Витрина у стены', text: catalogLine(wall) },
    { id: 'glass', from: 0.59, to: 0.76, x: 0.739, y: 0.3, end: { x: 0.72, y: 0.3 }, photo: { x: 0.803, y: 0.3 }, title: 'Стекло', text: glassLine(glassNote(island) ? island : wall) },
    { id: 'object', from: 0.78, to: 1, x: 0.955, y: 0.47, end: { x: 0.93, y: 0.47 }, photo: { x: 0.93, y: 0.5 }, title: `Объект: ${project?.city ?? UNKNOWN}`, text: objectLine },
  ];
}

/** Фото проекта, из которого сделан ролик (company.heroPhotos): источник кадра и подписи к нему. */
function findSource() {
  const photos = getCompany().heroPhotos ?? [];
  return photos.find((item) => item.project === PHOTO_PROJECT) ?? photos[0] ?? null;
}

export const heroSource = findSource();

function buildPoster() {
  const alt = heroSource?.alt ? `${heroSource.alt}. Кадр ролика — доработанное фото проекта` : 'Кадр ролика — доработанное фото проекта';
  return { src: 'media/blueprint/hero-poster.jpg', alt, ...FRAME };
}

/** Подпись к «Виду А»: кадр — доработанное фото реального проекта ДВК. */
export function heroCaption() {
  const city = getProject(PHOTO_PROJECT)?.city ?? UNKNOWN;
  return `Доработанное фото проекта ДВК: музей, ${city}`;
}

export const heroConfig = {
  sources: { desktop: 'media/blueprint/hero.mp4', mobile: 'media/blueprint/hero-mobile.mp4' },
  poster: buildPoster(),
  // Заглушка (ролик не открылся): первый кадр чуть приближен и медленно едет вбок, как камера в ролике.
  camera: { from: { x: 1.5, y: 0, scale: 1.06 }, to: { x: -1.5, y: 0, scale: 1.06 } },
  callouts: buildCallouts(),
  phases: [],
  lengthVh: 360,
  mobileLengthVh: 230,
};
