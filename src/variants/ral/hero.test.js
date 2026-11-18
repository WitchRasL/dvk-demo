// Hero «Палитры RAL»: ролик и его первый кадр (G04), пояснения на своих отрезках и точках кадра, тексты — только
// из данных ДВК (R08), сцена направления без ролика, шаг прокраски заголовка, длина закреплённой сцены (R06).
import { describe, expect, it } from 'vitest';
import company from '../../data/company.json';
import products from '../../data/products.json';
import projects from '../../data/projects.json';
import categories from '../../data/categories.json';
import { PAINT_SPAN, framePoint, heroConfig, heroSceneFor, paintedLetters, placeCallouts } from './hero.js';

// Текст считается взятым из данных, если он (без учёта регистра, пробелов и вида тире) — часть какого-нибудь поля данных.
const normalize = (text) => String(text).toLowerCase().replace(/ё/g, 'е').replace(/[‐-―-]/g, '-').replace(/\s+/g, '');
const corpus = normalize(JSON.stringify([company, products, projects, categories]).replace(/\\"/g, '"'));
const fromData = (text) => text === '[уточнить]' || corpus.includes(normalize(text));

const SCENES = [null, 'retail', 'landscape', 'metal'];

describe('hero «Палитры RAL»: ролик', () => {
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

  it('фазы «проектируем / производим / монтируем» покрывают весь ролик по порядку', () => {
    expect(phases.map((phase) => phase.id)).toEqual(['design', 'production', 'install']);
    expect(phases[0].from).toBe(0);
    expect(phases.at(-1).to).toBe(1);
    phases.slice(1).forEach((phase, index) => expect(phase.from).toBe(phases[index].to));
  });

  it('ролик и версия для телефона — media/ral, постер — первый кадр ролика, сцена 300–400vh (телефон 200–250vh)', () => {
    expect(heroConfig.sources).toEqual({ desktop: 'media/ral/hero.mp4', mobile: 'media/ral/hero-mobile.mp4' });
    expect(heroConfig.poster.src).toBe('media/ral/hero-poster.jpg');
    expect(heroConfig.poster.base).toBeUndefined();
    expect(heroConfig.poster.alt.length).toBeGreaterThan(0);
    expect(heroConfig.lengthVh).toBeGreaterThanOrEqual(300);
    expect(heroConfig.lengthVh).toBeLessThanOrEqual(400);
    expect(heroConfig.mobileLengthVh).toBeGreaterThanOrEqual(200);
    expect(heroConfig.mobileLengthVh).toBeLessThanOrEqual(250);
  });

  it('кадр подписан как доработанное фото проекта ДВК: парфюмерия, Балашиха', () => {
    const project = projects.find((item) => item.slug === 'perfume-balashikha');
    expect(heroConfig.caption.lead).toBe('Доработанное фото проекта ДВК');
    expect(heroConfig.caption.text).toBe(`${project.title}, ${project.city}`);
  });
});

describe('hero «Палитры RAL»: сцена по направлению', () => {
  it('грунт и ритейл — ролик; благоустройство и металл — кадр своего направления без ролика', () => {
    expect(heroSceneFor(null)).toBe(heroConfig);
    expect(heroSceneFor('retail')).toBe(heroConfig);
    expect(heroSceneFor('unknown')).toBe(heroConfig);
    for (const direction of ['landscape', 'metal']) {
      const scene = heroSceneFor(direction);
      expect(scene.sources, direction).toBeUndefined();
      const photo = company.heroPhotos.find((item) => item.base === scene.poster.base);
      expect(photo?.direction, direction).toBe(direction);
      const project = projects.find((item) => item.slug === photo.project);
      expect(scene.caption.lead).toBe('Фото проекта ДВК');
      expect(scene.caption.text).toBe([project.title, project.city].filter(Boolean).join(', '));
      expect(scene.lengthVh).toBeGreaterThanOrEqual(300);
      expect(scene.mobileLengthVh).toBeGreaterThanOrEqual(200);
    }
  });

  it('в поле направления — три пояснения уровня фаз, каждое внутри своей фазы', () => {
    for (const direction of ['landscape', 'metal']) {
      const scene = heroSceneFor(direction);
      expect(scene.callouts.map((callout) => callout.id)).toEqual(['design', 'production', 'install']);
      scene.callouts.forEach((callout, index) => {
        const phase = scene.phases[index];
        expect(callout.from, `${direction}.${callout.id}`).toBeGreaterThanOrEqual(phase.from);
        expect(callout.to, `${direction}.${callout.id}`).toBeLessThanOrEqual(phase.to);
        expect(callout.product, `${direction}.${callout.id}`).toBeUndefined();
      });
    }
  });

  it('код, заголовок и текст пояснения — из данных ДВК или «[уточнить]»; позиция каталога названа примером, а не предметом в кадре', () => {
    for (const direction of SCENES) {
      for (const callout of heroSceneFor(direction).callouts) {
        const where = `${direction}.${callout.id}`;
        expect(fromData(callout.code), `${where}.code: «${callout.code}»`).toBe(true);
        expect(fromData(callout.title), `${where}.title: «${callout.title}»`).toBe(true);
        expect(callout.title.length).toBeGreaterThan(0);
        if (callout.product) {
          // Пояснение о материале: источник назван («… — в каталоге: <позиция>»), строка характеристик — справкой.
          expect(products.some((product) => product.name === callout.product), where).toBe(true);
          expect(callout.text, where).toMatch(/ в каталоге: /);
          expect(callout.text.endsWith(callout.product), where).toBe(true);
          expect(callout.text, where).not.toMatch(/Из характеристик/);
          expect(fromData(callout.note), `${where}.note: «${callout.note}»`).toBe(true);
        } else {
          expect(fromData(callout.text), `${where}.text: «${callout.text}»`).toBe(true);
        }
      }
    }
  });
});

describe('точка кадра → точка окна рамки', () => {
  it('кадр и окно одних пропорций — точка на месте', () => {
    expect(framePoint([0.3, 0.8], { w: 1280, h: 704 }, { w: 640, h: 352 })).toEqual({ x: 0.3, y: 0.8 });
  });

  it('окно уже кадра: края обрезаны, фокус решает, какие', () => {
    const media = { w: 1000, h: 500 };
    const view = { w: 500, h: 500 };
    // по центру видна середина кадра: u от 0,25 до 0,75
    expect(framePoint([0.25, 0.5], media, view).x).toBeCloseTo(0, 6);
    expect(framePoint([0.5, 0.5], media, view).x).toBeCloseTo(0.5, 6);
    expect(framePoint([0.75, 0.2], media, view)).toEqual({ x: 1, y: 0.2 });
    // фокус у левого края: видна левая половина кадра
    expect(framePoint([0.25, 0.5], media, view, { x: 0, y: 0.5 }).x).toBeCloseTo(0.5, 6);
  });

  it('пояснения ролика ставятся по размеру окна и едут за деталью до конца отрезка', () => {
    const same = placeCallouts(heroConfig, { w: 1280, h: 704 });
    same.forEach((callout) => {
      expect(callout.x).toBeCloseTo(callout.at[0], 6);
      expect(callout.y).toBeCloseTo(callout.at[1], 6);
      expect(callout.x + callout.dx).toBeCloseTo(callout.atEnd[0], 6);
      expect(callout.y + callout.dy).toBeCloseTo(callout.atEnd[1], 6);
    });
    // узкое окно (телефон) обрезает края кадра — точки не выходят за окно
    placeCallouts(heroConfig, { w: 300, h: 400 }).forEach((callout) => {
      expect(callout.x).toBeGreaterThan(0);
      expect(callout.x).toBeLessThan(1);
    });
  });
});

describe('прокраска глагола заголовка', () => {
  const phase = { from: 0.25, to: 0.77 };

  it('идёт по буквам с начала фазы и заканчивается раньше фазы', () => {
    expect(PAINT_SPAN).toBeLessThan(phase.to - phase.from);
    expect(paintedLetters(0.1, phase, 10)).toBe(0);
    expect(paintedLetters(0.25, phase, 10)).toBe(0);
    expect(paintedLetters(0.25 + PAINT_SPAN / 2, phase, 10)).toBe(5);
    expect(paintedLetters(0.25 + PAINT_SPAN, phase, 10)).toBe(10);
    expect(paintedLetters(0.7, phase, 10)).toBe(10);
    expect(paintedLetters(1, phase, 10)).toBe(10);
  });

  it('число закрашенных букв — целое и не убывает', () => {
    let previous = 0;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const count = paintedLetters(p, phase, 9);
      expect(Number.isInteger(count)).toBe(true);
      expect(count).toBeGreaterThanOrEqual(previous);
      previous = count;
    }
    expect(previous).toBe(9);
  });

  it('короткая фаза: слово докрашено к её концу', () => {
    expect(paintedLetters(0.05, { from: 0, to: 0.05 }, 4)).toBe(4);
  });
});
