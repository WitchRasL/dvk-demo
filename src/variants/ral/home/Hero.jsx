// Первый экран: поле цвета текущего направления на весь экран, интерьер в крупной рамке-образце (в поле грунта
// и ритейла — ролик по скроллу, в полях благоустройства и металла — фото проекта направления), кинетический
// заголовок — глаголы «прокрашиваются» по буквам на входе в свою фазу, сигнальная «Заявка на подбор» + телефон
// + обещание, веер трёх равных образцов-направлений у края.
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getCompany } from '../../../core/catalog/index.js';
import { useCity } from '../../../core/city/index.js';
import { ScrollVideo, findScrollVideoStage } from '../../../core/scroll-video/index.js';
import { toTel } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { cn } from '../../../lib/utils.js';
import { DirectionSwatch, useFanDirections } from '../Fan.jsx';
import { heroSceneFor, paintedLetters, placeCallouts } from '../hero.js';
import { Button, FieldCode } from '../ui.jsx';

const VERBS = /^(проектируем|производим|монтируем)([,.;:]?)$/i;
// Разбивка формулы позиционирования: три глагола — три крупные строки (они же фазы сцены), остальное — «хвост».
const LINE_BREAKS = [1, 2, 4];

function titleLines(text) {
  const words = String(text).split(' ');
  if (words.length <= LINE_BREAKS.at(-1)) return [words];
  const lines = [];
  let start = 0;
  for (const end of [...LINE_BREAKS, words.length]) {
    lines.push(words.slice(start, end));
    start = end;
  }
  return lines;
}

/**
 * Правые края букв слова в долях его ширины: по ним встаёт край краски. Доли не зависят от кегля,
 * только от шрифта — перемеряются, когда слово меняет ширину (догрузился шрифт, сменился экран).
 */
function useLetterEdges(ref, word) {
  const [edges, setEdges] = useState(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const text = element?.firstChild;
    if (!text || text.nodeType !== 3 || typeof document.createRange !== 'function') return undefined;
    const measure = () => {
      const range = document.createRange();
      if (typeof range.getBoundingClientRect !== 'function') return;
      range.selectNodeContents(text);
      const box = range.getBoundingClientRect();
      if (!(box.width > 0)) return;
      const next = Array.from(word, (_, index) => {
        range.setStart(text, 0);
        range.setEnd(text, index + 1);
        return (range.getBoundingClientRect().right - box.left) / box.width;
      });
      setEdges((previous) => (previous && previous.every((edge, index) => Math.abs(edge - next[index]) < 0.002) ? previous : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, word]);
  return edges;
}

/** Глагол фазы: поверх слова — та же надпись вывороткой; край краски идёт по границам букв. */
const PaintedVerb = memo(function PaintedVerb({ word, punct, count }) {
  const ref = useRef(null);
  const edges = useLetterEdges(ref, word);
  const state = count <= 0 ? 'none' : count >= word.length ? 'full' : 'part';
  const edge = state === 'part' ? (edges?.[count - 1] ?? count / word.length) : state === 'full' ? 1 : 0;
  return (
    <span ref={ref} className={cn('ral-paint', punct && 'ral-paint--punct')} data-paint={state} style={{ '--paint': edge.toFixed(4) }}>
      {word}
      <span className="ral-paint__ink" aria-hidden="true">
        {word}
      </span>
    </span>
  );
});

/** Заголовок: глагол закрашивается «чернилами» поля, когда сцена входит в его фазу. */
function KineticTitle({ text, progress, phases }) {
  let verbIndex = 0;
  const lines = titleLines(text);
  return lines.map((words, lineIndex) => (
    <span key={lineIndex} className={cn('ral-title__line', lines.length > 1 && lineIndex === lines.length - 1 && 'ral-title__tail')} style={{ '--l': lineIndex }}>
      {words.map((word, wordIndex) => {
        const space = wordIndex < words.length - 1 ? ' ' : '';
        const match = word.match(VERBS);
        if (!match) return word + space;
        const phase = phases[verbIndex];
        verbIndex += 1;
        return (
          <span key={wordIndex}>
            <PaintedVerb word={match[1]} punct={Boolean(match[2])} count={paintedLetters(progress, phase, match[1].length)} />
            {match[2]}
            {space}
          </span>
        );
      })}
      {lineIndex < lines.length - 1 ? ' ' : null}
    </span>
  ));
}

const Offer = memo(function Offer() {
  const { id } = useVariant();
  const { contacts } = useCity();
  const company = getCompany();
  const phone = contacts?.phones?.[0];
  return (
    <div className="ral-hero__offer">
      <p className="ral-hero__promise">{company.promise}</p>
      <div className="ral-hero__actions">
        <Button to={`/${id}/request`} size="lg">
          Заявка на подбор
        </Button>
        {phone ? (
          <a href={`tel:${toTel(phone)}`} className="ral-hero__phone">
            <span className="ral-hero__phone-label">Или позвоните</span>
            <span className="tabular">{phone}</span>
            <span className="sr-only">, {contacts.label}</span>
          </a>
        ) : null}
      </div>
    </div>
  );
});

const HeroFan = memo(function HeroFan() {
  const directions = useFanDirections();
  return (
    <nav aria-label="Направления" className="ral-hero__fan" data-interactive>
      {directions.map((direction, index) => (
        <DirectionSwatch key={direction.id} direction={direction} className="ral-hero__blade" style={{ '--i': index }} />
      ))}
    </nav>
  );
});

/**
 * Окно рамки: его прямоугольник (относительно сцены) уходит в переменные --wx/--wy/--ww/--wh секции,
 * а размер — в onMeasure: по нему точки пояснений пересчитываются под обрезку кадра.
 */
function useWindowRect(windowRef, onMeasure) {
  useLayoutEffect(() => {
    const target = windowRef.current;
    // Секция ищется от окна: ref родителя в layout-эффекте ребёнка ещё пуст.
    const section = target?.closest('.ral-hero');
    if (!target || !section || typeof ResizeObserver === 'undefined') return undefined;
    const stage = findScrollVideoStage(target) ?? section;
    const measure = () => {
      const box = target.getBoundingClientRect();
      const frame = stage.getBoundingClientRect();
      section.style.setProperty('--wx', `${Math.round(box.left - frame.left)}px`);
      section.style.setProperty('--wy', `${Math.round(box.top - frame.top)}px`);
      section.style.setProperty('--ww', `${Math.round(box.width)}px`);
      section.style.setProperty('--wh', `${Math.round(box.height)}px`);
      onMeasure?.(Math.round(box.width), Math.round(box.height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    observer.observe(stage);
    const title = stage.querySelector('.ral-hero__title');
    if (title) observer.observe(title);
    document.fonts?.ready?.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [windowRef, onMeasure]);
}

function HeroLayer({ progress, api, direction, caption, onMeasure }) {
  const company = getCompany();
  const windowRef = useRef(null);
  useWindowRect(windowRef, onMeasure);
  const phases = api.phases ?? [];
  return (
    <div className="ral-hero__layer">
      <div className="ral-hero__mat" aria-hidden="true" />
      <h1 id="ral-hero-title" className="ral-hero__title">
        <KineticTitle text={company.positioning} progress={api.mode === 'static' ? 0 : progress} phases={phases} />
      </h1>
      <Offer />
      <div className="ral-hero__frame">
        <div ref={windowRef} className="ral-hero__window" aria-hidden="true" />
        {/* Подпись кадра: чьё фото и что с ним сделано — видна в любом режиме сцены. На телефоне объект назван коротко. */}
        <p className="ral-hero__caption">
          <span>{caption.lead}</span> <span className="ral-hero__caption-object">{caption.text}</span>
          <span className="ral-hero__caption-object is-short" aria-hidden="true">
            {caption.short}
          </span>
        </p>
        <div className="ral-hero__band" data-field-scope="paper">
          <FieldCode className="ral-hero__field-code" direction={direction} withLabel />
          <ol className="ral-hero__phases" aria-label="Фазы работы">
            {phases.map((phase, index) => (
              <li key={phase.id}>
                <button
                  type="button"
                  aria-current={api.phaseIndex === index ? 'step' : undefined}
                  onClick={() => api.seekTo?.(phase.from + 0.01)}
                  disabled={api.mode === 'static'}
                >
                  <span className="ral-hero__phase-n tabular" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="ral-hero__phase-t">{phase.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <HeroFan />
    </div>
  );
}

/**
 * Ярлык пояснения: точка кадра и бирка-образец с кодом, заголовком, текстом из данных.
 * Бирка едет за своей деталью: сдвиг от начала отрезка к его концу — в долях окна рамки (--tx, --ty).
 */
function CalloutTag(callout, { active, local }) {
  const side = callout.x > 0.5 ? 'left' : 'right';
  const vertical = callout.y > 0.55 ? 'up' : 'down';
  const style = {
    '--px': callout.x.toFixed(4),
    '--tx': ((callout.dx ?? 0) * local).toFixed(4),
    '--ty': ((callout.dy ?? 0) * local).toFixed(4),
  };
  return (
    <div className={cn('ral-tag', `ral-tag--${side}`, `ral-tag--${vertical}`)} data-active={active} style={style}>
      <span className="ral-tag__pin" aria-hidden="true" />
      <div className="ral-tag__card">
        <span className="ral-tag__code ral-mono">{callout.code}</span>
        <p className="ral-tag__title">{callout.title}</p>
        <p className="ral-tag__text">{callout.text}</p>
        {callout.note ? <p className="ral-tag__note">{callout.note}</p> : null}
      </div>
    </div>
  );
}

export function Hero({ direction }) {
  const scene = heroSceneFor(direction);
  const [view, setView] = useState(null);
  const onMeasure = useCallback((w, h) => setView((previous) => (previous?.w === w && previous?.h === h ? previous : { w, h })), []);
  const callouts = useMemo(() => placeCallouts(scene, view), [scene, view]);
  return (
    <section
      className="ral-hero"
      aria-labelledby="ral-hero-title"
      data-direction-field={direction ?? 'primer'}
      data-scene={scene.id}
      style={{ '--hero-focus': `${scene.focus.x * 100}% ${scene.focus.y * 100}%` }}
    >
      <ScrollVideo
        key={scene.id}
        sources={scene.sources}
        poster={scene.poster}
        camera={scene.camera}
        callouts={callouts}
        phases={scene.phases}
        lengthVh={scene.lengthVh}
        mobileLengthVh={scene.mobileLengthVh}
        className="ral-hero__video"
        listLabel="Что в кадре"
        renderCallout={CalloutTag}
        renderOverlay={(progress, api) => <HeroLayer progress={progress} api={api} direction={direction} caption={scene.caption} onMeasure={onMeasure} />}
      />
    </section>
  );
}
