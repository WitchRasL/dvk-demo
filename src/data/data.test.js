// Схема данных src/data/*.json (interfaces.md → «Данные») и наличие фото на диске.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import categories from './categories.json';
import company from './company.json';
import products from './products.json';
import projects from './projects.json';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DIRECTION_IDS = ['retail', 'landscape', 'metal'];
const KINDS = ['showcase', 'counter', 'cabinet', 'rack', 'workbench', 'bench', 'playground', 'island', 'other'];
const LIGHTING = ['warm', 'cold', 'rgb', 'none', null];
const SOURCE = /^https:\/\/dvk-style\.ru\//;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const sections = categories.directions.flatMap((direction) =>
  direction.sections.map((section) => ({ ...section, direction: direction.id })),
);
const leafCategories = sections.flatMap((section) =>
  section.categories.map((category) => ({ ...category, sectionId: section.id, direction: section.direction })),
);
const nodeIds = [...sections.map((s) => s.id), ...leafCategories.map((c) => c.id)];
const industryIds = categories.industries.map((industry) => industry.id);

function allImages() {
  const list = [];
  for (const product of products) for (const image of product.images) list.push([`product ${product.slug}`, image]);
  for (const project of projects) for (const image of project.images) list.push([`project ${project.slug}`, image]);
  for (const photo of company.heroPhotos) list.push(['heroPhotos', photo]);
  for (const client of company.clients) if (client.logo) list.push([`client ${client.name}`, client.logo]);
  for (const letter of company.letters) if (letter.image) list.push([`letter ${letter.from}`, letter.image]);
  for (const industry of categories.industries)
    for (const series of industry.series ?? []) if (series.image) list.push([`series ${series.name}`, series.image]);
  return list;
}

describe('categories.json', () => {
  it('три направления по id, у каждого раздела и категории число товаров и sourceUrl', () => {
    expect(categories.directions.map((d) => d.id)).toEqual(DIRECTION_IDS);
    for (const direction of categories.directions) {
      expect(direction.name).toBeTruthy();
      expect(direction.sections.length).toBeGreaterThan(0);
    }
    for (const node of [...sections, ...leafCategories]) {
      expect(node.name, node.id).toBeTruthy();
      expect(node.slug, node.id).toMatch(SLUG);
      expect(Number.isInteger(node.count) && node.count > 0, `${node.id} count`).toBe(true);
      expect(node.sourceUrl, node.id).toMatch(SOURCE);
    }
  });

  it('id разделов и категорий уникальны во всём дереве', () => {
    expect(new Set(nodeIds).size).toBe(nodeIds.length);
  });

  it('названия чистые: без капса, без хвостов поставщиков, без дубля «Промышленная мебель»', () => {
    for (const node of [...sections, ...leafCategories]) {
      expect(node.name, node.name).not.toBe(node.name.toUpperCase());
      // \b не работает с кириллицей — границы слова через просмотр назад/вперёд.
      expect(node.name, node.name).not.toMatch(/промет|диком|версия|пакс|металл\s*-\s*завод|(?<![а-яё])(двк|мз|па|дв|ди|пр)(?![а-яё])/i);
      expect(node.name).not.toMatch(/промышленная мебель/i);
    }
  });

  it('алиасы старых названий ведут на существующие узлы; дубль «Промышленная мебель» слит', () => {
    const entries = Object.entries(categories.aliases);
    expect(entries.length).toBeGreaterThan(0);
    for (const [, id] of entries) expect(nodeIds, id).toContain(id);
    expect(entries.some(([name]) => /промышленная мебель/i.test(name))).toBe(true);
  });

  it('отрасли: есть «Аптеки» с сериями, ссылки на направления валидны', () => {
    expect(new Set(industryIds).size).toBe(industryIds.length);
    for (const industry of categories.industries) {
      expect(industry.slug).toMatch(SLUG);
      for (const id of industry.directions) expect(DIRECTION_IDS).toContain(id);
    }
    const pharmacy = categories.industries.find((industry) => industry.id === 'pharmacy');
    expect(pharmacy).toBeTruthy();
    expect(pharmacy.series.length).toBeGreaterThanOrEqual(5);
    for (const series of pharmacy.series) {
      expect(series.name).toBeTruthy();
      expect(series.sourceUrl).toMatch(SOURCE);
    }
  });

  it('дата сбора записана', () => {
    expect(categories.meta.source).toBe('https://dvk-style.ru');
    expect(categories.meta.collectedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('products.json', () => {
  it('30–40 товаров, по 8–12 на каждое направление', () => {
    expect(products.length).toBeGreaterThanOrEqual(30);
    expect(products.length).toBeLessThanOrEqual(40);
    for (const id of DIRECTION_IDS) {
      const count = products.filter((product) => product.direction === id).length;
      expect(count, id).toBeGreaterThanOrEqual(8);
      expect(count, id).toBeLessThanOrEqual(12);
    }
  });

  it('уникальные id и slug', () => {
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
  });

  it('у каждого товара все поля схемы', () => {
    for (const product of products) {
      const label = product.slug;
      expect(product.slug, label).toMatch(SLUG);
      expect(product.name, label).toBeTruthy();
      expect(DIRECTION_IDS, label).toContain(product.direction);
      expect(Array.isArray(product.industries), label).toBe(true);
      for (const id of product.industries) expect(industryIds, label).toContain(id);
      expect(Array.isArray(product.materials), label).toBe(true);
      expect(LIGHTING, label).toContain(product.lighting);
      if (product.dimensions !== null) {
        expect(product.dimensions.unit, label).toBe('mm');
        for (const axis of ['w', 'h', 'd']) {
          const value = product.dimensions[axis];
          expect(value === null || (typeof value === 'number' && value > 0), `${label} ${axis}`).toBe(true);
        }
      }
      expect(product.load === null || (typeof product.load === 'number' && product.load > 0), label).toBe(true);
      expect(Array.isArray(product.specs) && product.specs.length > 0, label).toBe(true);
      for (const spec of product.specs) {
        expect(spec.label, label).toBeTruthy();
        expect(spec.value, label).toBeTruthy();
      }
      if (product.price === null) expect(product.priceNote, label).toBe('по запросу');
      else {
        expect(typeof product.price === 'number' && product.price > 0, label).toBe(true);
        expect(product.priceNote, label).toBeNull();
      }
      expect(KINDS, label).toContain(product.kind);
      expect(product.sourceUrl, label).toMatch(SOURCE);
      expect(product.images.length, label).toBeGreaterThan(0);
    }
  });

  it('раздел и категория товара существуют и принадлежат его направлению', () => {
    for (const product of products) {
      const section = sections.find((s) => s.id === product.sectionId);
      expect(section, `${product.slug} → ${product.sectionId}`).toBeTruthy();
      expect(section.direction, product.slug).toBe(product.direction);
      if (product.categoryId !== null) {
        const category = leafCategories.find((c) => c.id === product.categoryId);
        expect(category, `${product.slug} → ${product.categoryId}`).toBeTruthy();
        expect(category.sectionId, product.slug).toBe(product.sectionId);
      }
    }
  });
});

describe('projects.json', () => {
  it('5–10 проектов с фото и источником', () => {
    expect(projects.length).toBeGreaterThanOrEqual(5);
    expect(projects.length).toBeLessThanOrEqual(10);
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
    for (const project of projects) {
      expect(project.slug).toMatch(SLUG);
      expect(project.title).toBeTruthy();
      expect(project.summary).toBeTruthy();
      expect(DIRECTION_IDS).toContain(project.direction);
      if (project.industry !== null) expect(industryIds).toContain(project.industry);
      expect(Array.isArray(project.scope)).toBe(true);
      expect(project.images.length, project.slug).toBeGreaterThan(0);
      expect(project.sourceUrl).toMatch(SOURCE);
    }
    for (const id of DIRECTION_IDS) expect(projects.some((p) => p.direction === id), id).toBe(true);
  });
});

describe('company.json', () => {
  it('цикл из 5 шагов, услуги, обещание, позиционирование', () => {
    expect(company.cycle).toHaveLength(5);
    for (const step of company.cycle) expect(step.id && step.title && step.text).toBeTruthy();
    const services = company.services.map((s) => s.id);
    for (const id of ['branding', 'gov-orders', 'tender-specs']) expect(services).toContain(id);
    expect(company.promise).toMatch(/подбор/i);
    expect(company.promise).toMatch(/2 час/);
    expect(company.positioning).toBeTruthy();
  });

  it('контакты обеих площадок', () => {
    for (const city of ['spb', 'msk']) {
      const contacts = company.cities[city];
      expect(contacts.label).toBeTruthy();
      expect(contacts.phones.length, city).toBeGreaterThan(0);
      expect(contacts.emails.length, city).toBeGreaterThan(0);
    }
  });

  it('клиенты и письма с источниками; год основания — число или null', () => {
    expect(company.clients.length).toBeGreaterThan(0);
    expect(company.letters.length).toBeGreaterThan(0);
    for (const letter of company.letters) {
      expect(letter.from).toBeTruthy();
      expect(letter.sourceUrl).toMatch(SOURCE);
    }
    expect(company.foundedYear === null || Number.isInteger(company.foundedYear)).toBe(true);
  });

  it('3–6 hero-фото, каждое привязано к направлению', () => {
    expect(company.heroPhotos.length).toBeGreaterThanOrEqual(3);
    expect(company.heroPhotos.length).toBeLessThanOrEqual(6);
    for (const photo of company.heroPhotos) {
      expect(DIRECTION_IDS).toContain(photo.direction);
      expect(photo.alt).toBeTruthy();
    }
  });

  it('каждое [уточнить] из company.todo перечислено в docs/todo-utochnit.md', () => {
    const doc = readFileSync(resolve(ROOT, 'docs/todo-utochnit.md'), 'utf8');
    for (const item of company.todo) {
      expect(item).toMatch(/^\[уточнить\] /);
      expect(doc, item).toContain(item.replace(/^\[уточнить\] /, ''));
    }
  });
});

describe('фото', () => {
  it('каждый images[].base указывает на скачанные файлы 800 и 1600', () => {
    const images = allImages();
    expect(images.length).toBeGreaterThan(0);
    for (const [owner, image] of images) {
      expect(image.base, owner).toMatch(/^images\/(products|projects|company)\/[^/]+\/[^/]+$/);
      expect(Number.isInteger(image.w) && image.w > 0, `${owner} w`).toBe(true);
      expect(Number.isInteger(image.h) && image.h > 0, `${owner} h`).toBe(true);
      for (const width of [800, 1600]) {
        const file = resolve(ROOT, 'public', `${image.base}-${width}.webp`);
        expect(existsSync(file), `${owner}: ${image.base}-${width}.webp`).toBe(true);
      }
    }
  });

  it('у каждой папки фото есть manifest.json с исходными адресами, общий свод — в public/images/manifest.json', () => {
    const summary = JSON.parse(readFileSync(resolve(ROOT, 'public/images/manifest.json'), 'utf8'));
    for (const [owner, image] of allImages()) {
      const folder = image.base.split('/').slice(0, -1).join('/');
      const local = JSON.parse(readFileSync(resolve(ROOT, 'public', folder, 'manifest.json'), 'utf8'));
      const entry = local.files.find((file) => file.base === image.base);
      expect(entry, owner).toBeTruthy();
      expect(entry.source, owner).toMatch(/^https:\/\/dvk-style\.ru\/upload\/(iblock|medialibrary)\//);
      expect(summary.files.some((file) => file.base === image.base && file.source === entry.source), owner).toBe(true);
    }
  });
});
