// Чистая математика скролл-видео: прогресс → время ролика, пояснения, фазы, камера заглушки, сглаживание.

/** Не доводим время до самого `duration`: на последней миллисекунде браузеры показывают чёрный кадр. */
export const END_MARGIN = 0.05;

/** Число в 0..1; нечисловое и NaN — 0. */
export function clamp01(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

export const lerp = (from, to, t) => from + (to - from) * t;

/**
 * Прогресс скролла → секунда ролика.
 * @param {number} p 0..1 (вне диапазона прижимается)
 * @param {number} duration секунды; неизвестная или нулевая длительность → 0
 */
export function progressToTime(p, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(clamp01(p) * duration, Math.max(0, duration - END_MARGIN));
}

/**
 * Состояние пояснения на прогрессе p. Отрезок [from, to): конец исключён, чтобы соседние
 * пояснения не горели вместе; если to ≥ 1, пояснение остаётся и на самом конце.
 * `local` — доля пути внутри отрезка (до него 0, после него 1), по ней вариант рисует въезд и выезд.
 * @param {number} p
 * @param {{ from: number, to: number }} callout
 * @returns {{ active: boolean, local: number }}
 */
export function calloutState(p, callout) {
  const progress = clamp01(p);
  const from = Number(callout?.from);
  const to = Number(callout?.to);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    return { active: false, local: Number.isFinite(from) && progress >= from ? 1 : 0 };
  }
  return {
    active: progress >= from && (progress < to || (to >= 1 && progress >= 1)),
    local: clamp01((progress - from) / (to - from)),
  };
}

/**
 * Фаза, в которую попал прогресс (для индикаторов вроде «ПРОЕКТИРОВАНИЕ / ПРОИЗВОДСТВО / МОНТАЖ»).
 * Отрезки [from, to), у последней, дошедшей до 1, конец включён. В промежутке между фазами и без фаз — null.
 * @param {number} p
 * @param {{ id: string, label?: string, from: number, to: number }[]} [phases]
 */
export function phaseAt(p, phases) {
  if (!Array.isArray(phases)) return null;
  const progress = clamp01(p);
  return phases.find((phase) => progress >= phase.from && (progress < phase.to || (phase.to >= 1 && progress >= 1))) ?? null;
}

/** Прогресс закреплённой сцены: верх трека относительно окна, высота трека и высота сцены. */
export function trackProgress(trackTop, trackHeight, stageHeight) {
  const range = trackHeight - stageHeight;
  return range > 0 ? clamp01(-trackTop / range) : 0;
}

/** Экспоненциальное сглаживание, не зависящее от частоты кадров: за tauMs остаётся 1/e расстояния. */
export function damp(current, target, dtMs, tauMs) {
  return target + (current - target) * Math.exp(-Math.max(0, dtMs) / tauMs);
}

export const DEFAULT_CAMERA = Object.freeze({
  from: { x: 0, y: 0, scale: 1 },
  to: { x: 0, y: 0, scale: 1.12 },
});

/**
 * Камера заглушки: кадр плавно едет и приближается от camera.from к camera.to.
 * x, y — сдвиг кадра в % от размера сцены (положительный x уводит картинку вправо). Сдвиг прижат к границе,
 * за которой показался бы край, поэтому при scale 1 двигаться нечему.
 * @param {{ from?: object, to?: object }} [camera]
 * @param {number} p
 * @returns {string} значение CSS transform (только translate3d и scale)
 */
export function cameraTransform(camera, p) {
  const from = { ...DEFAULT_CAMERA.from, ...camera?.from };
  const to = { ...DEFAULT_CAMERA.to, ...(camera?.to ?? (camera?.from ? { x: from.x, y: from.y, scale: from.scale } : undefined)) };
  const t = clamp01(p);
  const scale = Math.max(1, lerp(from.scale, to.scale, t));
  const limit = ((scale - 1) / 2) * 100;
  const shift = (a, b) => Math.min(limit, Math.max(-limit, lerp(a, b, t)));
  return `translate3d(${shift(from.x, to.x).toFixed(3)}%, ${shift(from.y, to.y).toFixed(3)}%, 0) scale(${scale.toFixed(4)})`;
}

/**
 * Режим сцены: reduced-motion → 'static'; файл ролика ожидается и не упал → 'video'; иначе 'placeholder'.
 * @param {{ reducedMotion: boolean, videoState: 'none'|'loading'|'ready'|'error' }} state
 */
export function resolveMode({ reducedMotion, videoState }) {
  if (reducedMotion) return 'static';
  return videoState === 'loading' || videoState === 'ready' ? 'video' : 'placeholder';
}
