import { describe, expect, it } from 'vitest';
import { getDirections, getIndustries, queryProducts } from '../catalog/index.js';
import { buildNav } from './nav.js';

const byId = (list, id) => list.find((item) => item.id === id);

/** Все товары каталога через публичный запрос: страница за страницей. */
function allProducts() {
  const first = queryProducts({});
  const rest = Array.from({ length: first.pages - 1 }, (_, index) => queryProducts({ page: index + 2 }).items);
  return [first.items, ...rest].flat();
}

describe('buildNav: меню по брифу', () => {
  it('пункты верхнего уровня: Каталог, Решения, Проекты, Производство, Контакты — с вариантом в адресе', () => {
    const { items } = buildNav('ral');
    expect(items.map((item) => [item.id, item.label])).toEqual([
      ['catalog', 'Каталог'],
      ['solutions', 'Решения'],
      ['projects', 'Проекты'],
      ['about', 'Производство'],
      ['contacts', 'Контакты'],
    ]);
    expect(items.map((item) => item.to)).toEqual([
      '/ral/catalog',
      '/ral/solutions/pharmacy',
      '/ral/projects',
      '/ral/about',
      '/ral/contacts',
    ]);
  });

  it('мега-меню: три равных направления, у каждого разделы с числом товаров и ссылкой в каталог', () => {
    const { directions } = buildNav('showroom');
    expect(directions.map((direction) => direction.id)).toEqual(['retail', 'landscape', 'metal']);
    for (const direction of directions) {
      const source = getDirections().find((item) => item.id === direction.id);
      expect(direction.name).toBe(source.name);
      expect(direction.to).toBe(`/showroom/catalog/${source.slug}`);
      expect(direction.sections.length).toBe(source.sections.length);
      for (const section of direction.sections) {
        const sourceSection = source.sections.find((item) => item.id === section.id);
        expect(section.name).toBe(sourceSection.name);
        expect(section.count).toBe(sourceSection.count);
        expect(section.to).toBe(`/showroom/catalog/${source.slug}/${sourceSection.slug}`);
      }
    }
  });

  it('«Каталог» раскрывается в направления, «Решения» — во все отрасли из данных', () => {
    const { items, directions } = buildNav('blueprint');
    const catalog = byId(items, 'catalog');
    expect(catalog.children.map((child) => child.to)).toEqual(directions.map((direction) => direction.to));
    const solutions = byId(items, 'solutions');
    expect(solutions.children.map((child) => child.to)).toEqual(
      getIndustries().map((industry) => `/blueprint/solutions/${industry.slug}`),
    );
  });

  it('до любого товара с главной — не больше трёх кликов: направление и раздел каждого товара есть в меню', () => {
    const { directions } = buildNav('showroom');
    for (const product of allProducts()) {
      const direction = byId(directions, product.direction);
      expect(direction, product.slug).toBeTruthy();
      expect(byId(direction.sections, product.sectionId), product.slug).toBeTruthy();
    }
  });
});
