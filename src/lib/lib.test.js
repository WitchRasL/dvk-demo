import { describe, expect, it } from 'vitest';
import { asset } from './base-url.js';
import { imageSrc, srcSet } from './images.js';
import { cn } from './utils.js';

describe('asset', () => {
  it('строит путь от base GitHub Pages', () => {
    expect(asset('images/products/vitrina/1-800.webp')).toBe('/dvk-style-redesign/images/products/vitrina/1-800.webp');
  });

  it('ведущий слэш не ломает путь', () => {
    expect(asset('/media/showroom/hero.mp4')).toBe('/dvk-style-redesign/media/showroom/hero.mp4');
  });

  it('внешние адреса и data: остаются как есть', () => {
    expect(asset('https://dvk-style.ru/upload/iblock/a.jpg')).toBe('https://dvk-style.ru/upload/iblock/a.jpg');
    expect(asset('data:image/png;base64,AA')).toBe('data:image/png;base64,AA');
  });
});

describe('srcSet и imageSrc', () => {
  it('srcset из двух размеров WebP', () => {
    expect(srcSet('images/products/vitrina/1')).toBe(
      '/dvk-style-redesign/images/products/vitrina/1-800.webp 800w, /dvk-style-redesign/images/products/vitrina/1-1600.webp 1600w',
    );
  });

  it('src нужного размера, по умолчанию 800', () => {
    expect(imageSrc('images/projects/hermitage/2')).toBe('/dvk-style-redesign/images/projects/hermitage/2-800.webp');
    expect(imageSrc('images/projects/hermitage/2', 1600)).toBe('/dvk-style-redesign/images/projects/hermitage/2-1600.webp');
  });
});

describe('cn', () => {
  it('склеивает условные классы и разрешает конфликты Tailwind', () => {
    expect(cn('px-2 py-1', false && 'hidden', { 'text-fg': true, 'text-fg-muted': false }, 'px-4')).toBe('py-1 text-fg px-4');
  });

  it('токены варианта не конфликтуют с размером и насыщенностью шрифта', () => {
    expect(cn('text-sm font-bold', 'text-fg font-display')).toBe('text-sm font-bold text-fg font-display');
    expect(cn('bg-surface', 'bg-surface-2')).toBe('bg-surface-2');
  });
});
