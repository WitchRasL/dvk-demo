// Штамп в углу главной: после первого листа показывает текущий раздел — «Лист N из M» — и открывает
// содержание комплекта (переход к любому листу).
import { useEffect, useId, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '../../../lib/utils.js';
import { SHEETS, sheetAnchor } from './sheets.js';

function useCurrentSheet() {
  const [current, setCurrent] = useState(1);
  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return undefined;
    const nodes = SHEETS.map((sheet) => document.getElementById(sheetAnchor(sheet.id))).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(Number(entry.target.getAttribute('data-sheet')) || 1);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return current;
}

export function CornerStamp() {
  const current = useCurrentSheet();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef(null);
  const sheet = SHEETS[current - 1] ?? SHEETS[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (id) => {
    setOpen(false);
    const node = document.getElementById(sheetAnchor(id));
    if (!node) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    node.querySelector('h2')?.focus?.({ preventScroll: true });
  };

  return (
    <div ref={rootRef} className={cn('bp-corner', current > 1 && 'is-shown')}>
      <ol id={listId} className="bp-corner__list" hidden={!open} aria-label="Содержание комплекта">
        {SHEETS.map((item, index) => (
          <li key={item.id}>
            <button type="button" aria-current={index + 1 === current ? 'true' : undefined} onClick={() => go(item.id)}>
              <span className="bp-mono">{index + 1}</span>
              {item.title}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="bp-corner__stamp" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((value) => !value)}>
        <span className="bp-corner__cell bp-corner__name">{sheet.title}</span>
        <span className="bp-corner__cell bp-corner__num">
          <span className="bp-corner__label">Лист</span>
          <span className="bp-mono">
            {current}/{SHEETS.length}
          </span>
        </span>
        <ChevronUp className="bp-corner__chev size-4" aria-hidden="true" />
        <span className="sr-only">: содержание комплекта</span>
      </button>
    </div>
  );
}
