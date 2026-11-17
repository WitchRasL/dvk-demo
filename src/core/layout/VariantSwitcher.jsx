// Плавающий переключатель вариантов — «рамка концепта», а не часть дизайна варианта:
// одинаковый во всех трёх, нейтральный, свои стили (variant-switcher.css), токены варианта не читает.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronRight, Info, Layers, X } from 'lucide-react';
import { VARIANTS } from '../variants/registry.js';
import { useSwitchVariant, useVariant } from '../variants/VariantContext.jsx';
import { variantForKey } from '../variants/keyboard.js';
import './variant-switcher.css';

// Пять строк описания варианта (R24).
const ROWS = [
  { id: 'metaphor', label: 'Метафора', text: (d) => d.metaphor },
  { id: 'look', label: 'Палитра, шрифты, настроение', text: (d) => [d.palette, d.fonts, d.mood].join(' ') },
  { id: 'fishka', label: 'Фишка и паттерны', text: (d) => [d.fishka, d.patterns].join(' ') },
  { id: 'directions', label: 'Три направления', text: (d) => d.directions },
];

function VariantButtons({ currentId, onSelect, className }) {
  return VARIANTS.map((variant) => (
    <button
      key={variant.id}
      type="button"
      className={className}
      aria-pressed={variant.id === currentId}
      aria-keyshortcuts={String(variant.number)}
      title={`${variant.name} — клавиша ${variant.number}`}
      onClick={() => onSelect(variant.id)}
    >
      <span className="vs-key" aria-hidden="true">
        {variant.number}
      </span>
      <span>{variant.name}</span>
    </button>
  ));
}

function Wireframe({ text }) {
  const blocks = text
    .split('→')
    .map((block) => block.trim())
    .filter(Boolean);
  return (
    <ol className="vs-wire">
      {blocks.map((block, index) => (
        <li key={`${block}-${index}`}>
          {index > 0 ? <ChevronRight className="vs-wire-arrow" size={12} aria-hidden="true" /> : null}
          <span>{block}</span>
        </li>
      ))}
    </ol>
  );
}

export function VariantSwitcher() {
  const { id, meta } = useVariant();
  const switchVariant = useSwitchVariant();
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const dialogRef = useRef(null);
  const announcedId = useRef(id);
  const titleId = useId();

  const select = useCallback(
    (nextId) => {
      setOpen(false);
      if (nextId !== id) switchVariant(nextId);
    },
    [id, switchVariant],
  );

  // Клавиши 1/2/3 — вне полей ввода, без модификаторов.
  useEffect(() => {
    function onKeyDown(event) {
      const nextId = variantForKey(event);
      if (!nextId) return;
      event.preventDefault();
      select(nextId);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [select]);

  // Скринридеру — какой вариант открылся (только при смене, не при первом показе).
  useEffect(() => {
    if (announcedId.current === meta.id) return;
    announcedId.current = meta.id;
    setAnnouncement(`Открыт вариант ${meta.number}: ${meta.name}`);
  }, [meta]);

  // Состояние → нативный <dialog>: фокус внутри, Esc, возврат фокуса — средствами браузера.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <div className="vs">
      <div className="vs-bar" role="group" aria-label="Вариант дизайна">
        <VariantButtons currentId={id} onSelect={select} className="vs-btn vs-variant" />
        <span className="vs-sep" aria-hidden="true" />
        <button
          type="button"
          className="vs-btn vs-about"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`О вариантах. Сейчас: ${meta.number} из ${VARIANTS.length}, «${meta.name}»`}
          onClick={() => setOpen(true)}
        >
          <Info className="vs-icon-desktop" size={16} aria-hidden="true" />
          <Layers className="vs-icon-mobile" size={18} aria-hidden="true" />
          <span className="vs-about-desktop">О вариантах</span>
          <span className="vs-about-mobile" aria-hidden="true">
            {meta.number}/{VARIANTS.length}
          </span>
        </button>
      </div>

      <p className="vs-sr" aria-live="polite">
        {announcement}
      </p>

      <dialog
        ref={dialogRef}
        className="vs-panel"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false); // клик по затемнению
        }}
      >
        <div className="vs-panel-inner">
          <header className="vs-panel-head">
            <div>
              <h2 id={titleId} className="vs-title">
                Три варианта концепта
              </h2>
              <p className="vs-sub">
                Концепт редизайна dvk-style.ru. Клавиши 1, 2, 3 меняют вариант — страница остаётся та же.
              </p>
            </div>
            <button type="button" className="vs-close" aria-label="Закрыть" onClick={() => setOpen(false)}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="vs-sheet-switch" role="group" aria-label="Вариант дизайна">
            <VariantButtons currentId={id} onSelect={select} className="vs-btn vs-variant-sheet" />
          </div>

          <div className="vs-grid">
            {VARIANTS.map((variant) => {
              const current = variant.id === id;
              const headingId = `${titleId}-${variant.id}`;
              return (
                <article key={variant.id} className="vs-card" aria-labelledby={headingId} data-current={current || undefined}>
                  <header className="vs-card-head">
                    <h3 id={headingId} className="vs-card-title">
                      <span className="vs-key" aria-hidden="true">
                        {variant.number}
                      </span>
                      {variant.name}
                    </h3>
                    {current ? (
                      <span className="vs-badge">Открыт</span>
                    ) : (
                      <button
                        type="button"
                        className="vs-open"
                        aria-label={`Открыть вариант «${variant.name}»`}
                        onClick={() => select(variant.id)}
                      >
                        Открыть
                      </button>
                    )}
                  </header>
                  <dl className="vs-rows">
                    {ROWS.map((row) => (
                      <div key={row.id} className="vs-row">
                        <dt>{row.label}</dt>
                        <dd>{row.text(variant.description)}</dd>
                      </div>
                    ))}
                    <div className="vs-row">
                      <dt>Главная</dt>
                      <dd>
                        <Wireframe text={variant.description.wireframe} />
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        </div>
      </dialog>
    </div>
  );
}
