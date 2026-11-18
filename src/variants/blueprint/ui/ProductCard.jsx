// Карточка «Чертежа»: фото на подиуме листа (наведение — чертёж), под ним — основная надпись позиции:
// обозначение, наименование, габарит, цена и «В запрос КП» в графах штампа.
import { Link } from 'react-router';
import { Maximize2 } from 'lucide-react';
import { AddToKp } from '../../../core/ui/AddToKp.jsx';
import { formatDimensions, formatPrice } from '../../../core/ui/format.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { cn } from '../../../lib/utils.js';
import { ProductMedia } from '../drawing/ProductMedia.jsx';
import { UNKNOWN, designation } from '../lib/drawing.js';

/** Габарит строкой без единиц: «900 × 2000 × 400»; нет данных — [уточнить]. */
export function dimsText(product) {
  const text = formatDimensions(product?.dimensions);
  return text ? text.replace(/\s*мм$/, '') : UNKNOWN;
}

/** ({ product, onQuickView }) */
export function ProductCard({ product, onQuickView, className, sizes }) {
  const { id: variantId } = useVariant();
  const to = `/${variantId}/product/${product.slug}`;
  const code = designation(product);
  const dims = dimsText(product);
  const priced = typeof product.price === 'number';
  return (
    <article className={cn('bp-card', className)}>
      <ProductMedia product={product} sizes={sizes} />
      <div className="bp-card__stamp">
        <p className="bp-cell bp-card__code">
          <span className="bp-cell__label">Обозн.</span>
          <span className={cn('bp-mono', !code && 'is-unknown')}>{code ?? UNKNOWN}</span>
        </p>
        <h3 className="bp-cell bp-card__name">
          <Link to={to} className="bp-link-quiet">
            {product.name}
          </Link>
        </h3>
        <p className="bp-cell bp-card__dims">
          <span className="bp-cell__label">Габарит, мм</span>
          <span className={cn('bp-mono', dims === UNKNOWN && 'is-unknown')}>{dims}</span>
        </p>
        <p className={cn('bp-cell bp-card__price tabular', !priced && 'is-muted')}>{formatPrice(product)}</p>
        <div className="bp-cell bp-card__actions">
          <AddToKp product={product} mode="card" />
          {onQuickView ? (
            <button type="button" className="bp-icon-btn" onClick={() => onQuickView(product)}>
              <Maximize2 className="size-4" aria-hidden="true" />
              <span className="sr-only">Быстрый просмотр: {product.name}</span>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
