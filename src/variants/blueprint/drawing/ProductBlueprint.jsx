// «Режим чертёж» на странице товара: поверх фото галереи — чертёж изделия, открывается ползунком сравнения
// (desktop — ещё и наведением: граница идёт за курсором), переключателем «Фото / Чертёж» (тап на телефоне)
// и слоями «Каркас / Стекло / LED / Размеры». Галерея — ядра, поэтому чертёж встаёт в неё порталом.
import { useEffect, useId, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../lib/utils.js';
import { LAYER_LABELS, UNKNOWN, designation, drawingSpec } from '../lib/drawing.js';
import { Drawing } from './Drawing.jsx';

const ALL_LAYERS = ['frame', 'glass', 'led', 'dims'];
const FIND_ATTEMPTS = 40;

function useGalleryTargets(productId) {
  const [targets, setTargets] = useState(null);
  useLayoutEffect(() => {
    let frame = 0;
    let attempts = 0;
    const find = () => {
      const gallery = document.querySelector('main.page-product .gallery');
      const stage = gallery?.firstElementChild;
      if (gallery && stage) {
        setTargets({ gallery, stage });
        return;
      }
      attempts += 1;
      if (attempts < FIND_ATTEMPTS && typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(find);
    };
    find();
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [productId]);
  return targets;
}

function finePointer() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** @param {{ product: object }} props */
export function ProductBlueprint({ product }) {
  const targets = useGalleryTargets(product.id);
  const spec = drawingSpec(product);
  const code = designation(product);
  const [split, setSplit] = useState(0); // 0 — фото, 100 — чертёж
  const [hover, setHover] = useState(null);
  const [visible, setVisible] = useState(() => new Set(spec.layers));
  const sliderId = useId();

  // Наведение на фото (точный указатель): граница сравнения идёт за курсором.
  useEffect(() => {
    const stage = targets?.stage;
    if (!stage || !finePointer()) return undefined;
    const move = (event) => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width) return;
      setHover(Math.round(Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))));
    };
    const leave = () => setHover(null);
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerleave', leave);
    return () => {
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerleave', leave);
    };
  }, [targets]);

  if (!targets) return null;
  const shown = hover ?? split;
  const toggleLayer = (layer) =>
    setVisible((current) => {
      const next = new Set(current);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });

  const overlay = (
    <div className={cn('bp-pb', hover !== null && 'is-tracking')} style={{ '--split': `${shown}%` }} aria-hidden="true">
      <div className="bp-pb__sheet">
        <Drawing spec={spec} materials={product.materials ?? []} code={code} visible={[...visible]} />
      </div>
      <span className="bp-pb__handle" />
    </div>
  );

  const toolbar = (
    <div className="bp-pb-bar" role="group" aria-label="Режим чертёж">
      <div className="bp-pb-bar__modes">
        <span className="bp-pb-bar__title">Режим чертёж</span>
        <div className="bp-seg" role="group" aria-label="Показать">
          <button type="button" aria-pressed={split === 0} onClick={() => setSplit(0)}>
            Фото
          </button>
          <button type="button" aria-pressed={split === 100} onClick={() => setSplit(100)}>
            Чертёж
          </button>
        </div>
      </div>
      <div className="bp-pb-bar__slider">
        <label htmlFor={sliderId}>Сравнить</label>
        <input
          id={sliderId}
          type="range"
          min="0"
          max="100"
          step="1"
          value={split}
          aria-valuetext={`Чертёж открыт на ${split}%`}
          onChange={(event) => setSplit(Number(event.target.value))}
        />
      </div>
      <fieldset className="bp-pb-bar__layers">
        <legend className="sr-only">Слои чертежа</legend>
        {ALL_LAYERS.map((layer) => {
          const available = spec.layers.includes(layer);
          const note = layer === 'led' && spec.led === 'unknown' ? ` ${UNKNOWN}` : !available ? ' — нет' : '';
          return (
            <label key={layer} className={cn('bp-check', !available && 'is-disabled')}>
              <input type="checkbox" checked={available && visible.has(layer)} disabled={!available} onChange={() => toggleLayer(layer)} />
              <span>
                {LAYER_LABELS[layer]}
                {note ? <span className="bp-check__note">{note}</span> : null}
              </span>
            </label>
          );
        })}
      </fieldset>
      <p className="bp-pb-bar__note">
        Размеры — из данных товара, мм. Пропорции чертежа {spec.ratio ? 'по габаритам' : 'условные: габаритов в данных нет'}.
      </p>
    </div>
  );

  return (
    <>
      {createPortal(overlay, targets.stage)}
      {createPortal(toolbar, targets.gallery)}
    </>
  );
}
