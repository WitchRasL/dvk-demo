// Характеристики товара: строки из данных; материалы, подсветка и нагрузка добавляются, только если их нет в specs.
import { cn } from '../../../lib/utils.js';
import { LIGHT_LABELS } from '../../catalog/index.js';
import { formatDimensions, materialLabel } from '../../ui/format.js';

const has = (specs, pattern) => specs.some((spec) => pattern.test(String(spec?.label ?? '')));

/**
 * Строки таблицы характеристик: сначала всё из product.specs в том же порядке,
 * затем недостающее из полей товара. Неизвестное не выдумывается — строки просто нет.
 * @returns {{ label: string, value: string }[]}
 */
export function buildSpecRows(product) {
  const specs = (product?.specs ?? []).filter((spec) => spec?.label && spec?.value != null && String(spec.value).trim() !== '');
  const rows = specs.map((spec) => ({ label: String(spec.label), value: String(spec.value) }));
  const dimensions = formatDimensions(product?.dimensions);
  if (dimensions && !has(specs, /размер|габарит/i)) rows.unshift({ label: 'Размеры Ш × В × Г', value: dimensions });
  if (product?.materials?.length && !has(specs, /материал/i)) rows.push({ label: 'Материалы', value: product.materials.map(materialLabel).join(', ') });
  if (product?.lighting && !has(specs, /подсветк/i)) rows.push({ label: 'Подсветка', value: LIGHT_LABELS[product.lighting] ?? product.lighting });
  if (typeof product?.load === 'number' && !has(specs, /нагрузк/i)) rows.push({ label: 'Нагрузка, кг', value: String(product.load) });
  return rows;
}

/** @param {{ product: object, limit?: number, className?: string }} props */
export function SpecTable({ product, limit, className }) {
  const all = buildSpecRows(product);
  const rows = limit ? all.slice(0, limit) : all;
  if (!rows.length) {
    return <p className={cn('text-base text-fg-muted', className)}>Характеристики: [уточнить]</p>;
  }
  return (
    <table className={cn('spec-table w-full border-collapse text-left', className)}>
      <caption className="sr-only">Характеристики: {product.name}</caption>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.label}-${index}`} className="border-t border-line first:border-t-0">
            <th scope="row" className="w-[42%] py-3 pr-4 align-top text-sm font-normal text-pretty text-fg-muted">
              {row.label}
            </th>
            <td className="tabular py-3 align-top text-base break-words text-fg">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
