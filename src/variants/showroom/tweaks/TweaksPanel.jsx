// Панель «Твики»: выбор фото для hero и переключение «новые / с сайта» по экранам главной.
// Живёт в правом нижнем углу главной «Шоурума» (слева — переключатель вариантов), рендерится внутри корня варианта.
import { useEffect, useId, useRef, useState } from 'react';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { asset } from '../../../lib/base-url.js';
import { imageSrc } from '../../../lib/images.js';
import { HERO_POSTERS } from '../hero-config.js';
import { FROM_SITE, GENERATED, HERO_PHOTOS, HERO_VIDEO, heroPhoto } from './photos.js';
import { useTweaks } from './store.jsx';

/** Экран главной, на котором виден твик: после выбора страница прокручивается к нему, если он не в окне. */
const SCREEN_OF = { hero: '.sr-hero', tile: '.sr-bento', industries: '.sr-industries', catalog: '.sr-showcase', projects: '.sr-projects' };
/** Экраны с переключателем «новые фото / фото с сайта». */
const SWITCHES = [
  { key: 'industries', title: 'Фото отраслей', short: 'отрасли' },
  { key: 'catalog', title: 'Каталог-витрина', short: 'каталог' },
  { key: 'projects', title: 'Проекты', short: 'проекты' },
];

function showScreen(key) {
  const screen = document.querySelector(SCREEN_OF[key]);
  if (!screen || typeof screen.scrollIntoView !== 'function') return;
  const box = screen.getBoundingClientRect();
  const visible = box.top < window.innerHeight * 0.6 && box.bottom > window.innerHeight * 0.4;
  if (!visible) screen.scrollIntoView({ block: 'start' });
}

function Choice({ name, value, checked, onPick, thumb, code, label }) {
  return (
    <label className="sr-tweaks__choice" data-checked={checked || undefined} data-thumb={thumb ? '' : undefined}>
      <input type="radio" className="sr-only" name={name} value={value} checked={checked} onChange={() => onPick(value)} />
      {thumb ? <img src={thumb} alt="" width="800" height="447" loading="lazy" decoding="async" /> : null}
      <span className="sr-tweaks__tag">
        {code ? <span className="sr-tweaks__code tabular">{code}</span> : null}
        {label ? <span className="sr-tweaks__name">{label}</span> : null}
      </span>
    </label>
  );
}

function Group({ title, hint, children }) {
  return (
    <fieldset className="sr-tweaks__group">
      <legend className="sr-tweaks__legend">{title}</legend>
      {hint ? <p className="sr-tweaks__hint">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

/** Что выбрано — одной строкой: её удобно прислать как ответ «беру вот эти». */
function summary(values) {
  const heroCode = heroPhoto(values.hero)?.code ?? 'ролик';
  const tileCode = heroPhoto(values.tile)?.code ?? 'с сайта';
  const rest = SWITCHES.map(({ key, short }) => `${short}: ${values[key] === GENERATED ? 'новые' : 'с сайта'}`);
  return [`hero ${heroCode}`, `плитки ${tileCode}`, ...rest].join(' · ');
}

export function TweaksPanel() {
  const { values, set, reset, isDefault } = useTweaks();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  const panelId = useId();
  const name = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const pick = (key) => (value) => {
    set(key, value);
    showScreen(key);
  };

  return (
    <aside className="sr-tweaks" aria-label="Твики: выбор фото главной">
      {open ? (
        <div id={panelId} className="sr-tweaks__panel" data-lenis-prevent="">
          <header className="sr-tweaks__head">
            <p className="sr-tweaks__title">Твики · фото главной</p>
            <button type="button" className="sr-tweaks__icon" aria-label="Закрыть твики" onClick={() => setOpen(false)}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          <Group title="Кадр hero" hint="Из выбранного кадра следующим шагом делается ролик по скроллу.">
            <div className="sr-tweaks__grid">
              {HERO_PHOTOS.map((photo) => (
                <Choice
                  key={photo.id}
                  name={`${name}-hero`}
                  value={photo.id}
                  checked={values.hero === photo.id}
                  onPick={pick('hero')}
                  thumb={imageSrc(photo.base)}
                  code={photo.code}
                  label={photo.name}
                />
              ))}
              <Choice
                name={`${name}-hero`}
                value={HERO_VIDEO}
                checked={values.hero === HERO_VIDEO}
                onPick={pick('hero')}
                thumb={asset(HERO_POSTERS.lit.src)}
                code="Ролик"
                label="Как сейчас на сайте"
              />
            </div>
          </Group>

          <Group title="Плитки направлений" hint="Кадр — для большой плитки «Торговое оборудование»; у остальных плиток свои фото. «С сайта» возвращает прежние во всех плитках.">
            <div className="sr-tweaks__row">
              {HERO_PHOTOS.map((photo) => (
                <Choice
                  key={photo.id}
                  name={`${name}-tile`}
                  value={photo.id}
                  checked={values.tile === photo.id}
                  onPick={pick('tile')}
                  thumb={imageSrc(photo.base)}
                  code={photo.code}
                />
              ))}
              <Choice name={`${name}-tile`} value={FROM_SITE} checked={values.tile === FROM_SITE} onPick={pick('tile')} code="С сайта" />
            </div>
          </Group>

          {SWITCHES.map(({ key, title }) => (
            <Group key={key} title={title}>
              <div className="sr-tweaks__row">
                <Choice name={`${name}-${key}`} value={GENERATED} checked={values[key] === GENERATED} onPick={pick(key)} code="Новые" />
                <Choice name={`${name}-${key}`} value={FROM_SITE} checked={values[key] === FROM_SITE} onPick={pick(key)} code="С сайта" />
              </div>
            </Group>
          ))}

          <footer className="sr-tweaks__foot">
            <p className="sr-tweaks__summary">
              <span>Выбрано</span> {summary(values)}
            </p>
            <button type="button" className="sr-tweaks__reset" onClick={reset} disabled={isDefault}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Сбросить
            </button>
          </footer>
        </div>
      ) : null}
      <button
        ref={toggleRef}
        type="button"
        className="sr-tweaks__toggle"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        Твики
      </button>
    </aside>
  );
}
