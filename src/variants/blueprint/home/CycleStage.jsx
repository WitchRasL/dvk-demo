// Рисунки к листу 3: одно изделие проходит пять стадий — обмер, эскиз, деталировка, упаковка, монтаж.
// Условные схемы без размеров и фактов: цифр здесь нет, только линии по ЕСКД (основная, тонкая, штриховая, осевая).
const VB = '0 0 220 150';

const tick = (x, y) => <line key={`t${x}:${y}`} x1={x - 3} y1={y + 3} x2={x + 3} y2={y - 3} className="bp-d-main" />;

function Measure() {
  return (
    <g>
      <rect x="34" y="30" width="152" height="92" className="bp-d-main" />
      <rect x="40" y="36" width="140" height="80" className="bp-d-thin" />
      {/* дверной проём с полотном */}
      <line x1="62" y1="122" x2="62" y2="98" className="bp-d-main" />
      <path d="M62 98 A24 24 0 0 1 86 122" className="bp-d-thin" />
      {/* оси обмера */}
      <line x1="110" y1="24" x2="110" y2="128" className="bp-d-axis" />
      <line x1="28" y1="76" x2="192" y2="76" className="bp-d-axis" />
      {/* размерные линии */}
      <line x1="34" y1="30" x2="34" y2="10" className="bp-d-thin" />
      <line x1="186" y1="30" x2="186" y2="10" className="bp-d-thin" />
      <line x1="28" y1="15" x2="192" y2="15" className="bp-d-thin" />
      {tick(34, 15)}
      {tick(186, 15)}
      <line x1="186" y1="30" x2="206" y2="30" className="bp-d-thin" />
      <line x1="186" y1="122" x2="206" y2="122" className="bp-d-thin" />
      <line x1="201" y1="24" x2="201" y2="128" className="bp-d-thin" />
      {tick(201, 30)}
      {tick(201, 122)}
    </g>
  );
}

function Sketch() {
  return (
    <g>
      <line x1="110" y1="8" x2="110" y2="140" className="bp-d-axis" />
      {/* линии построения выходят за контур */}
      <line x1="60" y1="24" x2="160" y2="24" className="bp-d-thin" />
      <line x1="60" y1="128" x2="160" y2="128" className="bp-d-thin" />
      <line x1="74" y1="14" x2="74" y2="138" className="bp-d-thin" />
      <line x1="146" y1="14" x2="146" y2="138" className="bp-d-thin" />
      <line x1="66" y1="32" x2="154" y2="32" className="bp-d-thin" />
      <line x1="66" y1="90" x2="154" y2="90" className="bp-d-thin" />
      <line x1="74" y1="52" x2="146" y2="52" className="bp-d-hidden" />
      <line x1="74" y1="71" x2="146" y2="71" className="bp-d-hidden" />
      <circle cx="146" cy="90" r="9" className="bp-d-thin" />
      <line x1="153" y1="84" x2="176" y2="66" className="bp-d-thin" />
      <line x1="176" y1="66" x2="194" y2="66" className="bp-d-thin" />
    </g>
  );
}

function Parts() {
  const balloon = (cx, cy, x2, y2) => (
    <g key={`b${cx}:${cy}`}>
      <line x1={x2} y1={y2} x2={cx} y2={cy + 7} className="bp-d-thin" />
      <circle cx={cx} cy={cy} r="7" className="bp-d-thin" />
    </g>
  );
  return (
    <g>
      {/* стойки */}
      <rect x="34" y="26" width="9" height="100" className="bp-d-main" />
      <rect x="52" y="26" width="9" height="100" className="bp-d-main" />
      {/* полки */}
      <rect x="78" y="34" width="72" height="6" className="bp-d-main" />
      <rect x="78" y="52" width="72" height="6" className="bp-d-main" />
      <rect x="78" y="70" width="72" height="6" className="bp-d-main" />
      {/* тумба */}
      <rect x="78" y="92" width="72" height="34" className="bp-d-main" />
      <line x1="114" y1="92" x2="114" y2="126" className="bp-d-thin" />
      {/* крепёж */}
      <circle cx="170" cy="100" r="3" className="bp-d-thin" />
      <circle cx="182" cy="100" r="3" className="bp-d-thin" />
      <circle cx="170" cy="112" r="3" className="bp-d-thin" />
      <circle cx="182" cy="112" r="3" className="bp-d-thin" />
      {balloon(47, 12, 47, 26)}
      {balloon(176, 30, 150, 37)}
      {balloon(176, 62, 150, 96)}
    </g>
  );
}

function Crate() {
  return (
    <g>
      <rect x="62" y="20" width="92" height="100" className="bp-d-main" />
      <line x1="62" y1="20" x2="154" y2="120" className="bp-d-thin" />
      <line x1="154" y1="20" x2="62" y2="120" className="bp-d-thin" />
      {/* изделие внутри — невидимый контур */}
      <rect x="76" y="30" width="64" height="86" className="bp-d-hidden" />
      {/* поддон */}
      <rect x="54" y="120" width="108" height="5" className="bp-d-main" />
      <rect x="58" y="125" width="12" height="7" className="bp-d-main" />
      <rect x="102" y="125" width="12" height="7" className="bp-d-main" />
      <rect x="146" y="125" width="12" height="7" className="bp-d-main" />
      {/* направление отгрузки */}
      <line x1="170" y1="70" x2="200" y2="70" className="bp-d-main" />
      <path d="M210 70 L198 65 L198 75 Z" className="bp-d-arrow" />
    </g>
  );
}

function Installed() {
  const hatch = Array.from({ length: 16 }, (_, i) => 26 + i * 11);
  return (
    <g>
      <rect x="74" y="24" width="72" height="104" className="bp-d-main" />
      <line x1="74" y1="32" x2="146" y2="32" className="bp-d-main" />
      <line x1="74" y1="90" x2="146" y2="90" className="bp-d-main" />
      <rect x="80" y="37" width="60" height="48" className="bp-d-thin" />
      <line x1="80" y1="54" x2="140" y2="54" className="bp-d-thin" />
      <line x1="80" y1="70" x2="140" y2="70" className="bp-d-thin" />
      <line x1="110" y1="90" x2="110" y2="128" className="bp-d-thin" />
      {/* стекло */}
      <line x1="86" y1="49" x2="94" y2="41" className="bp-d-thin" />
      <line x1="90" y1="49" x2="98" y2="41" className="bp-d-thin" />
      <line x1="124" y1="82" x2="132" y2="74" className="bp-d-thin" />
      <line x1="128" y1="82" x2="136" y2="74" className="bp-d-thin" />
      {/* пол и грунт */}
      <line x1="20" y1="128" x2="200" y2="128" className="bp-d-main" />
      {hatch.map((x) => (
        <line key={x} x1={x} y1="136" x2={x + 8} y2="128" className="bp-d-thin" />
      ))}
      {/* отметка уровня чистого пола */}
      <line x1="146" y1="128" x2="196" y2="128" className="bp-d-thin" />
      <path d="M170 128 L164 118 L176 118 Z" className="bp-d-thin" />
      <line x1="176" y1="118" x2="198" y2="118" className="bp-d-thin" />
    </g>
  );
}

const STAGES = {
  measure: { figure: Measure, caption: 'План обмера' },
  design: { figure: Sketch, caption: 'Эскиз' },
  production: { figure: Parts, caption: 'Деталировка' },
  delivery: { figure: Crate, caption: 'Упаковка' },
  install: { figure: Installed, caption: 'Монтаж на объекте' },
};

/** Рисунок стадии: декоративная схема под текстом этапа, для скринридера скрыта. */
export function CycleStage({ id, index }) {
  const stage = STAGES[id];
  if (!stage) return null;
  const Figure = stage.figure;
  return (
    <span className="bp-cycle__fig" aria-hidden="true">
      <svg viewBox={VB} className="bp-drawing bp-cycle__svg" focusable="false">
        <Figure />
      </svg>
      <span className="bp-cycle__cap">
        <span className="bp-mono">Рис. {index + 1}</span>
        {stage.caption}
      </span>
    </span>
  );
}
