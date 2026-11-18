// Hero «Шоурума» — фишка «Включи витрину». Ночной шоурум: при загрузке зажигается первая витрина,
// по скроллу — остальные (свет включается: opacity + clip-path круга от точки), курсор — луч света
// (слой тени с «окном» двигается transform за мышью). На тач-устройствах свет только по скроллу,
// при reduced-motion всё освещено сразу и без движения.
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Phone } from 'lucide-react';
import { ScrollVideo, cameraTransform } from '../../../core/scroll-video/index.js';
import { getCompany } from '../../../core/catalog/index.js';
import { useCity } from '../../../core/city/index.js';
import { useNav } from '../../../core/layout/nav.js';
import { plural, toTel } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { HERO_LAMPS, heroConfig } from '../hero-config.js';
import { useFinePointer, useReducedMotion } from '../light.js';
import { Button } from '../ui.jsx';

const POSITION_FORMS = ['позиция', 'позиции', 'позиций'];
/** Доля пути hero, за которую шоурум освещается полностью. */
const LIGHT_UP_UNTIL = 0.45;
/** Точка, куда смотрит свет без мыши: главная пристенная витрина. */
const FOCAL = { x: 0.44, y: 0.42 };
const BEAM_TAU_MS = 110;

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => value * value * (3 - 2 * value);
const lerp = (from, to, t) => from + (to - from) * t;

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
  const side = callout.x > 0.72 ? 'left' : 'right';
  return (
    <div className="sr-callout" data-side={side} data-active={state.active || undefined}>
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
          const total = direction.sections.reduce((sum, section) => sum + (section.count ?? 0), 0);
          return (
            <li key={direction.id} data-direction={direction.id}>
              <Link to={direction.to} className="sr-hero__dir">
                <span className="sr-hero__dir-name">{direction.name}</span>
                <span className="sr-hero__dir-meta tabular">
                  {total.toLocaleString('ru-RU')} {plural(total, POSITION_FORMS)} на dvk-style.ru
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
function Lights({ progress, mode }) {
  const shadeRef = useRef(null);
  const beamRef = useRef(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
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
    const beam = beamRef.current;
    const stage = shade?.closest('.scroll-video__stage');
    if (!shade || !stage) return undefined;
    const place = (x, y) => {
      const value = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      shade.style.transform = value;
      if (beam) beam.style.transform = value;
    };
    const focal = () => {
      const box = stage.getBoundingClientRect();
      return { x: box.width * FOCAL.x, y: box.height * FOCAL.y };
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
  }, [fine, reduce, isStatic]);

  const lit = isStatic ? 1 : smooth(clamp01(progress / LIGHT_UP_UNTIL));
  const shade = isStatic ? 0.18 : isVideo ? lerp(0.5, 0.14, lit) : lerp(0.86, 0.34, lit);
  const camera = mode === 'placeholder' ? cameraTransform(heroConfig.camera, progress) : undefined;

  return (
    <>
      <span className="sr-hero__grade" aria-hidden="true" />
      <span ref={shadeRef} className="sr-hero__shade" aria-hidden="true" style={{ opacity: booted ? shade : 0.97 }} />
      {!isVideo
        ? HERO_LAMPS.map((lamp) => (
            <span
              key={lamp.id}
              className="sr-lamp"
              aria-hidden="true"
              data-on={isStatic || (booted && progress >= lamp.at) || undefined}
              style={{ '--x': `${lamp.x * 100}%`, '--y': `${lamp.y * 100}%`, '--r': `${lamp.size * 100}vmax`, transform: camera }}
            />
          ))
        : null}
      <span ref={beamRef} className="sr-hero__beam" aria-hidden="true" style={{ opacity: isStatic ? 0 : 1 - lit * 0.75 }} />
      <span className="sr-hero__scrim" aria-hidden="true" />
    </>
  );
}

function Overlay({ progress, api }) {
  const { id } = useVariant();
  const { contacts } = useCity();
  const company = getCompany();
  const phone = contacts?.phones?.[0];
  return (
    <>
      <Lights progress={progress} mode={api.mode} />
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
          <PhaseStrip progress={progress} api={api} />
          <Directions />
        </div>
      </div>
    </>
  );
}

export function Hero() {
  return (
    <section className="sr-hero" aria-labelledby="sr-hero-title">
      <ScrollVideo
        {...heroConfig}
        className="sr-hero__video"
        placeholderLabel="Здесь будет видео-интерьер"
        listLabel="Детали интерьера по ходу ролика"
        renderCallout={(callout, state) => <Callout callout={callout} state={state} />}
        renderOverlay={(progress, api) => <Overlay progress={progress} api={api} />}
      />
    </section>
  );
}
