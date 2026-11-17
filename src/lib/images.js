// Фото лежат парами <base>-800.webp и <base>-1600.webp (см. scripts/fetch-images.mjs).
import { asset } from './base-url.js';

export const IMAGE_WIDTHS = [800, 1600];

/** @param {string} base 'images/products/<slug>/1' → строка для srcset */
export function srcSet(base) {
  return IMAGE_WIDTHS.map((width) => `${asset(`${base}-${width}.webp`)} ${width}w`).join(', ');
}

/** @param {string} base @param {800|1600} [width] → src одного размера */
export function imageSrc(base, width = 800) {
  return asset(`${base}-${width}.webp`);
}
