// Лист 1 «Общий вид»: закреплённый лист в рамке формата с зонами. В поле листа — заголовок позиционирования,
// заявка, телефон и обещание; справа — спецификация трёх направлений (три равных входа); внизу — «Вид А»:
// ролик или заглушка (фото проекта ДВК) с выносками-позициями; в углу — основная надпись «Лист 1».
// Механику даёт ядро (ScrollVideo); окно вида измеряется и передаётся сцене CSS-переменными.
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Phone } from 'lucide-react';
import { getCompany, getDirectionTotal, getDirections, buildCatalogUrl } from '../../../core/catalog/index.js';
import { useCity } from '../../../core/city/index.js';
import { ScrollVideo, findScrollVideoRoot, findScrollVideoStage } from '../../../core/scroll-video/index.js';
import { toTel, wordFor } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { heroConfig, mapPhotoPoint } from '../lib/hero.js';
import { Button } from '../ui/Button.jsx';
import { Stamp } from './Sheet.jsx';

const ZONES = 8;
// ЕСКД: зоны по горизонтали — цифрами справа налево, по вертикали — латинскими буквами снизу вверх.
const ROWS = ['D', 'C', 'B', 'A'];

/** Измеряет окно «Вида А» и отдаёт сцене его прямоугольник: постер, ролик и выноски встают ровно в него. */
function useViewRect(slotRef, onSize) {
  useLayoutEffect(() => {
    const slot = slotRef.current;
    // Корень и сцена ядра — по контракту классов ScrollVideo; на корень ставятся переменные окна вида.
    const track = findScrollVideoRoot(slot);
    const stage = findScrollVideoStage(slot);
    if (!slot || !track || !stage) return undefined;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const s = stage.getBoundingClientRect();
      const v = slot.getBoundingClientRect();
      if (!v.width || !v.height) return;
      track.style.setProperty('--view-l', `${v.left - s.left}px`);
      track.style.setProperty('--view-t', `${v.top - s.top}px`);
      track.style.setProperty('--view-w', `${v.width}px`);
      track.style.setProperty('--view-h', `${v.height}px`);
      onSize?.({ w: Math.round(v.width), h: Math.round(v.height) });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    observer?.observe(slot);
    observer?.observe(stage);
    window.addEventListener('resize', schedule);
    document.fonts?.ready?.then(schedule).catch(() => {});
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [slotRef, onSize]);
}

function Zones() {
  return (
    <div className="bp-hs__zones" aria-hidden="true">
      <ol className="bp-hs__zones-x">
        {Array.from({ length: ZONES }, (_, i) => (
          <li key={i}>{ZONES - i}</li>
        ))}
      </ol>
      <ol className="bp-hs__zones-y">
        {ROWS.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ol>
    </div>
  );
}

function DirectionSpec({ variantId }) {
  return (
    <nav className="bp-hs__spec" aria-label="Три направления">
      <p className="bp-hs__spec-head" aria-hidden="true">
        <span>Поз.</span>
        <span>Направление</span>
        <span>Разд.</span>
        <span>Позиций</span>
      </p>
      <ul>
        {getDirections().map((direction, index) => {
          const total = getDirectionTotal(direction);
          return (
            <li key={direction.id}>
              <Link to={buildCatalogUrl(variantId, { direction: direction.id })} className="bp-hs__spec-row">
                <span className="bp-mono bp-hs__spec-pos">{index + 1}</span>
                <span className="bp-hs__spec-name font-display">{direction.name}</span>
                <span className="tabular bp-hs__spec-num">
                  {direction.sections.length}
                  <span className="sr-only"> {wordFor(direction.sections.length, 'section')}</span>
                </span>
                <span className="tabular bp-hs__spec-num">
                  {total}
                  <span className="sr-only"> {wordFor(total, 'position')} на dvk-style.ru</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HeroSheet({ mode, onViewSize, aspect }) {
  const { id: variantId } = useVariant();
  const { contacts } = useCity();
  const company = getCompany();
  const slotRef = useRef(null);
  const phone = contacts?.phones?.[0];
  useViewRect(slotRef, onViewSize);

  return (
    <div className="bp-hs" data-mode={mode} style={{ '--ar': aspect }}>
      <div className="bp-hs__frame" aria-hidden="true" />
      <Zones />
      <div className="bp-hs__field">
        <div className="bp-hs__title">
          <h1 className="bp-hs__h1 font-display">{company.positioning}</h1>
          <div className="bp-hs__cta">
            <Button to={`/${variantId}/request`}>Заявка на подбор</Button>
            {phone ? (
              <a href={`tel:${toTel(phone)}`} className="bp-hs__phone">
                <Phone className="size-4" aria-hidden="true" />
                <span className="tabular">{phone}</span>
                <span className="sr-only">, {contacts.label}</span>
              </a>
            ) : null}
            <p className="bp-hs__promise">{company.promise}</p>
          </div>
        </div>
        <DirectionSpec variantId={variantId} />
        <div className="bp-hs__viewbox">
          <div ref={slotRef} className="bp-hs__view" aria-hidden="true">
            <span className="bp-hs__view-label bp-mono">Вид А</span>
          </div>
        </div>
        <div className="bp-hs__slot" aria-hidden="true" />
        <Stamp sheetId="hero" organization={company.legalName} className="bp-hs__stamp" />
      </div>
    </div>
  );
}

function HeroCallout({ callout, index, local, view }) {
  // первая выноска видна с первого кадра; остальные вычерчиваются в начале своего отрезка
  const draw = callout.from === 0 ? 1 : Math.min(1, Math.max(0, local / 0.3));
  // в заглушке выноска указывает на ту же деталь опорного фото с учётом движения камеры
  const p = callout.from + local * (callout.to - callout.from);
  const onPhoto = mapPhotoPoint(callout.photo ?? callout, heroConfig.poster, view, heroConfig.camera, p);
  return (
    <div className="bp-co" style={{ '--cx': callout.x, '--cy': callout.y, '--px': onPhoto.x, '--py': onPhoto.y, '--draw': draw }}>
      <span className="bp-co__dot" />
      <span className="bp-co__leader" />
      <div className="bp-co__shelf">
        <p className="bp-co__title">
          <span className="bp-co__pos bp-mono">{index + 1}</span>
          {callout.title}
        </p>
        {callout.text ? <p className="bp-co__text">{callout.text}</p> : null}
      </div>
    </div>
  );
}

export function Hero() {
  const config = heroConfig;
  const [view, setView] = useState(null);
  const onViewSize = useCallback((next) => setView((current) => (current && current.w === next.w && current.h === next.h ? current : next)), []);
  const indexOf = (callout) => config.callouts.findIndex((item) => item.id === callout.id);
  // окно заглушки — в пропорциях фото, но не уже 2,2 : 1 (лёгкая обрезка по краям вместо пустого листа)
  const photoAspect = config.poster?.w && config.poster?.h ? Math.min(2.2, config.poster.w / config.poster.h) : 16 / 9;
  return (
    <section id="sheet-hero" data-sheet="1" className="bp-hero-sheet" aria-labelledby="bp-hero-title">
      <h2 id="bp-hero-title" className="sr-only">
        Общий вид: заявка, направления и интерьер
      </h2>
      <ScrollVideo
        {...config}
        className="bp-hero"
        listLabel="Позиции на виде А"
        renderOverlay={(progress, api) => <HeroSheet mode={api.mode} onViewSize={onViewSize} aspect={api.mode === 'video' ? 16 / 9 : photoAspect} />}
        renderCallout={(callout, state) => <HeroCallout callout={callout} index={indexOf(callout)} local={state.local} view={view} />}
      />
    </section>
  );
}
