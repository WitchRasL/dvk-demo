// Hero «Палитры RAL»: 4–6 пояснений на своих отрезках и точках кадра, тексты — только из данных ДВК (R08, R72i),
// кадр-заглушка — фото проекта из company.heroPhotos (R71i), длина закреплённой сцены — по спецификации (R06).
import { describe, expect, it } from 'vitest';
import company from '../../data/company.json';
import products from '../../data/products.json';
import categories from '../../data/categories.json';
import { heroConfig } from './hero.js';

// Текст считается взятым из данных, если он (без учёта регистра, пробелов и вида тире) — часть какого-нибудь поля данных.
const normalize = (text) => String(text).toLowerCase().replace(/ё/g, 'е').replace(/[‐-―-]/g, '-').replace(/\s+/g, '');
const corpus = normalize(JSON.stringify([company, products, categories]).replace(/\\"/g, '"'));
const fromData = (text) => text === '[уточнить]' || corpus.includes(normalize(text));

describe('hero «Палитры RAL»', () => {
  const { callouts, phases } = heroConfig;

  it('4–6 пояснений, каждое на своём отрезке 0..1 без наложений и в точке кадра', () => {
    expect(callouts.length).toBeGreaterThanOrEqual(4);
    expect(callouts.length).toBeLessThanOrEqual(6);
    callouts.forEach((callout, index) => {
      expect(callout.from).toBeGreaterThanOrEqual(0);
      expect(callout.to).toBeLessThanOrEqual(1);
      expect(callout.to).toBeGreaterThan(callout.from);
      expect(callout.x).toBeGreaterThanOrEqual(0);
      expect(callout.x).toBeLessThanOrEqual(1);
      expect(callout.y).toBeGreaterThanOrEqual(0);
      expect(callout.y).toBeLessThanOrEqual(1);
      if (index > 0) expect(callout.from).toBeGreaterThanOrEqual(callouts[index - 1].to);
    });
    expect(new Set(callouts.map((callout) => callout.id)).size).toBe(callouts.length);
  });

  it('код, заголовок, текст и источник пояснения — из данных ДВК или «[уточнить]»', () => {
    for (const callout of callouts) {
      for (const key of ['code', 'title', 'text', 'note']) {
        if (callout[key] == null) continue;
        expect(fromData(callout[key]), `${callout.id}.${key}: «${callout[key]}»`).toBe(true);
      }
      expect(callout.title.length).toBeGreaterThan(0);
    }
  });

  it('фазы «проектируем / производим / монтируем» покрывают весь ролик по порядку', () => {
    expect(phases.map((phase) => phase.id)).toEqual(['design', 'production', 'install']);
    expect(phases[0].from).toBe(0);
    expect(phases.at(-1).to).toBe(1);
    phases.slice(1).forEach((phase, index) => expect(phase.from).toBe(phases[index].to));
  });

  it('кадр-заглушка — фото проекта из heroPhotos, ролик — media/ral, сцена 300–400vh (телефон 200–250vh)', () => {
    expect(company.heroPhotos.map((photo) => photo.base)).toContain(heroConfig.poster.base);
    expect(heroConfig.poster.alt.length).toBeGreaterThan(0);
    expect(heroConfig.sources.desktop).toBe('media/ral/hero.mp4');
    expect(heroConfig.lengthVh).toBeGreaterThanOrEqual(300);
    expect(heroConfig.lengthVh).toBeLessThanOrEqual(400);
    expect(heroConfig.mobileLengthVh).toBeGreaterThanOrEqual(200);
    expect(heroConfig.mobileLengthVh).toBeLessThanOrEqual(250);
  });
});
