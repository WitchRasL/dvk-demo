// Быстрый просмотр товара: нативный <dialog> внутри страницы (то есть внутри корня варианта — токены на месте).
// Esc и клик по подложке закрывают, фокус возвращается на кнопку, с которой открыли.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { imageSrc, srcSet } from '../../../lib/images.js';
import { AddToKp } from '../../ui/AddToKp.jsx';
import { formatPrice } from '../../ui/format.js';
import { useVariant } from '../../variants/VariantContext.jsx';
import { SpecTable } from './SpecTable.jsx';

/** @param {{ product: object, onClose: () => void }} props */
export function QuickView({ product, onClose }) {
  const { id: variantId, ui } = useVariant();
  const dialogRef = useRef(null);
  const opener = useRef(typeof document === 'undefined' ? null : document.activeElement);
  const titleId = useId();
  const image = product.images?.[0];

  useEffect(() => {
    const dialog = dialogRef.current;
    const returnTo = opener.current;
    if (!dialog) return undefined;
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    // При размонтировании элемент уходит из DOM вместе с окном — закрывать вручную не нужно.
    // Вернуть фокус надо: нативный <dialog> в части браузеров этого не делает после клика мышью.
    return () => {
      if (returnTo && returnTo.isConnected && typeof returnTo.focus === 'function') returnTo.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="quick-view m-auto max-h-[calc(100dvh-1.5rem)] w-[min(58rem,calc(100vw-1.5rem))] overflow-auto rounded-lg border border-line bg-surface p-0 text-fg shadow-base"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose(); // клик по подложке
      }}
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="aspect-[4/3] bg-[color:var(--stage)] md:aspect-auto md:min-h-[24rem]">
          {image ? (
            <img
              src={imageSrc(image.base, 800)}
              srcSet={srcSet(image.base)}
              sizes="(min-width: 768px) 28rem, 100vw"
              width={image.w}
              height={image.h}
              alt={image.alt || product.name}
              decoding="async"
              className="size-full object-contain p-4"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-sm text-fg-muted">Фото [уточнить]</span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-5 p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-2xl leading-tight text-balance">
                {product.name}
              </h2>
              <p className="tabular mt-2 text-lg text-fg">{formatPrice(product)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть быстрый просмотр"
              className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-base text-fg transition-[opacity] duration-fast ease-out hover:bg-surface-2"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <SpecTable product={product} limit={4} className="text-sm" />
          <AddToKp product={product} mode="full" />
          <ui.Button variant="secondary" to={`/${variantId}/product/${product.slug}`} onClick={onClose}>
            Открыть страницу товара
          </ui.Button>
        </div>
      </div>
    </dialog>
  );
}

/** Хук страницы: openQuickView(product) и готовый элемент окна — его нужно вывести в разметке страницы. */
export function useQuickView() {
  const [product, setProduct] = useState(null);
  const close = useCallback(() => setProduct(null), []);
  const openQuickView = useCallback((next) => setProduct(next), []);
  const quickView = product ? <QuickView key={product.id} product={product} onClose={close} /> : null;
  return { openQuickView, quickView };
}

