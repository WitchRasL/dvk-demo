// Галерея фото: «витрина» (большое фото + миниатюры, товар) или «лента» (фото друг под другом, проект).
// Первое фото грузится сразу (srcset), остальные — лениво. alt — из данных, иначе название.
// У миниатюр alt — название и номер фото: это фото товара, а не украшение (кнопку по-прежнему называет aria-label).
import { useState } from 'react';
import { cn } from '../../../lib/utils.js';
import { imageSrc, srcSet } from '../../../lib/images.js';

function Photo({ image, alt, eager, sizes, className }) {
  return (
    <img
      src={imageSrc(image.base, 1600)}
      srcSet={srcSet(image.base)}
      sizes={sizes}
      width={image.w}
      height={image.h}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      className={className}
    />
  );
}

/** @param {{ images?: { base: string, alt?: string, w?: number, h?: number }[], name: string, layout?: 'stage'|'stack', className?: string }} props */
export function Gallery({ images = [], name, layout = 'stage', className }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className={cn('flex aspect-[4/3] items-center justify-center rounded-lg border border-line bg-surface-2 text-fg-muted', className)}>
        Фото [уточнить]
      </div>
    );
  }

  const altOf = (image, index) => image.alt || (index === 0 ? name : `${name}, фото ${index + 1}`);

  if (layout === 'stack') {
    return (
      <ul className={cn('gallery flex flex-col gap-4', className)}>
        {images.map((image, index) => (
          <li key={image.base} className="overflow-hidden rounded-lg border border-line bg-surface-2">
            <Photo
              image={image}
              alt={altOf(image, index)}
              eager={index === 0}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="h-auto w-full"
            />
          </li>
        ))}
      </ul>
    );
  }

  const current = images[active] ?? images[0];
  return (
    <div className={cn('gallery flex flex-col gap-3', className)}>
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-line bg-[color:var(--stage)]">
        <Photo
          key={current.base}
          image={current}
          alt={altOf(current, active)}
          eager={active === 0}
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="size-full object-contain p-4"
        />
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label="Фотографии товара">
          {images.map((image, index) => (
            <li key={image.base}>
              <button
                type="button"
                aria-label={`Фото ${index + 1} из ${images.length}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
                className={cn(
                  'block aspect-square w-full overflow-hidden rounded-base border bg-[color:var(--stage)] transition-[opacity] duration-fast ease-out',
                  index === active ? 'border-fg' : 'border-line opacity-70 hover:opacity-100',
                )}
              >
                <img src={imageSrc(image.base, 800)} alt={`${name}, фото ${index + 1}`} width={image.w} height={image.h} loading="lazy" decoding="async" className="size-full object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
