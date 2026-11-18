// Первый экран: поле цвета текущего направления на весь экран, интерьер в крупной рамке-образце (ролик по скроллу
// или кадр-заглушка из heroPhotos), кинетический заголовок — глаголы «прокрашиваются» по фазам ролика,
// сигнальная «Заявка на подбор» + телефон + обещание, веер трёх равных образцов-направлений у края.
import { memo, useLayoutEffect, useRef } from 'react';
import { getCompany } from '../../../core/catalog/index.js';
import { useCity } from '../../../core/city/index.js';
import { ScrollVideo, findScrollVideoStage } from '../../../core/scroll-video/index.js';
import { toTel } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { cn } from '../../../lib/utils.js';
import { DirectionSwatch, useFanDirections } from '../Fan.jsx';
import { useMediaQuery } from '../../../core/hooks/media.js';
import { heroConfig } from '../hero.js';
import { Button, FieldCode } from '../ui.jsx';

const VERBS = /^(проектируем|производим|монтируем)([,.;:]?)$/i;
// Разбивка формулы позиционирования: три глагола — три крупные строки (они же фазы ролика), остальное — «хвост».
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

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/** Заголовок: глагол фазы ролика закрашивается «чернилами» поля по мере прохождения своей фазы. */
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
        const paint = phase ? clamp01((progress - phase.from) / (phase.to - phase.from)) : 0;
        return (
          <span key={wordIndex}>
            <span className={cn('ral-paint', match[2] && 'ral-paint--punct')} style={{ '--paint': paint.toFixed(3) }}>
              {match[1]}
              <span className="ral-paint__ink" aria-hidden="true">
                {match[1]}
              </span>
            </span>
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

/** Окно рамки: его прямоугольник (относительно сцены) уходит в переменные --wx/--wy/--ww/--wh секции. */
function useWindowRect(windowRef) {
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
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    observer.observe(stage);
    const title = stage.querySelector('.ral-hero__title');
    if (title) observer.observe(title);
    document.fonts?.ready?.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [windowRef]);
}

function HeroLayer({ progress, api, direction }) {
  const company = getCompany();
  const windowRef = useRef(null);
  useWindowRect(windowRef);
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
        <div className="ral-hero__band" data-field-scope="paper">
          <FieldCode className="ral-hero__field-code" direction={direction} withLabel />
          <ol className="ral-hero__phases" aria-label="Фазы ролика">
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

/** Ярлык пояснения: точка кадра и бирка-образец с кодом, заголовком, текстом из данных. */
function CalloutTag(callout, { active }) {
  const side = callout.x > 0.55 ? 'left' : 'right';
  const vertical = callout.y > 0.62 ? 'up' : 'down';
  return (
    <div className={cn('ral-tag', `ral-tag--${side}`, `ral-tag--${vertical}`)} data-active={active}>
      <span className="ral-tag__pin" aria-hidden="true" />
      <div className="ral-tag__card">
        <span className="ral-tag__code ral-mono">{callout.code}</span>
        <p className="ral-tag__title">{callout.title}</p>
        <p className="ral-tag__text">{callout.text}</p>
        {callout.note ? <p className="ral-tag__note">Из характеристик: {callout.note}</p> : null}
      </div>
    </div>
  );
}

export function Hero({ direction }) {
  // Узкое окно рамки: пометка заглушки — одной короткой строкой, чтобы не спорить с ярлыками.
  const roomy = useMediaQuery('(min-width: 640px)');
  return (
    <section className="ral-hero" aria-labelledby="ral-hero-title" data-direction-field={direction ?? 'primer'}>
      <ScrollVideo
        {...heroConfig}
        className="ral-hero__video"
        listLabel="Что в кадре"
        placeholderLabel={roomy ? 'Кадр-заглушка: фото проекта ДВК. Здесь будет видео-интерьер' : 'Здесь будет видео-интерьер'}
        renderCallout={CalloutTag}
        renderOverlay={(progress, api) => <HeroLayer progress={progress} api={api} direction={direction} />}
      />
    </section>
  );
}
