// Швы варианта «Чертёж»: что рисует «Режим чертёж» по данным товара, обозначение позиции спецификации,
// выноски hero — только из данных (иначе [уточнить]). Ожидаемые значения — из src/data/*.json и спецификации.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import products from '../../data/products.json';
import company from '../../data/company.json';
import { designation, drawingSpec } from './lib/drawing.js';
import { calloutPoint, heroConfig, heroSource, mapPhotoPoint } from './lib/hero.js';

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

describe('«Режим чертёж»: шаблон повторяет форму изделия, условный — подписан схемой', () => {
  it('карусель — свой шаблон: круг в плане, диаметр из данных', () => {
    const spec = drawingSpec(bySlug('karusel-next-mk-27')); // 1920 × 630 × 1920, план
    expect(spec.template).toBe('carousel');
    expect(spec.dims.w).toBe('1920');
    expect(spec.schematic).toBe(false);
  });

  it('типовой шаблон игрового комплекса и изделие без габаритов — «габаритная схема», не чертёж', () => {
    expect(drawingSpec(bySlug('igrovoy-kompleks-d-24-akula')).schematic).toBe(true); // общий шаблон площадки
    expect(drawingSpec(bySlug('prilavok-dlya-optiki-pod-20')).schematic).toBe(true); // dimensions: null
    expect(drawingSpec(bySlug('muzeynaya-vitrina-mvp-30')).schematic).toBe(false);
  });

  it('верстак: тумба и экран — только если они есть в характеристиках', () => {
    // ВС-100-01: «Комплектация: столешница, опоры», «Наличие экрана: нет»
    expect(drawingSpec(bySlug('verstak-vs-100-01')).parts).toMatchObject({ pedestal: false, screen: false });
    // ВЛ-200-05: «нагрузка на ящик тумбы», «Наличие экрана: есть»
    expect(drawingSpec(bySlug('verstak-vl-200-05-s-ekranom-vl-200-e4')).parts).toMatchObject({ pedestal: true, screen: true });
  });

  it('стеллаж: число ярусов — из обозначения «высота/ширина×глубина/ярусы»', () => {
    expect(drawingSpec(bySlug('stellazh-metallicheskiy-ms-pro-2500-1010x800-4')).parts.levels).toBe(4);
    expect(drawingSpec(bySlug('stellazh-demonstratsionnyy-sd-12')).parts.levels).toBeNull();
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

  it('постер — первый кадр ролика, лежит рядом с ним; исходник кадра — фото проекта из company.heroPhotos', () => {
    expect(poster.src).toBe('media/blueprint/hero-poster.jpg');
    for (const file of [poster.src, heroConfig.sources.desktop, heroConfig.sources.mobile]) {
      expect(existsSync(resolve(process.cwd(), 'public', file)), file).toBe(true);
    }
    expect(poster.w / poster.h).toBeCloseTo(1280 / 704, 3); // ffprobe hero.mp4: 1280×704
    expect(company.heroPhotos.map((photo) => photo.base)).toContain(heroSource.base);
    expect(heroSource.project).toBe('museum-bryansk');
  });

  it('выноска не приписывает предмету на фото артикул каталога: размеры на объекте — [уточнить], артикул — «в каталоге»', () => {
    const withCode = callouts.filter((callout) => /ВТ-К-1|МВП-30/.test(callout.text ?? ''));
    expect(withCode.length).toBeGreaterThanOrEqual(2);
    for (const callout of withCode) {
      expect(callout.text).toContain('[уточнить]');
      expect(callout.text).toMatch(/[Вв] каталоге/);
      expect(callout.title).not.toMatch(/ВТ-К-1|МВП-30/);
    }
  });

  it('точки стоят на деталях ролика (замер по кадрам hero.mp4, 8,04 с): ребро стекла, лампы, костюм', () => {
    const find = (id) => callouts.find((callout) => callout.id === id);
    const at = (id, p) => calloutPoint(find(id), p);
    const glass = find('glass');
    // ребро стекла ближней витрины: x = 0,74 на 4,8 с и 0,715 на 6,4 с — едет влево
    expect(at('glass', glass.from).x).toBeGreaterThan(0.72);
    expect(at('glass', glass.from).x).toBeLessThan(0.76);
    expect(at('glass', glass.to).x).toBeLessThan(at('glass', glass.from).x);
    // светильники большой витрины — верхняя четверть кадра, левая половина
    const light = find('light');
    expect(at('light', light.from).y).toBeLessThan(0.25);
    expect(at('light', light.from).x).toBeLessThan(0.45);
    // костюм в ближней витрине входит справа только во второй половине ролика
    const object = find('object');
    expect(object.from).toBeGreaterThan(0.6);
    expect(at('object', object.to).x).toBeGreaterThan(0.86);
  });
});

describe('выноска едет за деталью: точка на прогрессе p', () => {
  const callout = { from: 0.2, to: 0.4, x: 0.8, y: 0.3, end: { x: 0.7, y: 0.5 } };

  it('внутри отрезка — линейно от начала к концу', () => {
    const point = calloutPoint(callout, 0.3);
    expect(point.x).toBeCloseTo(0.75, 5);
    expect(point.y).toBeCloseTo(0.4, 5);
  });

  it('до отрезка — начальная точка, после — конечная; без end точка стоит', () => {
    expect(calloutPoint(callout, 0)).toEqual({ x: 0.8, y: 0.3 });
    expect(calloutPoint(callout, 1)).toEqual({ x: 0.7, y: 0.5 });
    expect(calloutPoint({ from: 0, to: 0.5, x: 0.1, y: 0.2 }, 0.25)).toEqual({ x: 0.1, y: 0.2 });
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
