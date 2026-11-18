// Список товаров «Чертежа». Каталог (layout 'grid') — таблица-спецификация по ЕСКД: поз., эскиз, обозначение,
// наименование, габариты, материал, цена, «В запрос КП». На телефоне строки складываются в компактные блоки.
// Ряды (layout 'rail': похожие, товары отрасли) — карточки с «Режимом чертёж», на телефоне — scroll-snap.
import { Link } from 'react-router';
import { Maximize2 } from 'lucide-react';
import { AddToKp } from '../../../core/ui/AddToKp.jsx';
import { formatPrice, materialLabel } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { cn } from '../../../lib/utils.js';
import { ProductMedia } from '../drawing/ProductMedia.jsx';
import { SHEET_TYPES, UNKNOWN, designation, materialsText } from '../lib/drawing.js';
import { ProductCard, dimsText } from './ProductCard.jsx';

function SpecRow({ product, index, onQuickView, variantId }) {
  const code = designation(product);
  const dims = dimsText(product);
  const materials = materialsText(product, materialLabel) || UNKNOWN;
  const priced = typeof product.price === 'number';
  const to = `/${variantId}/product/${product.slug}`;
  return (
    <tr role="row" className="bp-spec__row">
      <td role="cell" className="bp-spec__pos bp-mono" data-label="Поз.">
        {index + 1}
      </td>
      <td role="cell" className="bp-spec__sketch">
        {onQuickView ? (
          <button type="button" className="bp-spec__thumb" onClick={() => onQuickView(product)}>
            <ProductMedia product={product} size="thumb" />
            <span className="bp-spec__zoom" aria-hidden="true">
              <Maximize2 className="size-3.5" />
            </span>
            <span className="sr-only">Быстрый просмотр: {product.name}</span>
          </button>
        ) : (
          <ProductMedia product={product} size="thumb" />
        )}
      </td>
      <td role="cell" className={cn('bp-spec__code bp-mono', !code && 'is-unknown')}>
        {code ?? UNKNOWN}
      </td>
      <td role="cell" className="bp-spec__name">
        <Link to={to} className="bp-link-quiet">
          {product.name}
        </Link>
        <span className="bp-spec__inline-meta">
          <span className={cn('bp-mono', dims === UNKNOWN && 'is-unknown')}>{dims}</span>
          <span>{materials}</span>
        </span>
      </td>
      <td role="cell" className={cn('bp-spec__dims bp-mono', dims === UNKNOWN && 'is-unknown')}>
        {dims}
      </td>
      <td role="cell" className={cn('bp-spec__mat', materials === UNKNOWN && 'is-unknown')}>
        {materials}
      </td>
      <td role="cell" className={cn('bp-spec__price tabular', !priced && 'is-muted')}>
        {formatPrice(product)}
      </td>
      <td role="cell" className="bp-spec__kp">
        <AddToKp product={product} mode="card" />
      </td>
    </tr>
  );
}

/** Спецификация товаров: настоящая таблица, роли проставлены явно (на телефоне ячейки перестраиваются CSS). */
export function SpecTableList({ products, onQuickView, className }) {
  const { id: variantId } = useVariant();
  const directions = new Set(products.map((product) => product.direction));
  const sheet = directions.size === 1 ? SHEET_TYPES[[...directions][0]] : null;
  return (
    <div className={cn('bp-spec-wrap', className)}>
      <table role="table" className="bp-spec">
        <caption className="bp-spec__caption">
          <span>Спецификация</span>
          {sheet ? <span className="bp-spec__sheet">Тип листа: {sheet.name}</span> : null}
        </caption>
        <thead role="rowgroup">
          <tr role="row">
            <th role="columnheader" scope="col" className="bp-spec__pos">
              Поз.
            </th>
            <th role="columnheader" scope="col" className="bp-spec__sketch">
              Эскиз
            </th>
            <th role="columnheader" scope="col" className="bp-spec__code">
              Обозначение
            </th>
            <th role="columnheader" scope="col" className="bp-spec__name">
              Наименование
            </th>
            <th role="columnheader" scope="col" className="bp-spec__dims">
              Габариты, мм
            </th>
            <th role="columnheader" scope="col" className="bp-spec__mat">
              Материал
            </th>
            <th role="columnheader" scope="col" className="bp-spec__price">
              Цена
            </th>
            <th role="columnheader" scope="col" className="bp-spec__kp">
              <span className="sr-only">Запрос КП</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {products.map((product, index) => (
            <SpecRow key={product.id} product={product} index={index} onQuickView={onQuickView} variantId={variantId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** ({ products, onQuickView, layout: 'rail'|'grid' }) */
export function ProductList({ products = [], onQuickView, layout = 'rail', className }) {
  if (layout === 'grid') return <SpecTableList products={products} onQuickView={onQuickView} className={className} />;
  return (
    <ul className={cn('bp-rail rail', className)}>
      {products.map((product) => (
        <li key={product.id} className="bp-rail__item">
          <ProductCard product={product} onQuickView={onQuickView} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 78vw" />
        </li>
      ))}
    </ul>
  );
}
