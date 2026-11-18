// Подписи фасетов и общие справочники на реальных данных сайта (src/data/*.json), без фикстуры:
// здесь проверяется, что у каждого значения из данных есть русская подпись и что источник подписей один.
import { describe, expect, it } from 'vitest';
import categories from '../../data/categories.json';
import company from '../../data/company.json';
import products from '../../data/products.json';
import { materialLabel } from '../ui/format.js';
import { LIGHT_LABELS, MATERIAL_LABELS, UNKNOWN, getCycleStep, getDirectionTotal, getFactText, queryProducts } from './index.js';

const CYRILLIC = /^[А-ЯЁ][а-яё -]+$|^[А-ЯЁ]{2,}$/;
const materialsInData = [...new Set(products.flatMap((product) => product.materials ?? []))];
const lightsInData = [...new Set(products.map((product) => product.lighting).filter(Boolean))];

describe('подписи материалов и подсветки', () => {
  it('в данных есть материалы, которых не было в прежней таблице ядра', () => {
    expect(materialsInData).toEqual(expect.arrayContaining(['concrete', 'plywood']));
  });

  it('фасет «Материал» отдаёт русскую подпись для каждого материала из products.json', () => {
    const facet = queryProducts({}).facets.material;
    expect(facet.map((item) => item.value).sort()).toEqual([...materialsInData].sort());
    for (const item of facet) {
      expect(item.label, item.value).toMatch(CYRILLIC);
      expect(item.label, item.value).not.toBe(item.value);
    }
    expect(facet.find((item) => item.value === 'concrete').label).toBe('Бетон');
    expect(facet.find((item) => item.value === 'plywood').label).toBe('Фанера');
  });

  it('при равном числе товаров значения фасета идут по русскому алфавиту подписей', () => {
    const facet = queryProducts({}).facets.material;
    for (let i = 1; i < facet.length; i += 1) {
      const [a, b] = [facet[i - 1], facet[i]];
      expect(a.count).toBeGreaterThanOrEqual(b.count);
      if (a.count === b.count) expect(a.label.localeCompare(b.label, 'ru'), `${a.label} → ${b.label}`).toBeLessThan(0);
    }
  });

  it('materialLabel для вариантов и страниц читает ту же таблицу, что и фасет', () => {
    for (const value of ['metal', 'glass', 'ldsp', 'mdf', 'wood', 'plywood', 'plastic', 'concrete', 'stone']) {
      expect(MATERIAL_LABELS[value], value).toMatch(CYRILLIC);
      expect(materialLabel(value)).toBe(MATERIAL_LABELS[value]);
    }
    expect(materialLabel('graphene')).toBe('graphene'); // неизвестное значение показываем как есть, не выдумываем
  });

  it('у подсветки одна таблица подписей: фасет и характеристики говорят одинаково', () => {
    expect(LIGHT_LABELS).toEqual({ warm: 'Тёплый свет', cold: 'Холодный свет', rgb: 'RGB', none: 'Без подсветки' });
    for (const item of queryProducts({}).facets.light) expect(item.label).toBe(LIGHT_LABELS[item.value]);
    expect(lightsInData.every((value) => value in LIGHT_LABELS)).toBe(true);
  });

  it('второй копии подписей в данных нет', () => {
    expect(categories.facetLabels).toBeUndefined();
  });
});

describe('итог позиций направления и факты компании', () => {
  it('getDirectionTotal — сумма позиций разделов на dvk-style.ru', () => {
    // ритейл: 408 + 159 + 151 + 69; благоустройство: 1133 + 508 + 290; металл: 434 + 103 + 682
    expect(getDirectionTotal('retail')).toBe(787);
    expect(getDirectionTotal('landscape')).toBe(1931);
    expect(getDirectionTotal('metal')).toBe(1219);
  });

  it('getFactText отдаёт текст факта из company.json, а чего в данных нет — «[уточнить]»', () => {
    expect(UNKNOWN).toBe('[уточнить]');
    const known = company.facts[0];
    expect(known.text.length).toBeGreaterThan(10);
    expect(getFactText(known.id)).toBe(known.text);
    expect(getFactText('no-such-fact')).toBe('[уточнить]');
  });

  it('getCycleStep находит шаг цикла по id', () => {
    const step = company.cycle[0];
    expect(getCycleStep(step.id)).toEqual(step);
    expect(getCycleStep('no-such-step')).toBeUndefined();
  });
});
