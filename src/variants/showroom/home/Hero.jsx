// Hero «Шоурума». Ролик по скроллу: камера входит в ювелирный салон и идёт мимо островного прилавка
// к пристенным витринам. Сцена открывается в полутени и светлеет к середине пути; курсор — луч света
// (тень с «окном» и тёплое пятно едут transform за мышью). На тач-устройствах свет только по скроллу,
// при reduced-motion — последний кадр ролика. Если ролик не загрузился, его первый кадр освещают светильники заглушки.
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Phone } from 'lucide-react';
import { ScrollVideo, cameraTransform, findScrollVideoStage } from '../../../core/scroll-video/index.js';
import { getCompany, getDirectionTotal } from '../../../core/catalog/index.js';
import { useCity } from '../../../core/city/index.js';
import { useFinePointer, useMediaQuery, usePrefersReducedMotion } from '../../../core/hooks/media.js';
import { useNav } from '../../../core/layout/nav.js';
import { toTel, wordFor } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { HERO_CREDIT, HERO_FOCUS, HERO_LAMPS, HERO_POSTERS, frameToStage, heroConfig } from '../hero-config.js';
import { heroPhoto } from '../tweaks/photos.js';
import { useTweaks } from '../tweaks/store.jsx';
import { Button } from '../ui.jsx';

/** Доля пути hero, за которую шоурум освещается полностью (в ролике — к середине). */
const LIGHT_UP_UNTIL = 0.5;
/** Точка кадра, куда смотрит свет без мыши: пристенная витрина правой стены. */
const FOCAL = { x: 0.9, y: 0.42 };
const BEAM_TAU_MS = 110;
/** Телефон: кадр занимает верх сцены (нижние 25rem — заголовок и действия) и сдвинут к правым витринам; то же в home.css. */
const PHONE_FRAME = { below: 400, minHeight: 160, focus: { x: 0.84, y: 0.5 } };
/** Место под табличку пояснения рядом с точкой: проволока и ширина таблички, px. */
const CARD_REACH = 372;
/** Уже этой ширины заголовок занимает больше половины сцены — табличке рядом с деталью места нет. */
const ANCHOR_MIN_WIDTH = 1200;

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => value * value * (3 - 2 * value);
const lerp = (from, to, t) => from + (to - from) * t;

const subscribeResize = (onChange) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};
const readViewport = () => `${window.innerWidth}x${window.innerHeight}`;

/** Как точка кадра ролика ложится на сцену при текущем окне: сцена — весь экран, кадр обрезан по краям. */
function useFrameMapping() {
  const viewport = useSyncExternalStore(subscribeResize, readViewport, () => '1440x900');
  const phone = useMediaQuery('(max-width: 767px)');
  return useMemo(() => {
    const [width, height] = viewport.split('x').map(Number);
    if (!phone) return { width, height, map: (point) => frameToStage(point, { width, height }, HERO_FOCUS) };
    const box = { width, height: Math.max(PHONE_FRAME.minHeight, height - PHONE_FRAME.below) };
    return {
      width,
      height,
      map: (point) => {
        const mapped = frameToStage(point, box, PHONE_FRAME.focus);
        return { ...mapped, y: (mapped.y * box.height) / height };
      },
    };
  }, [viewport, phone]);
}

/**
 * Пояснения в координатах сцены. На широком экране точка стоит на детали кадра, табличка — с той стороны,
 * где ей хватает места и где она не ложится на заголовок (левая половина сцены). Если места рядом с деталью
 * нет или деталь осталась за краем кадра, табличка встаёт без точки и проволоки в правый верхний угол, под шапку.
 * dock — так же встают все таблички: точки сняты с ролика и к другому кадру (фото из твиков) не относятся.
 */
function placeCallouts(callouts, mapping, { dock = false } = {}) {
  const { width, height } = mapping;
  const docked = { x: (width - 24) / width, y: 124 / height, side: 'left', grow: 'down', anchored: false };
  return callouts.map((callout) => {
    const mapped = mapping.map(callout);
    if (dock || !mapped.visible || width < ANCHOR_MIN_WIDTH) return { ...callout, ...docked };
    const px = mapped.x * width;
    const fits = { right: px + CARD_REACH < width - 16, left: px - CARD_REACH > width * 0.46 };
    const wanted = callout.side ?? (mapped.x > 0.72 ? 'left' : 'right');
    const side = fits[wanted] ? wanted : wanted === 'right' && fits.left ? 'left' : wanted === 'left' && fits.right ? 'right' : null;
    if (!side) return { ...callout, ...docked };
    const grow = callout.grow === 'up' && mapped.y * height < 260 ? 'down' : (callout.grow ?? 'down');
    return { ...callout, x: mapped.x, y: mapped.y, side, grow, anchored: true };
  });
}

/** «Проектируем, производим и монтируем — от витрины…» → крупная часть с акцентом и хвост. */
function Positioning({ text }) {
  const [head, ...rest] = String(text).split(' — ');
  const tail = rest.join(' — ');
  const words = head.split(' ');
  const accent = words.pop();
  return (
    <h1 id="sr-hero-title" className="sr-hero__title">
      <span className="sr-hero__head">
        {words.join(' ')} <em>{accent}</em>
      </span>
      {tail ? <span className="sr-hero__tail"> — {tail}</span> : null}
    </h1>
  );
}

function Callout({ callout, state }) {
  return (
    <div
      className="sr-callout"
      data-side={callout.side ?? 'right'}
      data-grow={callout.grow ?? 'down'}
      data-anchored={callout.anchored === false ? undefined : ''}
      data-active={state.active || undefined}
    >
      <span className="sr-callout__dot" />
      <span className="sr-callout__wire" />
      <div className="sr-callout__card">
        <p className="sr-callout__title">{callout.title}</p>
        {callout.text ? <p className="sr-callout__text">{callout.text}</p> : null}
      </div>
    </div>
  );
}

/** Индикатор фаз ролика «ПРОЕКТИРОВАНИЕ / ПРОИЗВОДСТВО / МОНТАЖ»: слово горит в своей фазе, клик перематывает. */
function PhaseStrip({ progress, api }) {
  const { phases = [], phaseIndex, seekTo, mode } = api;
  const isStatic = mode === 'static';
  return (
    <div role="group" aria-label="Ход ролика: проектирование, производство, монтаж" className="sr-phases" data-static={isStatic || undefined}>
      {phases.map((phase, index) => {
        const local = clamp01((progress - phase.from) / (phase.to - phase.from));
        const state = isStatic ? 'lit' : index < phaseIndex ? 'past' : index === phaseIndex ? 'active' : 'future';
        const fill = state === 'lit' || state === 'past' ? 1 : state === 'active' ? local : 0;
        return (
          <Fragment key={phase.id}>
            {index > 0 ? (
              <span className="sr-phases__slash" aria-hidden="true">
                /
              </span>
            ) : null}
            <button
              type="button"
              className="sr-phases__step"
              data-state={state}
              aria-pressed={!isStatic && index === phaseIndex}
              onClick={() => seekTo(phase.from + 0.012)}
            >
              <span className="sr-phases__label">{phase.label}</span>
              <span className="sr-phases__track" aria-hidden="true">
                <span className="sr-phases__fill" style={{ transform: `scaleX(${fill.toFixed(3)})` }} />
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}

function Directions() {
  const { directions } = useNav();
  return (
    <nav aria-label="Направления" className="sr-hero__dirs">
      <ul>
        {directions.map((direction) => {
          const total = getDirectionTotal(direction);
          return (
            <li key={direction.id} data-direction={direction.id}>
              <Link to={direction.to} className="sr-hero__dir">
                <span className="sr-hero__dir-name">{direction.name}</span>
                <span className="sr-hero__dir-meta tabular">
                  {total.toLocaleString('ru-RU')} {wordFor(total, 'position')} на dvk-style.ru
                </span>
                <ArrowUpRight className="sr-hero__dir-arrow size-5" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Свет сцены. Слои — прямые участники наложения в сцене (без своих контекстов наложения у родителя),
 * поэтому color-dodge и soft-light работают с кадром под ними.
 */
function Lights({ progress, mode, mapping, photo }) {
  const shadeRef = useRef(null);
  const beamRef = useRef(null);
  const glowRef = useRef(null);
  const fine = useFinePointer();
  const reduce = usePrefersReducedMotion();
  const [booted, setBooted] = useState(false);
  const isStatic = mode === 'static';
  const isVideo = mode === 'video';

  // При загрузке зажигается первая витрина: тень отступает от «всё выключено».
  useEffect(() => {
    const timer = setTimeout(() => setBooted(true), 140);
    return () => clearTimeout(timer);
  }, []);

  // Луч курсора: тень с «окном» и тёплое пятно едут за мышью с лёгкой инерцией.
  useEffect(() => {
    const shade = shadeRef.current;
    const beams = [beamRef.current, glowRef.current].filter(Boolean);
    const stage = findScrollVideoStage(shade);
    if (!shade || !stage) return undefined;
    const place = (x, y) => {
      const value = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      shade.style.transform = value;
      beams.forEach((beam) => {
        beam.style.transform = value;
      });
    };
    const focal = () => {
      const box = stage.getBoundingClientRect();
      const point = mapping.map(FOCAL);
      return { x: box.width * Math.min(1, Math.max(0, point.x)), y: box.height * point.y };
    };
    let current = focal();
    place(current.x, current.y);
    const parkOnResize = () => {
      if (!fine || reduce) {
        current = focal();
        place(current.x, current.y);
      }
    };
    window.addEventListener('resize', parkOnResize);
    if (!fine || reduce || isStatic) return () => window.removeEventListener('resize', parkOnResize);

    let target = { ...current };
    let frame = 0;
    let last = 0;
    const tick = (now) => {
      frame = 0;
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const k = 1 - Math.exp(-dt / BEAM_TAU_MS);
      current = { x: lerp(current.x, target.x, k), y: lerp(current.y, target.y, k) };
      place(current.x, current.y);
      if (Math.abs(current.x - target.x) > 0.5 || Math.abs(current.y - target.y) > 0.5) frame = requestAnimationFrame(tick);
      else last = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onMove = (event) => {
      const box = stage.getBoundingClientRect();
      const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      target = inside ? { x: event.clientX - box.left, y: event.clientY - box.top } : focal();
      stage.toggleAttribute('data-beam', inside);
      schedule();
    };
    const onLeave = (event) => {
      if (event.relatedTarget) return; // ушли не из окна, а на другой элемент
      target = focal();
      stage.removeAttribute('data-beam');
      schedule();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('resize', parkOnResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onLeave);
      stage.removeAttribute('data-beam');
    };
  }, [fine, reduce, isStatic, mapping]);

  // В ролике свет зажигается сам: тень варианта только собирает взгляд на первой витрине и уходит к середине.
  // Статичный кадр уже освещён. Заглушка (ролик не загрузился) освещает первый кадр светильниками.
  const lit = isStatic ? 1 : smooth(clamp01(progress / LIGHT_UP_UNTIL));
  // Фото из твиков уже освещено: тень лёгкая и уходит совсем — кадр должен читаться с первого экрана.
  const shade = isStatic ? 0 : isVideo ? lerp(0.46, 0, lit) : photo ? lerp(0.3, 0, lit) : lerp(0.6, 0.1, lit);
  // Светильники заглушки расставлены по первому кадру ролика — к фото из твиков они не относятся.
  const isPlaceholder = mode === 'placeholder' && !photo;
  const camera = isPlaceholder ? cameraTransform(heroConfig.camera, progress) : undefined;

  return (
    <>
      <span ref={shadeRef} className="sr-hero__shade" aria-hidden="true" style={{ opacity: booted ? shade : 0.9 }} />
      {isPlaceholder
        ? HERO_LAMPS.map((lamp) => {
            const point = mapping.map(lamp);
            return (
              <span
                key={lamp.id}
                className="sr-lamp"
                aria-hidden="true"
                data-on={(booted && progress >= lamp.at) || undefined}
                style={{ '--x': `${(point.x * 100).toFixed(2)}%`, '--y': `${(point.y * 100).toFixed(2)}%`, '--r': `${lamp.size * 100}vmax`, transform: camera }}
              />
            );
          })
        : null}
      {isStatic ? null : (
        <>
          <span ref={beamRef} className="sr-hero__beam" aria-hidden="true" style={{ '--beam': (1 - lit * 0.55).toFixed(3) }} />
          <span ref={glowRef} className="sr-hero__beam sr-hero__beam--glow" aria-hidden="true" style={{ '--beam': (1 - lit * 0.55).toFixed(3) }} />
        </>
      )}
      <span className="sr-hero__scrim" aria-hidden="true" />
    </>
  );
}

function Overlay({ progress, api, mapping, photo }) {
  const { id } = useVariant();
  const { contacts } = useCity();
  const company = getCompany();
  const phone = contacts?.phones?.[0];
  return (
    <>
      <Lights progress={progress} mode={api.mode} mapping={mapping} photo={photo} />
      <div className="sr-hero__content">
        <div className="sr-hero__lede">
          <Positioning text={company.positioning} />
          <div className="sr-hero__actions">
            <Button to={`/${id}/request`} magnetic className="sr-hero__cta">
              Заявка на подбор
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
            {phone ? (
              <a href={`tel:${toTel(phone)}`} className="sr-hero__phone tabular">
                <Phone className="size-4" aria-hidden="true" />
                {phone}
                <span className="sr-only">, {contacts.label}</span>
              </a>
            ) : null}
          </div>
          <p className="sr-hero__promise">{company.promise}</p>
        </div>
        <div className="sr-hero__console">
          <div className="sr-hero__strip">
            <PhaseStrip progress={progress} api={api} />
            <p className="sr-hero__credit sr-hero__credit--plain">
              {photo ? `Кадр ${photo.code}: визуализация интерьера, не объект ДВК` : HERO_CREDIT.text}
            </p>
          </div>
          <Directions />
        </div>
      </div>
    </>
  );
}

export function Hero() {
  const reduce = usePrefersReducedMotion();
  const mapping = useFrameMapping();
  // Твик hero: кадр-кандидат вместо ролика. Ролик из выбранного кадра делается следующим шагом,
  // а пока сцена работает как заглушка — кадр с медленным наездом и пояснениями по скроллу.
  const photo = heroPhoto(useTweaks().values.hero);
  const callouts = useMemo(() => placeCallouts(heroConfig.callouts, mapping, { dock: Boolean(photo) }), [mapping, photo]);
  const frame = photo
    ? { sources: undefined, poster: { src: photo.src, alt: photo.alt }, placeholderLabel: `Кадр ${photo.code} — кандидат для ролика` }
    : // reduced-motion: ролика нет — показываем его последний кадр, камера уже у прилавка
      { poster: reduce ? HERO_POSTERS.lit : heroConfig.poster, placeholderLabel: 'Ролик не загрузился — показан его первый кадр' };
  return (
    <section className="sr-hero" aria-labelledby="sr-hero-title" data-frame={photo ? photo.id : 'video'}>
      <ScrollVideo
        key={photo ? photo.id : 'video'}
        {...heroConfig}
        {...frame}
        callouts={callouts}
        className="sr-hero__video"
        listLabel="Детали интерьера по ходу ролика"
        renderCallout={(callout, state) => <Callout callout={callout} state={state} />}
        renderOverlay={(progress, api) => <Overlay progress={progress} api={api} mapping={mapping} photo={photo} />}
      />
    </section>
  );
}
