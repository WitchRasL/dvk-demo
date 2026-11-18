// Количество в запросе КП: минус, число, плюс. Число можно набрать руками.
import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const MIN = 1;
const MAX = 9999;

/** @param {{ value: number, onChange: (qty: number) => void, label: string, className?: string }} props */
export function QuantityStepper({ value, onChange, label, className }) {
  const [draft, setDraft] = useState(null); // пока набираем руками — строка, иначе null

  function commit(raw) {
    const qty = Math.floor(Number(raw));
    if (Number.isFinite(qty) && qty >= MIN) onChange(Math.min(MAX, qty));
  }

  const stepClass = cn(
    'inline-flex size-11 items-center justify-center text-fg transition-[opacity,transform] duration-fast ease-out',
    'hover:bg-surface-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
  );

  return (
    <div role="group" aria-label={label} className={cn('inline-flex items-center rounded-base border border-line bg-surface', className)}>
      <button type="button" className={cn(stepClass, 'rounded-l-base')} aria-label="Уменьшить количество" disabled={value <= MIN} onClick={() => onChange(value - 1)}>
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label="Количество"
        className="tabular h-11 w-14 border-x border-line bg-transparent text-center text-base text-fg"
        value={draft ?? String(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
          setDraft(digits);
          commit(digits);
        }}
        onBlur={() => setDraft(null)}
      />
      <button type="button" className={cn(stepClass, 'rounded-r-base')} aria-label="Увеличить количество" disabled={value >= MAX} onClick={() => onChange(value + 1)}>
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
