// «Режим чертёж»: SVG-чертёж изделия по шаблону его типа. Слои: каркас (основная линия), стекло (штриховка
// светопрозрачного материала), LED (цвет-маркер), размеры (выносные и размерные линии, значения — из данных
// или [уточнить]). Пропорции — по габаритам из данных; без них — условные для типа. Условный шаблон подписан
// «Габаритная схема»; в углу — строка-легенда слоёв.
import { useId } from 'react';
import { cn } from '../../../lib/utils.js';
import { LAYER_LABELS, SCHEMATIC_LABEL, UNKNOWN } from '../lib/drawing.js';

const VB = { w: 400, h: 300 };
const AREA = { x: 64, y: 30, w: 300, h: 206 };

/** Условные пропорции (ширина : высота или ширина : глубина в плане), если размеров нет. */
const DEFAULT_RATIO = { showcase: 0.45, counter: 2, cabinet: 0.5, rack: 0.62, workbench: 1.5, bench: 3, 'bench-arc': 2.5, playground: 1.45, carousel: 1, island: 1.7, other: 1 };

const LOAD_ARROW = 34;

const VIEW_LABELS = { facade: 'Фасад', plan: 'План', detail: 'Деталировка' };

function fitBox(ratio) {
  const r = Math.min(Math.max(ratio, 0.12), 6);
  let w = AREA.w;
  let h = w / r;
  if (h > AREA.h) {
    h = AREA.h;
    w = h * r;
  }
  return { x: AREA.x + (AREA.w - w) / 2, y: AREA.y + (AREA.h - h) / 2, w, h };
}

// key из координат: линии часто строятся map'ом
const L = (x1, y1, x2, y2, className) => <line key={`${x1}:${y1}:${x2}:${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} className={className} />;

/** Штриховка стекла по ГОСТ 2.306: группы коротких параллельных штрихов у углов панели. */
function GlassHatch({ x, y, w, h }) {
  const s = Math.max(6, Math.min(16, Math.min(w, h) * 0.22));
  const group = (cx, cy) =>
    [0, 4, 8].map((o) => <line key={`${cx}-${cy}-${o}`} x1={cx + o} y1={cy + s} x2={cx + o + s} y2={cy} className="bp-d-thin" />);
  return (
    <g>
      {group(x + w * 0.12, y + h * 0.1)}
      {group(x + w * 0.88 - s - 8, y + h * 0.9 - s)}
    </g>
  );
}

/** Полоса LED: штрих-пунктир маркером и короткие «лучи» вниз. */
function LedStrip({ x1, x2, y, rays = 5 }) {
  const step = (x2 - x1) / (rays + 1);
  return (
    <g className="bp-d-led">
      <line x1={x1} y1={y} x2={x2} y2={y} className="bp-d-led-line" />
      {Array.from({ length: rays }, (_, i) => {
        const cx = x1 + step * (i + 1);
        return <line key={i} x1={cx} y1={y + 3} x2={cx} y2={y + 10} className="bp-d-led-ray" />;
      })}
    </g>
  );
}

/** Линия пола со штриховкой грунта — для фасадов и деталировки (в плане пола нет). */
function Floor({ y }) {
  const x1 = AREA.x - 22;
  const x2 = AREA.x + AREA.w + 6;
  const strokes = [];
  for (let x = x1; x < x2 - 6; x += 8) strokes.push(x);
  return (
    <g className="bp-d-floor">
      <line x1={x1} y1={y} x2={x2} y2={y} className="bp-d-thin" />
      {strokes.map((x) => (
        <line key={x} x1={x} y1={y + 6} x2={x + 6} y2={y} className="bp-d-thin" />
      ))}
    </g>
  );
}

// ——— шаблоны: { frame, glass, led } для коробки b ———

function showcase(b) {
  const ix = b.x + b.w * 0.07;
  const iw = b.w * 0.86;
  const top = b.y + b.h * 0.06;
  const mid = b.y + b.h * 0.76;
  const base = b.y + b.h * 0.95;
  return {
    frame: (
      <g>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} className="bp-d-main" />
        {L(b.x, top, b.x + b.w, top, 'bp-d-main')}
        {L(b.x, mid, b.x + b.w, mid, 'bp-d-main')}
        {L(b.x, base, b.x + b.w, base, 'bp-d-thin')}
        <rect x={ix} y={top + 5} width={iw} height={mid - top - 10} className="bp-d-thin" />
        {[0.27, 0.51, 0.75].map((k) => L(ix, top + (mid - top) * k, ix + iw, top + (mid - top) * k, 'bp-d-thin'))}
        {L(b.x + b.w / 2, mid, b.x + b.w / 2, base, 'bp-d-thin')}
        {L(b.x + b.w / 2 - 5, (mid + base) / 2 - 6, b.x + b.w / 2 - 5, (mid + base) / 2 + 6, 'bp-d-main')}
        {L(b.x + b.w / 2 + 5, (mid + base) / 2 - 6, b.x + b.w / 2 + 5, (mid + base) / 2 + 6, 'bp-d-main')}
      </g>
    ),
    glass: <GlassHatch x={ix} y={top + 5} w={iw} h={mid - top - 10} />,
    led: <LedStrip x1={ix + 4} x2={ix + iw - 4} y={top + 9} />,
    node: { x: b.x + b.w, y: base },
  };
}

function counter(b) {
  const band = b.y + b.h * 0.4;
  const base = b.y + b.h * 0.9;
  const ix = b.x + b.w * 0.04;
  const iw = b.w * 0.92;
  return {
    frame: (
      <g>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} className="bp-d-main" />
        {L(b.x, band, b.x + b.w, band, 'bp-d-main')}
        {L(b.x, base, b.x + b.w, base, 'bp-d-thin')}
        <rect x={ix} y={b.y + 5} width={iw} height={band - b.y - 10} className="bp-d-thin" />
        {L(b.x + b.w / 3, band, b.x + b.w / 3, base, 'bp-d-thin')}
        {L(b.x + (b.w * 2) / 3, band, b.x + (b.w * 2) / 3, base, 'bp-d-thin')}
      </g>
    ),
    glass: <GlassHatch x={ix} y={b.y + 5} w={iw} h={band - b.y - 10} />,
    led: <LedStrip x1={ix + 4} x2={ix + iw - 4} y={b.y + 9} rays={7} />,
    node: { x: b.x + b.w, y: base },
  };
}

function cabinet(b, { glass }) {
  const double = b.w / b.h > 0.42;
  const doors = double ? [b.x, b.x + b.w / 2] : [b.x];
  const dw = double ? b.w / 2 : b.w;
  const top = b.y + b.h * 0.04;
  const base = b.y + b.h * 0.95;
  return {
    frame: (
      <g>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} className="bp-d-main" />
        {L(b.x, top, b.x + b.w, top, 'bp-d-thin')}
        {L(b.x, base, b.x + b.w, base, 'bp-d-thin')}
        {double ? L(b.x + b.w / 2, top, b.x + b.w / 2, base, 'bp-d-main') : null}
        {doors.map((dx, i) => (
          <g key={dx}>
            {[0, 1, 2].map((k) => L(dx + dw * 0.25, top + 10 + k * 5, dx + dw * 0.75, top + 10 + k * 5, 'bp-d-thin'))}
            {L(i === 0 && double ? dx + dw - 7 : dx + 7, b.y + b.h * 0.47, i === 0 && double ? dx + dw - 7 : dx + 7, b.y + b.h * 0.55, 'bp-d-main')}
          </g>
        ))}
        {[0.32, 0.52, 0.72].map((k) => L(b.x + 3, b.y + b.h * k, b.x + b.w - 3, b.y + b.h * k, 'bp-d-hidden'))}
      </g>
    ),
    glass: glass ? (
      <g>
        {doors.map((dx) => (
          <g key={dx}>
            <rect x={dx + dw * 0.14} y={top + 26} width={dw * 0.72} height={b.h * 0.3} className="bp-d-thin" />
            <GlassHatch x={dx + dw * 0.14} y={top + 26} w={dw * 0.72} h={b.h * 0.3} />
          </g>
        ))}
      </g>
    ) : null,
    led: <LedStrip x1={b.x + 6} x2={b.x + b.w - 6} y={top + 4} rays={3} />,
    node: { x: b.x + b.w, y: base },
  };
}

function rack(b, { parts }) {
  const post = Math.max(4, b.w * 0.04);
  const levels = parts?.levels ?? (b.h / b.w > 1.6 ? 5 : 4);
  const shelves = Array.from({ length: levels }, (_, i) => b.y + b.h * 0.04 + ((b.h * 0.86) / (levels - 1)) * i);
  return {
    frame: (
      <g>
        <rect x={b.x} y={b.y} width={post} height={b.h} className="bp-d-main" />
        <rect x={b.x + b.w - post} y={b.y} width={post} height={b.h} className="bp-d-main" />
        {shelves.map((sy) => (
          <rect key={sy} x={b.x + post} y={sy} width={b.w - post * 2} height={Math.max(3, b.h * 0.018)} className="bp-d-main" />
        ))}
        {Array.from({ length: 14 }, (_, i) => b.y + 8 + ((b.h - 16) / 13) * i).map((ty) => (
          <g key={ty}>
            {L(b.x + post / 2, ty, b.x + post / 2, ty + 2, 'bp-d-thin')}
            {L(b.x + b.w - post / 2, ty, b.x + b.w - post / 2, ty + 2, 'bp-d-thin')}
          </g>
        ))}
        {L(b.x - 8, b.y + b.h, b.x + b.w + 8, b.y + b.h, 'bp-d-thin')}
      </g>
    ),
    glass: (
      <g>
        {shelves.slice(1, -1).map((sy) => (
          <GlassHatch key={sy} x={b.x + post} y={sy - 12} w={b.w - post * 2} h={12} />
        ))}
      </g>
    ),
    led: <LedStrip x1={b.x + post + 4} x2={b.x + b.w - post - 4} y={shelves[0] + 8} />,
    loadAt: { x: b.x + b.w / 2, y: shelves[1] ?? b.y },
    node: { x: b.x + b.w, y: b.y + b.h },
  };
}

function workbench(b, { view, ids, parts }) {
  const screen = Boolean(parts?.screen);
  const pedestal = Boolean(parts?.pedestal);
  const tableY = screen ? b.y + b.h * 0.58 : b.y;
  const th = Math.max(5, (b.y + b.h - tableY) * 0.08);
  const pedW = b.w * 0.34;
  const legW = Math.max(4, b.w * 0.03);
  return {
    frame: (
      <g>
        <rect x={b.x} y={tableY} width={b.w} height={th} className="bp-d-main" fill={view === 'detail' ? `url(#${ids.hatch})` : 'none'} />
        {pedestal ? (
          <g>
            <rect x={b.x + 4} y={tableY + th} width={pedW} height={(b.y + b.h - tableY - th) * 0.72} className="bp-d-main" />
            {[0.25, 0.5, 0.75].map((k) => {
              const py = tableY + th + (b.y + b.h - tableY - th) * 0.72 * k;
              return (
                <g key={k}>
                  {L(b.x + 4, py, b.x + 4 + pedW, py, 'bp-d-thin')}
                  {L(b.x + 4 + pedW / 2 - 8, py - 7, b.x + 4 + pedW / 2 + 8, py - 7, 'bp-d-main')}
                </g>
              );
            })}
          </g>
        ) : null}
        <rect x={b.x + 4} y={tableY + th} width={legW} height={b.y + b.h - tableY - th} className="bp-d-main" />
        <rect x={b.x + b.w - 4 - legW} y={tableY + th} width={legW} height={b.y + b.h - tableY - th} className="bp-d-main" />
        {/* без тумбы — стяжки опор: царга под столешницей и проножка у пола */}
        {pedestal ? null : L(b.x + 4 + legW, tableY + th + (b.y + b.h - tableY - th) * 0.16, b.x + b.w - 4 - legW, tableY + th + (b.y + b.h - tableY - th) * 0.16, 'bp-d-thin')}
        {L(b.x + 4 + (pedestal ? pedW : legW), b.y + b.h - (b.y + b.h - tableY) * 0.12, b.x + b.w - 4 - legW, b.y + b.h - (b.y + b.h - tableY) * 0.12, 'bp-d-thin')}
        {screen ? (
          <g>
            <rect x={b.x + b.w * 0.04} y={b.y} width={b.w * 0.92} height={tableY - b.y - 6} className="bp-d-main" />
            {Array.from({ length: 6 }, (_, r) =>
              Array.from({ length: 16 }, (_, c) => (
                <circle
                  key={`${r}-${c}`}
                  cx={b.x + b.w * 0.08 + ((b.w * 0.84) / 15) * c}
                  cy={b.y + 8 + ((tableY - b.y - 22) / 5) * r}
                  r={0.9}
                  className="bp-d-dot"
                />
              )),
            )}
          </g>
        ) : null}
        {L(b.x - 8, b.y + b.h, b.x + b.w + 8, b.y + b.h, 'bp-d-thin')}
      </g>
    ),
    glass: null,
    led: <LedStrip x1={b.x + b.w * 0.08} x2={b.x + b.w * 0.92} y={tableY - 12} />,
    loadAt: { x: b.x + b.w * 0.66, y: tableY },
    node: { x: b.x + b.w, y: b.y + b.h },
  };
}

function bench(b, { view, materials, ids }) {
  const plan = view === 'plan';
  const concrete = materials.includes('concrete');
  if (plan) {
    const slats = 5;
    return {
      frame: (
        <g>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} className="bp-d-main" />
          {Array.from({ length: slats - 1 }, (_, i) => L(b.x, b.y + (b.h / slats) * (i + 1), b.x + b.w, b.y + (b.h / slats) * (i + 1), 'bp-d-thin'))}
          <rect x={b.x + b.w * 0.08} y={b.y - 4} width={b.w * 0.1} height={b.h + 8} className="bp-d-hidden" fill={concrete ? `url(#${ids.concrete})` : 'none'} />
          <rect x={b.x + b.w * 0.82} y={b.y - 4} width={b.w * 0.1} height={b.h + 8} className="bp-d-hidden" fill={concrete ? `url(#${ids.concrete})` : 'none'} />
        </g>
      ),
      glass: null,
      led: <LedStrip x1={b.x + 8} x2={b.x + b.w - 8} y={b.y + b.h + 6} />,
      node: { x: b.x + b.w, y: b.y + b.h },
    };
  }
  const seat = b.y + b.h * 0.45;
  return {
    frame: (
      <g>
        <rect x={b.x} y={seat} width={b.w} height={b.h * 0.1} className="bp-d-main" />
        <rect x={b.x} y={b.y} width={b.w} height={b.h * 0.08} className="bp-d-main" />
        <rect x={b.x + b.w * 0.08} y={seat + b.h * 0.1} width={b.w * 0.1} height={b.h * 0.45} className="bp-d-main" fill={concrete ? `url(#${ids.concrete})` : 'none'} />
        <rect x={b.x + b.w * 0.82} y={seat + b.h * 0.1} width={b.w * 0.1} height={b.h * 0.45} className="bp-d-main" fill={concrete ? `url(#${ids.concrete})` : 'none'} />
        {L(b.x - 8, b.y + b.h, b.x + b.w + 8, b.y + b.h, 'bp-d-thin')}
      </g>
    ),
    glass: null,
    led: <LedStrip x1={b.x + 8} x2={b.x + b.w - 8} y={seat + b.h * 0.14} />,
    node: { x: b.x + b.w, y: b.y + b.h },
  };
}

/** Дуговая скамья в плане: кольцевой сектор, брусья сиденья — по радиусам, под ними бетонное основание. */
function benchArc(b, { materials, ids }) {
  const concrete = materials.includes('concrete');
  const half = (35 * Math.PI) / 180;
  const sin = Math.sin(half);
  const cos = Math.cos(half);
  const R = b.w / (2 * sin);
  const r = Math.max(R * 0.3, (R - b.h) / cos); // внутренний радиус: сектор вписан в габарит по глубине
  const cx = b.x + b.w / 2;
  const cy = b.y + R;
  const at = (radius, angle) => [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
  const sector = (outer, inner, a) => {
    const [x1, y1] = at(outer, -a);
    const [x2, y2] = at(outer, a);
    const [x3, y3] = at(inner, a);
    const [x4, y4] = at(inner, -a);
    return `M${x1} ${y1} A${outer} ${outer} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${inner} ${inner} 0 0 0 ${x4} ${y4} Z`;
  };
  const slats = 12;
  const inset = (R - r) * 0.16;
  return {
    frame: (
      <g>
        <path d={sector(R - inset, r + inset, half * 0.94)} className="bp-d-hidden" fill={concrete ? `url(#${ids.concrete})` : 'none'} />
        <path d={sector(R, r, half)} className="bp-d-main" />
        {Array.from({ length: slats - 1 }, (_, i) => {
          const angle = -half + ((2 * half) / slats) * (i + 1);
          const [x1, y1] = at(R, angle);
          const [x2, y2] = at(r, angle);
          return L(x1, y1, x2, y2, 'bp-d-thin');
        })}
        {L(cx, b.y - 8, cx, b.y + b.h + 8, 'bp-d-axis')}
      </g>
    ),
    glass: null,
    led: null,
    node: { x: b.x + b.w, y: b.y + b.h },
  };
}

/** Карусель в плане: окружность платформы по диаметру из данных, поручень, сиденья, ступица и оси. */
function carousel(b) {
  const R = Math.min(b.w, b.h) / 2;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const rail = R * 0.74;
  const seats = 6;
  const polar = (radius, angle) => [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  return {
    frame: (
      <g>
        <circle cx={cx} cy={cy} r={R} className="bp-d-main" />
        <circle cx={cx} cy={cy} r={R * 0.9} className="bp-d-thin" />
        <circle cx={cx} cy={cy} r={rail} className="bp-d-main" />
        <circle cx={cx} cy={cy} r={R * 0.13} className="bp-d-main" />
        {Array.from({ length: seats }, (_, i) => {
          const angle = (Math.PI * 2 * i) / seats + Math.PI / 6;
          const [x1, y1] = polar(R * 0.13, angle);
          const [x2, y2] = polar(rail, angle);
          const [sx, sy] = polar(rail, angle + Math.PI / seats);
          return (
            <g key={i}>
              {L(x1, y1, x2, y2, 'bp-d-thin')}
              <rect
                x={sx - R * 0.1}
                y={sy - R * 0.06}
                width={R * 0.2}
                height={R * 0.12}
                transform={`rotate(${((angle + Math.PI / seats) * 180) / Math.PI + 90} ${sx} ${sy})`}
                className="bp-d-main bp-d-solid"
              />
            </g>
          );
        })}
        {L(cx - R - 10, cy, cx + R + 10, cy, 'bp-d-axis')}
        {L(cx, cy - R - 10, cx, cy + R + 10, 'bp-d-axis')}
      </g>
    ),
    glass: null,
    led: null,
    round: true,
    node: { x: b.x + b.w, y: b.y + b.h },
  };
}

function playground(b) {
  const tw = b.w * 0.26;
  const tdp = b.h * 0.42;
  const tx = b.x + b.w * 0.16;
  const ty = b.y + b.h * 0.3;
  const slideY = ty + tdp * 0.32;
  const slideH = tdp * 0.36;
  const slideEnd = b.x + b.w * 0.86;
  return {
    frame: (
      <g>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} className="bp-d-axis" />
        <rect x={tx} y={ty} width={tw} height={tdp} className="bp-d-main" />
        {L(tx, ty, tx + tw, ty + tdp, 'bp-d-thin')}
        {L(tx + tw, ty, tx, ty + tdp, 'bp-d-thin')}
        <path d={`M${tx + tw} ${slideY} H${slideEnd - slideH / 2} A${slideH / 2} ${slideH / 2} 0 0 1 ${slideEnd - slideH / 2} ${slideY + slideH} H${tx + tw}`} className="bp-d-main" />
        {L(tx + tw, slideY + slideH / 2, slideEnd - slideH / 2, slideY + slideH / 2, 'bp-d-thin')}
        <rect x={tx - tw * 0.4} y={ty + tdp * 0.3} width={tw * 0.4} height={tdp * 0.4} className="bp-d-main" />
        {[0.2, 0.4, 0.6, 0.8].map((k) => L(tx - tw * 0.4 + tw * 0.4 * k, ty + tdp * 0.3, tx - tw * 0.4 + tw * 0.4 * k, ty + tdp * 0.7, 'bp-d-thin'))}
        <circle cx={b.x + b.w * 0.62} cy={b.y + b.h * 0.2} r={Math.min(b.w, b.h) * 0.08} className="bp-d-main" />
        <rect x={b.x + b.w * 0.5} y={b.y + b.h * 0.76} width={b.w * 0.3} height={b.h * 0.12} className="bp-d-main" />
      </g>
    ),
    glass: null,
    led: <LedStrip x1={tx + 4} x2={tx + tw - 4} y={ty - 6} rays={2} />,
    node: { x: b.x + b.w, y: b.y + b.h },
  };
}

function island(b) {
  const base = b.y + b.h * 0.35;
  const sideW = b.w * 0.36;
  const top = base + (b.y + b.h - base) * 0.42;
  return {
    frame: (
      <g>
        <rect x={b.x} y={base} width={b.w} height={b.y + b.h - base} className="bp-d-main" />
        {L(b.x, top, b.x + b.w, top, 'bp-d-main')}
        <rect x={b.x + b.w / 2 - b.w * 0.08} y={b.y} width={b.w * 0.16} height={base - b.y} className="bp-d-main" />
        {L(b.x + sideW, base, b.x + sideW, b.y + b.h, 'bp-d-thin')}
        {L(b.x + b.w - sideW, base, b.x + b.w - sideW, b.y + b.h, 'bp-d-thin')}
        <rect x={b.x + 5} y={base + 5} width={sideW - 10} height={top - base - 10} className="bp-d-thin" />
        <rect x={b.x + b.w - sideW + 5} y={base + 5} width={sideW - 10} height={top - base - 10} className="bp-d-thin" />
      </g>
    ),
    glass: (
      <g>
        <GlassHatch x={b.x + 5} y={base + 5} w={sideW - 10} h={top - base - 10} />
        <GlassHatch x={b.x + b.w - sideW + 5} y={base + 5} w={sideW - 10} h={top - base - 10} />
      </g>
    ),
    led: (
      <g>
        <LedStrip x1={b.x + 9} x2={b.x + sideW - 9} y={base + 9} rays={3} />
        <LedStrip x1={b.x + b.w - sideW + 9} x2={b.x + b.w - 9} y={base + 9} rays={3} />
      </g>
    ),
    node: { x: b.x + b.w, y: b.y + b.h },
  };
}

function other(b) {
  // аксонометрия: фронт + верх + бок
  const d = Math.min(b.w, b.h) * 0.26;
  const fw = b.w - d;
  const fh = b.h - d;
  const fx = b.x;
  const fy = b.y + d;
  return {
    frame: (
      <g>
        <rect x={fx} y={fy} width={fw} height={fh} className="bp-d-main" />
        <path d={`M${fx} ${fy} L${fx + d} ${b.y} H${fx + fw + d} L${fx + fw} ${fy}`} className="bp-d-main" />
        <path d={`M${fx + fw + d} ${b.y} V${b.y + fh} L${fx + fw} ${fy + fh}`} className="bp-d-main" />
        <path d={`M${fx + d} ${b.y + fh} H${fx + fw + d} M${fx + d} ${b.y} V${b.y + fh} L${fx} ${fy + fh}`} className="bp-d-hidden" />
      </g>
    ),
    glass: <GlassHatch x={fx} y={fy} w={fw} h={fh} />,
    led: <LedStrip x1={fx + 6} x2={fx + fw - 6} y={fy + 8} />,
    node: { x: fx + fw, y: fy + fh },
    front: { x: fx, y: fy, w: fw, h: fh },
  };
}

const TEMPLATE_FNS = { showcase, counter, cabinet, rack, workbench, bench, 'bench-arc': benchArc, playground, carousel, island, other };

/** Шаблоны, которые на листе генплана рисуются видом сверху. */
const PLAN_TEMPLATES = ['playground', 'carousel', 'bench', 'bench-arc', 'other'];

/** Строка-легенда слоёв в углу чертежа: образец линии и название. LED без данных — с пометкой [уточнить]. */
function Legend({ spec, show, markerId }) {
  const items = ['frame', 'glass', 'led', 'dims']
    .filter((layer) => (layer === 'led' ? spec.led !== 'no' : spec.layers.includes(layer)))
    .map((layer) => ({
      layer,
      label: layer === 'led' ? (spec.led === 'unknown' ? `LED ${UNKNOWN}` : 'LED') : LAYER_LABELS[layer].toLowerCase(),
      off: layer === 'led' ? spec.led === 'unknown' || !show.has(layer) : !show.has(layer),
    }));
  let x = 16;
  const y = VB.h - 9;
  return (
    <g className="bp-d-legend">
      {items.map((item) => {
        const start = x;
        x += 22 + item.label.length * 5.7 + 12;
        return (
          <g key={item.layer} className={cn(item.off && 'is-off')}>
            {item.layer === 'frame' ? L(start, y - 3.5, start + 16, y - 3.5, 'bp-d-main') : null}
            {item.layer === 'glass' ? [0, 5, 10].map((o) => L(start + o, y, start + o + 6, y - 7, 'bp-d-thin')) : null}
            {item.layer === 'led' ? <line x1={start} y1={y - 3.5} x2={start + 16} y2={y - 3.5} className={item.off ? 'bp-d-hidden' : 'bp-d-led-line'} /> : null}
            {item.layer === 'dims' ? (
              <line x1={start} y1={y - 3.5} x2={start + 16} y2={y - 3.5} className="bp-d-thin" markerStart={`url(#${markerId})`} markerEnd={`url(#${markerId})`} />
            ) : null}
            <text x={start + 21} y={y} className="bp-d-legend-text">
              {item.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Размерная линия со стрелками и значением. */
function Dimension({ x1, y1, x2, y2, value, vertical, offset, markerId }) {
  if (vertical) {
    const lx = x1 - offset;
    return (
      <g>
        {L(x1 - 3, y1, lx - 5, y1, 'bp-d-thin')}
        {L(x1 - 3, y2, lx - 5, y2, 'bp-d-thin')}
        <line x1={lx} y1={y1} x2={lx} y2={y2} className="bp-d-thin" markerStart={`url(#${markerId})`} markerEnd={`url(#${markerId})`} />
        <text x={lx - 5} y={(y1 + y2) / 2} transform={`rotate(-90 ${lx - 5} ${(y1 + y2) / 2})`} textAnchor="middle" className={cn('bp-d-text', value === UNKNOWN && 'is-unknown')}>
          {value}
        </text>
      </g>
    );
  }
  const ly = y1 + offset;
  return (
    <g>
      {L(x1, y1 + 3, x1, ly + 5, 'bp-d-thin')}
      {L(x2, y1 + 3, x2, ly + 5, 'bp-d-thin')}
      <line x1={x1} y1={ly} x2={x2} y2={ly} className="bp-d-thin" markerStart={`url(#${markerId})`} markerEnd={`url(#${markerId})`} />
      <text x={(x1 + x2) / 2} y={ly - 5} textAnchor="middle" className={cn('bp-d-text', value === UNKNOWN && 'is-unknown')}>
        {value}
      </text>
    </g>
  );
}

/**
 * @param {{
 *   spec: ReturnType<import('../lib/drawing.js').drawingSpec>,
 *   materials?: string[],
 *   code?: string|null,          // обозначение для подписи вида
 *   visible?: string[],          // какие слои показать (по умолчанию все из spec.layers)
 *   compact?: boolean,           // мелкий вариант: без подписи вида и примечания
 *   className?: string,
 *   title?: string,
 * }} props
 */
export function Drawing({ spec, materials = [], code, visible, compact = false, className, title }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const markerId = `bp-arrow-${uid}`;
  const plan = spec.view === 'plan' && PLAN_TEMPLATES.includes(spec.template);
  const view = plan ? 'plan' : spec.view === 'plan' ? 'facade' : spec.view;
  const r = spec.ratio;
  const ratio = r ? (plan ? r.w / r.d : r.w / r.h) : DEFAULT_RATIO[spec.template];
  let box = fitBox(ratio);
  const ids = { hatch: `bp-hatch-${uid}`, concrete: `bp-concrete-${uid}` };
  const build = (b) => (TEMPLATE_FNS[spec.template] ?? other)({ ...b }, { ratio: r, view, glass: spec.layers.includes('glass'), materials, ids, parts: spec.parts });
  let parts = build(box);
  // стрелке нагрузки нужно место над изделием: если она упирается в верх поля — уменьшаем вид, прижав к полу
  if (spec.load && parts.loadAt && parts.loadAt.y - LOAD_ARROW < AREA.y + 4) {
    const k = 0.82;
    box = { x: box.x + (box.w * (1 - k)) / 2, y: box.y + box.h * (1 - k), w: box.w * k, h: box.h * k };
    parts = build(box);
  }
  const show = new Set(visible ?? spec.layers);
  const has = (layer) => spec.layers.includes(layer) && show.has(layer);
  const dimBox = parts.front ?? box;
  const horizontal = parts.round && spec.dims.w !== UNKNOWN ? `Ø${spec.dims.w}` : spec.dims.w;
  const verticalValue = plan ? spec.dims.d : spec.dims.h;
  // условный шаблон — не чертёж изделия: так и подписан
  const caption = spec.schematic ? SCHEMATIC_LABEL : VIEW_LABELS[view];
  const captionWidth = caption.length * (spec.schematic ? 6.2 : 7.4);
  const noteLabel = plan ? 'В' : 'Г';
  const noteValue = plan ? spec.dims.h : spec.dims.d;

  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className={cn('bp-drawing', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
      data-view={view}
    >
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M0 2.6 L10 5 L0 7.4 Z" className="bp-d-arrow" />
        </marker>
        <pattern id={ids.hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" className="bp-d-thin" />
        </pattern>
        <pattern id={ids.concrete} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="3" r="0.8" className="bp-d-dot" />
          <path d="M6 8 L8 5 L9 8 Z" className="bp-d-thin" />
        </pattern>
      </defs>

      {!compact ? (
        <g className="bp-d-caption">
          <text x={AREA.x} y={16} className="bp-d-label">
            {caption}
          </text>
          {code ? (
            <text x={AREA.x + captionWidth + 14} y={16} className="bp-d-text">
              {code}
            </text>
          ) : null}
          {L(AREA.x, 20, AREA.x + captionWidth + 4, 20, 'bp-d-thin')}
        </g>
      ) : null}

      {!plan && !compact ? <Floor y={box.y + box.h} /> : null}

      <g data-layer="frame">
        {parts.frame}
        {view === 'facade' && parts.node && !compact ? (
          <g>
            <circle cx={parts.node.x} cy={parts.node.y} r={11} className="bp-d-thin" />
            {L(parts.node.x + 8, parts.node.y - 8, parts.node.x + 22, parts.node.y - 22, 'bp-d-thin')}
            {L(parts.node.x + 22, parts.node.y - 22, parts.node.x + 36, parts.node.y - 22, 'bp-d-thin')}
            <text x={parts.node.x + 25} y={parts.node.y - 25} className="bp-d-label">
              А
            </text>
          </g>
        ) : null}
        {view === 'plan' && !compact ? (
          <g transform={`translate(26 ${VB.h - 50})`}>
            <path d="M0 -12 L6 8 L0 4 L-6 8 Z" className="bp-d-north" />
            <text x={0} y={22} textAnchor="middle" className="bp-d-label">
              С
            </text>
          </g>
        ) : null}
      </g>

      {has('glass') && parts.glass ? <g data-layer="glass">{parts.glass}</g> : null}
      {has('led') && parts.led ? <g data-layer="led">{parts.led}</g> : null}

      {has('dims') ? (
        <g data-layer="dims">
          <Dimension x1={dimBox.x} y1={box.y + box.h} x2={dimBox.x + dimBox.w} y2={box.y + box.h} value={horizontal} offset={compact ? 20 : 26} markerId={markerId} />
          {parts.round ? null : (
            <Dimension x1={box.x} y1={dimBox.y} x2={box.x} y2={dimBox.y + dimBox.h} value={verticalValue} vertical offset={compact ? 18 : 24} markerId={markerId} />
          )}
          {!compact ? (
            <text x={VB.w - 12} y={VB.h - 9} textAnchor="end" className={cn('bp-d-text', noteValue === UNKNOWN && 'is-unknown')}>
              {`${noteLabel} ${noteValue}`}
            </text>
          ) : null}
          {spec.load && parts.loadAt ? (
            <g className="bp-d-load">
              <line x1={parts.loadAt.x} y1={parts.loadAt.y - LOAD_ARROW} x2={parts.loadAt.x} y2={parts.loadAt.y - 2} className="bp-d-main" markerEnd={`url(#${markerId})`} />
              <text x={parts.loadAt.x + 6} y={parts.loadAt.y - 26} className="bp-d-text">
                {`${spec.load} кг`}
              </text>
            </g>
          ) : null}
        </g>
      ) : null}

      {!compact ? <Legend spec={spec} show={show} markerId={markerId} /> : null}
    </svg>
  );
}
