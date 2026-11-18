// Конфигурация hero «Чертежа»: заглушка — фото музея в Брянске (company.heroPhotos), выноски — позиции
// с полкой, тексты только из данных каталога и проекта; неизвестное — [уточнить].
// Точки x, y — доли кадра; раскадровка ролика привязана к ним же (docs/hero-video/blueprint.md).
import { LIGHT_LABELS, getCompany, getProduct, getProject } from '../../../core/catalog/index.js';
import { DEFAULT_CAMERA, clamp01, lerp } from '../../../core/scroll-video/math.js';
import { formatDimensions, materialLabel } from '../../../core/ui/format.js';
import { UNKNOWN, designation, materialsText } from './drawing.js';

const PHOTO_PROJECT = 'museum-bryansk';
const ISLAND = 'muzeynoe-oborudovanie-vt-10-k-1';
const WALL = 'muzeynaya-vitrina-mvp-30';

/** Фрагмент про стекло из строки «Материалы» в характеристиках: «стекло полированное 5–6 мм». */
export function glassNote(product) {
  const materials = product?.specs?.find((spec) => /материал/i.test(spec.label))?.value ?? '';
  const match = String(materials).match(/стекл[а-яё]*(?:\s+[а-яё]+)?\s*\d+(?:\s*-\s*\d+)?\s*мм/i);
  if (!match) return null;
  return match[0].replace(/\s*-\s*/g, '–').replace(/(\d)\s*мм/, '$1 мм').replace(/^с/, 'С');
}

/**
 * Точка опорного фото → доля окна вида: фото вписано как object-fit: cover, затем камера заглушки
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

function catalogLine(product) {
  if (!product) return UNKNOWN;
  const code = designation(product) ?? UNKNOWN;
  const size = formatDimensions(product.dimensions) ?? `габарит ${UNKNOWN}`;
  const materials = product.materials?.length ? ` · ${materialsText(product, materialLabel)}` : '';
  return `${code} в каталоге: ${size}${materials}`;
}

function lightLine(product) {
  const label = product?.lighting && product.lighting !== 'none' ? LIGHT_LABELS[product.lighting] : null;
  return label ? `${label} (${designation(product) ?? UNKNOWN})` : `Тип и цветовая температура — ${UNKNOWN}`;
}

function buildCallouts() {
  const island = getProduct(ISLAND);
  const wall = getProduct(WALL);
  const project = getProject(PHOTO_PROJECT);
  const glass = glassNote(island) ?? glassNote(wall);
  const objectLine = project ? [project.title, ...(project.scope ?? []).map((item) => item.toLowerCase())].join(' · ') : UNKNOWN;
  // x, y — точка в кадре ролика 16:9 (раскадровка: окно 978×550 от левого края фото, проезд вправо на ~300 px);
  // photo — та же деталь на опорном фото для заглушки.
  return [
    { id: 'island', from: 0, to: 0.2, x: 0.22, y: 0.55, photo: { x: 0.17, y: 0.55 }, title: 'Витрина островная', text: catalogLine(island) },
    { id: 'light', from: 0.21, to: 0.39, x: 0.21, y: 0.17, photo: { x: 0.2, y: 0.17 }, title: 'Подсветка', text: lightLine(island) },
    { id: 'wall', from: 0.41, to: 0.58, x: 0.46, y: 0.5, photo: { x: 0.41, y: 0.5 }, title: 'Витрина музейная', text: catalogLine(wall) },
    { id: 'glass', from: 0.59, to: 0.76, x: 0.61, y: 0.35, photo: { x: 0.545, y: 0.35 }, title: 'Стекло', text: glass ? `${glass} · ${designation(island) ?? UNKNOWN}` : UNKNOWN },
    { id: 'object', from: 0.77, to: 0.95, x: 0.73, y: 0.62, photo: { x: 0.66, y: 0.62 }, title: `Объект: ${project?.city ?? UNKNOWN}`, text: objectLine },
  ];
}

function buildPoster() {
  const photos = getCompany().heroPhotos ?? [];
  const photo = photos.find((item) => item.project === PHOTO_PROJECT) ?? photos[0];
  return photo ? { base: photo.base, alt: photo.alt, w: photo.w, h: photo.h, sourceUrl: photo.sourceUrl } : null;
}

export const heroConfig = {
  sources: { desktop: 'media/blueprint/hero.mp4', mobile: 'media/blueprint/hero-mobile.mp4' },
  poster: buildPoster(),
  // Заглушка: панорама в окне вида (пропорции фото) медленно проезжает слева направо и чуть отъезжает.
  camera: { from: { x: 5, y: 0, scale: 1.12 }, to: { x: -5, y: 0, scale: 1.08 } },
  callouts: buildCallouts(),
  phases: [],
  lengthVh: 360,
  mobileLengthVh: 230,
};
