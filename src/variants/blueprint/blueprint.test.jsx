// Швы варианта «Чертёж»: что рисует «Режим чертёж» по данным товара, обозначение позиции спецификации,
// выноски hero — только из данных (иначе [уточнить]). Ожидаемые значения — из src/data/*.json и спецификации.
import { describe, expect, it } from 'vitest';
import products from '../../data/products.json';
import company from '../../data/company.json';
import { designation, drawingSpec } from './lib/drawing.js';
import { heroConfig, mapPhotoPoint } from './lib/hero.js';

const bySlug = (slug) => products.find((product) => product.slug === slug);

describe('обозначение позиции — из названия товара', () => {
  it.each([
    ['Музейная витрина МВП-30', 'МВП-30'],
    ['Игровой комплекс Д-24 "Акула"', 'Д-24'],
    ['Шкаф архивный ШАМ-11-920 11/920', 'ШАМ-11-920'],
    ['Сейф офисный LS-052F', 'LS-052F'],
    ['Тренажерная беседка ТРК-1.1 из 10 тренажеров на раме', 'ТРК-1.1'],
    ['Стеллаж архивный СТФ 1034-2.5', 'СТФ 1034-2.5'],
  ])('%s → %s', (name, expected) => {
    expect(designation({ name })).toBe(expected);
  });

  it('нет обозначения в названии — null (интерфейс покажет [уточнить]), не выдумываем', () => {
    expect(designation({ name: 'Витрина для музея' })).toBeNull();
    expect(designation({})).toBeNull();
  });
});

describe('«Режим чертёж»: слои и размеры по данным товара', () => {
  it('витрина со стеклом: шаблон витрины, слой стекла есть; подсветки в данных нет — LED не рисуем, помечаем [уточнить]', () => {
    const spec = drawingSpec(bySlug('muzeynaya-vitrina-mvp-30')); // showcase, glass+ldsp, lighting null, 900×2000×400
    expect(spec.template).toBe('showcase');
    expect(spec.layers).toEqual(['frame', 'glass', 'dims']);
    expect(spec.led).toBe('unknown');
    expect(spec.dims).toEqual({ w: '900', h: '2000', d: '400' });
  });

  it('подсветка указана (не none) — слой LED есть; стекла в материалах нет — слоя стекла нет', () => {
    const spec = drawingSpec(bySlug('stellazh-demonstratsionnyy-sd-12')); // rack, ldsp, warm
    expect(spec.template).toBe('rack');
    expect(spec.layers).toEqual(['frame', 'led', 'dims']);
    expect(spec.led).toBe('yes');
  });

  it('подсветка none — LED нет и пометки нет', () => {
    const spec = drawingSpec({ kind: 'cabinet', materials: ['metal'], lighting: 'none', dimensions: null, direction: 'metal' });
    expect(spec.layers).toEqual(['frame', 'dims']);
    expect(spec.led).toBe('no');
  });

  it('размеров в данных нет — на размерных линиях [уточнить]', () => {
    const spec = drawingSpec(bySlug('prilavok-dlya-optiki-pod-20')); // counter, dimensions null
    expect(spec.template).toBe('counter');
    expect(spec.dims).toEqual({ w: '[уточнить]', h: '[уточнить]', d: '[уточнить]' });
  });

  it('нагрузка верстака — из данных; неизвестный kind — шаблон «прочее»', () => {
    expect(drawingSpec(bySlug('verstak-vs-100-01')).load).toBe('1500'); // load: 1500
    expect(drawingSpec(bySlug('muzeynaya-vitrina-mvp-30')).load).toBeNull();
    expect(drawingSpec({ kind: 'spaceship', materials: [] }).template).toBe('other');
  });

  it('тип листа по направлению: ритейл — фасад, благоустройство — план, металл — деталировка', () => {
    expect(drawingSpec(bySlug('muzeynaya-vitrina-mvp-30')).view).toBe('facade');
    expect(drawingSpec(bySlug('karusel-next-mk-27')).view).toBe('plan');
    expect(drawingSpec(bySlug('verstak-vs-100-01')).view).toBe('detail');
  });
});

describe('hero: выноски с полкой по данным', () => {
  const { callouts, poster } = heroConfig;

  it('4–6 выносок, каждая на своём отрезке прогресса и в точке кадра', () => {
    expect(callouts.length).toBeGreaterThanOrEqual(4);
    expect(callouts.length).toBeLessThanOrEqual(6);
    const sorted = [...callouts].sort((a, b) => a.from - b.from);
    sorted.forEach((callout, index) => {
      expect(callout.from).toBeGreaterThanOrEqual(0);
      expect(callout.to).toBeLessThanOrEqual(1);
      expect(callout.to).toBeGreaterThan(callout.from);
      expect(callout.x).toBeGreaterThanOrEqual(0);
      expect(callout.x).toBeLessThanOrEqual(1);
      expect(callout.y).toBeGreaterThanOrEqual(0);
      expect(callout.y).toBeLessThanOrEqual(1);
      expect(callout.title.trim()).not.toBe('');
      if (index > 0) expect(callout.from).toBeGreaterThanOrEqual(sorted[index - 1].to); // не горят вместе
    });
  });

  it('тексты — факты из данных: габарит ВТ-К-1 из каталога, неизвестная подсветка — [уточнить]', () => {
    const texts = callouts.map((callout) => `${callout.title} ${callout.text ?? ''}`);
    expect(texts.some((text) => text.includes('1000 × 2500 × 1000'))).toBe(true); // products.json: ВТ-К-1, w×h×d
    expect(texts.some((text) => text.includes('[уточнить]'))).toBe(true); // lighting: null
    expect(texts.some((text) => text.includes('Брянск'))).toBe(true); // projects.json: museum-bryansk
  });

  it('заглушка — реальное фото проекта из company.heroPhotos', () => {
    expect(company.heroPhotos.map((photo) => photo.base)).toContain(poster.base);
  });
});

describe('заглушка hero: точка выноски на опорном фото → точка в окне вида', () => {
  const photo = { w: 1466, h: 550 };
  const still = { from: { x: 0, y: 0, scale: 1 }, to: { x: 0, y: 0, scale: 1 } };

  it('окно в пропорциях фото, камера стоит — точка на месте', () => {
    expect(mapPhotoPoint({ x: 0.25, y: 0.5 }, photo, { w: 1466, h: 550 }, still, 0.5)).toEqual({ x: 0.25, y: 0.5 });
  });

  it('камера приблизила в 1,2 раза — точка уходит от центра в 1,2 раза', () => {
    const zoom = { from: { x: 0, y: 0, scale: 1.2 }, to: { x: 0, y: 0, scale: 1.2 } };
    const point = mapPhotoPoint({ x: 0.25, y: 0.5 }, photo, { w: 1466, h: 550 }, zoom, 0);
    expect(point.x).toBeCloseTo(0.2, 5); // 0,5 + (0,25 − 0,5) × 1,2
    expect(point.y).toBeCloseTo(0.5, 5);
  });

  it('окно вдвое уже фото (object-fit: cover) — левая четверть фото у самого края', () => {
    const point = mapPhotoPoint({ x: 0.25, y: 0.5 }, photo, { w: 733, h: 550 }, still, 0);
    expect(point.x).toBeCloseTo(0, 5); // (−366,5 + 0,25 × 1466) / 733
  });
});
