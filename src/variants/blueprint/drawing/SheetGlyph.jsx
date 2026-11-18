// Малые чертежи «типа листа» направления: ритейл — фасад с узлом, благоустройство — генплан, металл — деталь
// с нагрузкой и штриховкой сечения; «общие данные» — лист с рамкой и штампом; «изъят» — перечёркнутый лист (404).
import { useId } from 'react';
import { cn } from '../../../lib/utils.js';

function Facade() {
  return (
    <g>
      <rect x="34" y="8" width="40" height="64" className="bp-d-main" />
      <line x1="34" y1="12" x2="74" y2="12" className="bp-d-thin" />
      <line x1="34" y1="46" x2="74" y2="46" className="bp-d-main" />
      <rect x="38" y="15" width="32" height="28" className="bp-d-thin" />
      <line x1="42" y1="24" x2="48" y2="18" className="bp-d-thin" />
      <line x1="45" y1="24" x2="51" y2="18" className="bp-d-thin" />
      <line x1="38" y1="30" x2="70" y2="30" className="bp-d-thin" />
      <line x1="54" y1="46" x2="54" y2="68" className="bp-d-thin" />
      <line x1="40" y1="14.5" x2="68" y2="14.5" className="bp-d-led-line" />
      <circle cx="74" cy="68" r="6" className="bp-d-thin" />
      <line x1="78" y1="64" x2="88" y2="54" className="bp-d-thin" />
      <line x1="88" y1="54" x2="100" y2="54" className="bp-d-thin" />
      <text x="90" y="51" className="bp-d-label">А</text>
      <line x1="18" y1="72" x2="102" y2="72" className="bp-d-thin" />
    </g>
  );
}

function Plan() {
  const crosses = [];
  for (let x = 14; x <= 106; x += 30) for (let y = 12; y <= 72; y += 30) crosses.push([x, y]);
  return (
    <g>
      {crosses.map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x - 3} ${y} H${x + 3} M${x} ${y - 3} V${y + 3}`} className="bp-d-thin" />
      ))}
      <rect x="22" y="20" width="62" height="44" className="bp-d-axis" />
      <rect x="32" y="30" width="18" height="22" className="bp-d-main" />
      <line x1="32" y1="30" x2="50" y2="52" className="bp-d-thin" />
      <line x1="50" y1="30" x2="32" y2="52" className="bp-d-thin" />
      <path d="M50 37 H70 A4 4 0 0 1 70 45 H50" className="bp-d-main" />
      <circle cx="66" cy="27" r="4" className="bp-d-main" />
      <g transform="translate(104 14)">
        <path d="M0 -8 L4 6 L0 3 L-4 6 Z" className="bp-d-north" />
      </g>
    </g>
  );
}

function Detail({ hatchId }) {
  return (
    <g>
      <defs>
        <pattern id={hatchId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" className="bp-d-thin" />
        </pattern>
      </defs>
      <rect x="20" y="40" width="80" height="8" className="bp-d-main" fill={`url(#${hatchId})`} />
      <rect x="24" y="48" width="5" height="24" className="bp-d-main" />
      <rect x="91" y="48" width="5" height="24" className="bp-d-main" />
      <rect x="30" y="48" width="24" height="16" className="bp-d-main" />
      <line x1="30" y1="56" x2="54" y2="56" className="bp-d-thin" />
      <line x1="72" y1="10" x2="72" y2="38" className="bp-d-main" />
      <path d="M68 31 L72 39 L76 31" className="bp-d-main" />
      <line x1="10" y1="72" x2="110" y2="72" className="bp-d-thin" />
    </g>
  );
}

function General() {
  return (
    <g>
      <rect x="10" y="6" width="100" height="68" className="bp-d-thin" />
      <rect x="16" y="9" width="91" height="62" className="bp-d-main" />
      <rect x="62" y="58" width="45" height="13" className="bp-d-main" />
      <line x1="76" y1="58" x2="76" y2="71" className="bp-d-thin" />
      <line x1="62" y1="64" x2="107" y2="64" className="bp-d-thin" />
      <line x1="24" y1="20" x2="54" y2="20" className="bp-d-thin" />
      <line x1="24" y1="26" x2="46" y2="26" className="bp-d-thin" />
    </g>
  );
}

function Void() {
  return (
    <g>
      <rect x="16" y="9" width="91" height="62" className="bp-d-main" />
      <line x1="16" y1="9" x2="107" y2="71" className="bp-d-thin" />
      <line x1="107" y1="9" x2="16" y2="71" className="bp-d-thin" />
      <rect x="62" y="58" width="45" height="13" className="bp-d-main" />
    </g>
  );
}

/** @param {{ view: 'facade'|'plan'|'detail'|'general'|'void', className?: string }} props */
export function SheetGlyph({ view = 'general', className }) {
  const hatchId = `bp-glyph-hatch-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg viewBox="0 0 120 80" className={cn('bp-glyph bp-drawing', className)} aria-hidden="true" focusable="false">
      {view === 'facade' ? <Facade /> : null}
      {view === 'plan' ? <Plan /> : null}
      {view === 'detail' ? <Detail hatchId={hatchId} /> : null}
      {view === 'general' ? <General /> : null}
      {view === 'void' ? <Void /> : null}
    </svg>
  );
}
