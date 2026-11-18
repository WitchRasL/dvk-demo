// Фото товара на «подиуме» листа и его чертёж под ним. Наведение (точный указатель) или кнопка «Чертёж»
// стирают фото шторкой clip-path — открывается чертёж. На телефоне — только кнопка (тап). reduced-motion — мгновенно.
import { useState } from 'react';
import { PenTool } from 'lucide-react';
import { imageSrc, srcSet } from '../../../lib/images.js';
import { cn } from '../../../lib/utils.js';
import { designation, drawingSpec } from '../lib/drawing.js';
import { Drawing } from './Drawing.jsx';

/**
 * @param {{ product: object, size?: 'card'|'thumb', sizes?: string, toggle?: boolean, className?: string }} props
 */
export function ProductMedia({ product, size = 'card', sizes = '(min-width: 1280px) 24vw, (min-width: 640px) 45vw, 80vw', toggle = true, className }) {
  const [drawing, setDrawing] = useState(false);
  const spec = drawingSpec(product);
  const image = product.images?.[0];
  const code = designation(product);
  const thumb = size === 'thumb';

  return (
    <div className={cn('bp-media', thumb && 'bp-media--thumb', drawing && 'is-drawing', className)} data-view={spec.view}>
      <Drawing spec={spec} materials={product.materials ?? []} code={code} compact={thumb} className="bp-media__drawing" />
      <div className="bp-media__photo">
        {image ? (
          <img
            src={imageSrc(image.base, 800)}
            srcSet={thumb ? undefined : srcSet(image.base)}
            sizes={thumb ? undefined : sizes}
            width={image.w}
            height={image.h}
            alt={image.alt || product.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="bp-media__nophoto">Фото [уточнить]</span>
        )}
      </div>
      {toggle && !thumb ? (
        <button
          type="button"
          className="bp-media__toggle"
          aria-pressed={drawing}
          onClick={() => setDrawing((value) => !value)}
        >
          <PenTool className="size-3.5" aria-hidden="true" />
          Чертёж
          <span className="sr-only">: {product.name}</span>
        </button>
      ) : null}
    </div>
  );
}
