// Закреплённая сцена с роликом, который перематывается скроллом. Ядро даёт механику, внешний вид
// пояснений и оверлея рисует вариант через renderCallout / renderOverlay.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { asset } from '../../lib/base-url.js';
import { imageSrc, srcSet } from '../../lib/images.js';
import { cn } from '../../lib/utils.js';
import { SCROLL_VIDEO_CLASSES as CLASSES, SCROLL_VIDEO_MODE_ATTRIBUTE } from './contract.js';
import { calloutState, cameraTransform, phaseAt } from './math.js';
import { useMediaQuery, useScrollVideo } from './useScrollVideo.js';
import './scroll-video.css';

/** Если постер не загрузился, ролик всё равно начинает грузиться через это время (мс). */
const VIDEO_START_DELAY_MS = 2500;
/** Если данные ролика не пришли сами (iOS без жеста), через это время пробуем «разбудить» его беззвучным play/pause. */
const UNLOCK_DELAY_MS = 1200;

function Poster({ poster, imageRef, onLoad }) {
  if (!poster) return <div ref={imageRef} className={`${CLASSES.poster} scroll-video__poster--empty`} />;
  const hasBase = Boolean(poster.base);
  return (
    <img
      ref={imageRef}
      className={CLASSES.poster}
      src={hasBase ? imageSrc(poster.base, 1600) : asset(poster.src)}
      srcSet={hasBase ? srcSet(poster.base) : undefined}
      sizes="100vw"
      alt={poster.alt ?? ''}
      fetchPriority="high"
      decoding="async"
      draggable={false}
      onLoad={onLoad}
    />
  );
}

function DefaultCallout({ callout }) {
  return (
    <div className="scroll-video__callout-card">
      <p className="scroll-video__callout-title">{callout.title}</p>
      {callout.text ? <p className="scroll-video__callout-text">{callout.text}</p> : null}
    </div>
  );
}

/**
 * @param {{
 *   sources?: { desktop?: string, mobile?: string },   // пути внутри public/, например 'media/showroom/hero.mp4'
 *   poster?: { base?: string, src?: string, alt?: string },
 *   placeholderLabel?: string,
 *   camera?: { from: { x: number, y: number, scale: number }, to: { x: number, y: number, scale: number } },
 *   lengthVh?: number, mobileLengthVh?: number,
 *   callouts?: { id: string, from: number, to: number, x: number, y: number, title: string, text?: string }[],
 *   renderCallout?: (callout, state: { active: boolean, local: number }) => import('react').ReactNode,
 *   renderOverlay?: (progress: number, api: { seekTo, mode, phase, phaseIndex, phases }) => import('react').ReactNode,
 *   phases?: { id: string, label?: string, from: number, to: number }[],
 *   listLabel?: string, className?: string,
 *   forceMode?: 'video'|'placeholder'|'static',   // только для демо и тестов
 * }} props
 */
export function ScrollVideo({
  sources,
  poster,
  placeholderLabel = 'Здесь будет видео-интерьер',
  camera,
  lengthVh = 350,
  mobileLengthVh = 220,
  callouts = [],
  renderCallout,
  renderOverlay,
  phases,
  listLabel = 'Пояснения к видео',
  className,
  forceMode,
}) {
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const posterRef = useRef(null);

  const isMobile = useMediaQuery('(max-width: 767px)');
  const desktopSource = sources?.desktop;
  const mobileSource = sources?.mobile;
  // На телефоне сначала лёгкий файл, если он есть; не открылся — пробуем основной.
  const candidates = useMemo(
    () => [...new Set((isMobile ? [mobileSource, desktopSource] : [desktopSource]).filter(Boolean).map(asset))],
    [isMobile, desktopSource, mobileSource],
  );
  const [failed, setFailed] = useState([]);
  const src = candidates.find((candidate) => !failed.includes(candidate)) ?? null;

  const [posterLoaded, setPosterLoaded] = useState(false);
  const [waited, setWaited] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), VIDEO_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    // Постер мог загрузиться до гидрации/монтирования обработчика.
    if (posterRef.current?.complete && posterRef.current.naturalWidth > 0) setPosterLoaded(true);
  }, []);
  useEffect(() => {
    setVideoReady(false);
  }, [src]);

  // Постер идёт первым (LCP); ролик — после него, чтобы не отнимать канал.
  const loadVideo = Boolean(src) && (posterLoaded || waited || !poster);
  const videoState = !src ? (failed.length ? 'error' : 'none') : videoReady ? 'ready' : 'loading';

  const cameraRef = useRef(camera);
  const modeRef = useRef('placeholder');
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Камера заглушки двигает постер напрямую по кадрам rAF, без перерисовки React: только transform.
  const onFrame = useCallback((value) => {
    const element = posterRef.current;
    if (!element) return;
    if (modeRef.current === 'placeholder') element.style.transform = cameraTransform(cameraRef.current, value);
    else if (element.style.transform) element.style.transform = '';
  }, []);

  const { progress, mode, seekTo } = useScrollVideo(trackRef, { stageRef, videoRef, videoState, forceMode, onFrame });
  useLayoutEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!loadVideo || mode === 'static') return undefined;
    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (!video || video.readyState >= 2) return;
      try {
        const played = video.play();
        if (played && typeof played.then === 'function') played.then(() => video.pause()).catch(() => {});
      } catch {
        // автозапуск запрещён — остаётся постер
      }
    }, UNLOCK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loadVideo, mode, src]);

  const isStatic = mode === 'static';
  const phase = phaseAt(progress, phases);
  const api = { seekTo, mode, phase, phaseIndex: phase ? phases.indexOf(phase) : -1, phases };
  const length = isMobile ? mobileLengthVh : lengthVh;
  const showLabel = mode === 'placeholder' || (isStatic && candidates.length === 0);

  return (
    <div
      ref={trackRef}
      className={cn(CLASSES.root, className)}
      {...{ [SCROLL_VIDEO_MODE_ATTRIBUTE]: mode }}
      style={isStatic ? undefined : { '--scroll-video-length': length }}
    >
      <div ref={stageRef} className={CLASSES.stage}>
        <Poster poster={poster} imageRef={posterRef} onLoad={() => setPosterLoaded(true)} />

        {!isStatic && src ? (
          <video
            ref={videoRef}
            className={CLASSES.video}
            data-ready={videoReady}
            src={loadVideo ? src : undefined}
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden="true"
            disablePictureInPicture
            disableRemotePlayback
            onLoadedData={() => setVideoReady(true)}
            onError={() => setFailed((list) => (list.includes(src) ? list : [...list, src]))}
          />
        ) : null}

        {!isStatic && callouts.length ? (
          <div className={CLASSES.callouts} aria-hidden="true">
            {callouts.map((callout) => {
              const state = calloutState(progress, callout);
              const x = (callout.x ?? 0.5) * 100;
              const y = (callout.y ?? 0.5) * 100;
              return (
                <div
                  key={callout.id}
                  data-callout={callout.id}
                  data-active={state.active}
                  className={cn(CLASSES.callout, !renderCallout && 'scroll-video__callout--default')}
                  style={{ left: `${x}%`, top: `${y}%`, '--callout-x': `${x}%`, '--callout-y': `${y}%` }}
                >
                  {renderCallout ? renderCallout(callout, state) : <DefaultCallout callout={callout} />}
                </div>
              );
            })}
          </div>
        ) : null}

        {showLabel ? <p className={CLASSES.label}>{placeholderLabel}</p> : null}

        {renderOverlay ? <div className={CLASSES.overlay}>{renderOverlay(isStatic ? 0 : progress, api)}</div> : null}
      </div>

      {callouts.length ? (
        isStatic ? (
          <ol className={CLASSES.list} aria-label={listLabel}>
            {callouts.map((callout) => (
              <li key={callout.id}>
                {renderCallout ? renderCallout(callout, { active: true, local: 1 }) : <DefaultCallout callout={callout} />}
              </li>
            ))}
          </ol>
        ) : (
          <ol className="scroll-video__sr" aria-label={listLabel}>
            {callouts.map((callout) => (
              <li key={callout.id}>
                <strong>{callout.title}</strong>
                {callout.text ? <span>{`. ${callout.text}`}</span> : null}
              </li>
            ))}
          </ol>
        )
      ) : null}
    </div>
  );
}
