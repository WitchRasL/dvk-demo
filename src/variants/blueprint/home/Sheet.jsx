// Лист главной: верхняя кромка основной линией с номером листа справа; заголовок и содержимое — в поле листа.
import { cn } from '../../../lib/utils.js';
import { SHEETS, sheetAnchor, sheetNumber } from './sheets.js';

/** Основная надпись (форма 1, сокращённо): организация, наименование листа, «Лист N», «Листов M». */
export function Stamp({ sheetId, organization, className }) {
  const n = sheetNumber(sheetId);
  const sheet = SHEETS[n - 1];
  return (
    <div className={cn('bp-stamp', className)} role="group" aria-label={`Основная надпись: лист ${n} из ${SHEETS.length}, ${sheet.title}`}>
      <p className="bp-stamp__cell bp-stamp__org">
        <span className="bp-stamp__label">Организация</span>
        <span>{organization}</span>
      </p>
      <p className="bp-stamp__cell bp-stamp__name">
        <span className="bp-stamp__label">Наименование</span>
        <span>{sheet.title}</span>
      </p>
      <p className="bp-stamp__cell bp-stamp__num">
        <span className="bp-stamp__label">Лист</span>
        <span className="bp-mono">{n}</span>
      </p>
      <p className="bp-stamp__cell bp-stamp__num">
        <span className="bp-stamp__label">Листов</span>
        <span className="bp-mono">{SHEETS.length}</span>
      </p>
    </div>
  );
}

/** @param {{ id: string, labelledBy: string, className?: string, children: import('react').ReactNode }} props */
export function Sheet({ id, labelledBy, className, children }) {
  const n = sheetNumber(id);
  return (
    <section id={sheetAnchor(id)} data-sheet={n} className={cn('bp-sheet', `bp-sheet--${id}`, className)} aria-labelledby={labelledBy}>
      <div className="bp-sheet__edge" aria-hidden="true">
        <span className="bp-sheet__no bp-mono">Лист {n}</span>
      </div>
      {children}
    </section>
  );
}
