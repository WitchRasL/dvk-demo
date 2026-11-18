// Движок скролл-видео: прогресс закреплённой сцены (rAF + сглаживание), режим, перемотка кадра.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery, usePrefersReducedMotion } from '../hooks/media.js';
import { clamp01, damp, progressToTime, resolveMode, trackProgress } from './math.js';

/** За это время (мс) остаётся 1/e расстояния до цели: ~90 мс — заметная инерция, но кадр не отстаёт от руки. */
const SMOOTHING_MS = 90;
/** Ближе этого к цели считаем, что догнали, и перестаём гонять rAF. */
const SETTLE_EPSILON = 0.0005;
/** Прогресс для React (пояснения, фазы, оверлей) обновляем не чаще, чем на этот шаг; сам кадр — каждый rAF. */
const REPORT_STEP = 0.002;
/** Допуск по времени, внутри которого на лету перематывать не нужно; на остановке кадр ставится точно. */
const SEEK_EPSILON = 0.01;
const SEEK_EPSILON_EXACT = 0.0005;
/** Кадр не длиннее: после паузы вкладки сглаживание не должно «прыгать». */
const MAX_FRAME_MS = 64;

// Хуки медиазапросов переехали в core/hooks/media.js; переэкспорт — для прежних импортов.
export { useMediaQuery, usePrefersReducedMotion };

/** Перематывает ролик на кадр под прогресс. false — перемотка занята, надо повторить на следующем кадре. */
function seekVideo(video, progress, exact = false) {
  if (!video || video.readyState < 1) return true;
  const { duration } = video;
  if (!Number.isFinite(duration) || duration <= 0) return true;
  const time = progressToTime(progress, duration);
  if (Math.abs(video.currentTime - time) <= (exact ? SEEK_EPSILON_EXACT : SEEK_EPSILON)) return true;
  // Новая перемотка поверх незаконченной сбрасывает её: на тяжёлых роликах кадр так и не успел бы показаться.
  if (video.seeking) return false;
  if (typeof video.fastSeek === 'function') video.fastSeek(time);
  else video.currentTime = time;
  return true;
}

function stageHeightOf(stageRef) {
  const height = stageRef?.current?.getBoundingClientRect().height;
  return height || window.innerHeight;
}

/**
 * @param {{ current: HTMLElement|null }} ref трек — высокий элемент, внутри которого сцена закреплена (sticky)
 * @param {{
 *   stageRef?: { current: HTMLElement|null },   // сама закреплённая сцена (по ней считается длина пути); без неё — высота окна
 *   videoRef?: { current: HTMLVideoElement|null },
 *   videoState?: 'none'|'loading'|'ready'|'error',  // что известно о файле ролика; без videoRef и состояния режим — placeholder
 *   forceMode?: 'video'|'placeholder'|'static',     // только демо и тесты
 *   onFrame?: (progress: number) => void,           // каждый кадр сглаженного прогресса, без перерисовки React
 * }} [options]
 * @returns {{ progress: number, mode: 'video'|'placeholder'|'static', seekTo: (p: number) => void }}
 *   progress — сглаженный прогресс 0..1 (для пояснений и фаз); seekTo прокручивает страницу к доле пути сцены.
 */
export function useScrollVideo(ref, { stageRef, videoRef, videoState = 'none', forceMode, onFrame } = {}) {
  const reducedMotion = usePrefersReducedMotion();
  const mode = forceMode ?? resolveMode({ reducedMotion, videoState });
  const [progress, setProgress] = useState(0);
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (mode === 'static') {
      setProgress(0);
      return undefined;
    }
    const track = ref.current;
    if (!track) return undefined;

    let frame = 0;
    let last = 0;
    let reported = -1;
    const readTarget = () => {
      const rect = track.getBoundingClientRect();
      return trackProgress(rect.top, rect.height, stageHeightOf(stageRef));
    };
    let current = readTarget();

    const report = (value) => {
      if (value === reported) return;
      if (Math.abs(value - reported) >= REPORT_STEP || value === 0 || value === 1) {
        reported = value;
        setProgress(value);
      }
    };

    const apply = (value, exact = false) => {
      onFrameRef.current?.(value);
      report(value);
      return seekVideo(videoRef?.current, value, exact);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    function tick(now) {
      frame = 0;
      const target = readTarget();
      const dt = last ? Math.min(now - last, MAX_FRAME_MS) : 16;
      last = now;
      current = damp(current, target, dt, SMOOTHING_MS);
      if (Math.abs(target - current) < SETTLE_EPSILON) current = target;
      const inSync = apply(current, current === target);
      if (current !== target || !inSync) schedule();
      else last = 0;
    }

    apply(current, true);
    const video = videoRef?.current;
    // Метаданные и первый кадр приходят позже скролла: подтягиваем ролик к текущему прогрессу.
    video?.addEventListener('loadedmetadata', schedule);
    video?.addEventListener('loadeddata', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      video?.removeEventListener('loadedmetadata', schedule);
      video?.removeEventListener('loadeddata', schedule);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [mode, ref, stageRef, videoRef]);

  const seekTo = useCallback(
    (p) => {
      const track = ref.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const range = mode === 'static' ? 0 : Math.max(0, rect.height - stageHeightOf(stageRef));
      window.scrollTo({ top: rect.top + window.scrollY + clamp01(p) * range, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [mode, reducedMotion, ref, stageRef],
  );

  return { progress, mode, seekTo };
}
