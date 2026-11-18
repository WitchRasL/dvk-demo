import { describe, expect, it, vi } from 'vitest';

// Тесты идут на фикстуре (tests/fixtures), не на реальных src/data/*.json.
vi.mock('./data.js', () => import('../../../tests/fixtures/dataset.js'));

import {
  PAGE_SIZE,
  getCategory,
  getCompany,
  getCycleStep,
  getDirection,
  getDirectionTotal,
  getDirections,
  getFactText,
  getIndustries,
  getIndustry,
  getProduct,
  getProductById,
  getProject,
  getProjects,
  getSection,
  getSimilar,
  parseCatalogParams,
  queryProducts,
  toSearchParams,
} from './index.js';

const ids = (result) => result.items.map((item) => item.id);

describe('queryProducts: страницы', () => {
  it('без фильтров отдаёт все 44 товара страницами по 24', () => {
    const result = queryProducts({});
    expect(PAGE_SIZE).toBe(24);
    expect(result.total).toBe(44);
    expect(result.pages).toBe(2);
    expect(result.page).toBe(1);
    expect(result.items).toHaveLength(24);
    expect(result.items[0].id).toBe('p01');
  });

  it('вторая страница — остаток, страница за пределами прижимается к последней', () => {
    expect(queryProducts({ page: 2 }).items).toHaveLength(20);
    const far = queryProducts({ page: 99 });
    expect(far.page).toBe(2);
    expect(far.items).toHaveLength(20);
  });

  it('вызов без аргументов и мусорная страница не падают', () => {
    expect(queryProducts().total).toBe(44);
    expect(queryProducts({ page: -3 }).page).toBe(1);
    expect(queryProducts({ page: 'abc' }).page).toBe(1);
  });
});

describe('queryProducts: фильтры', () => {
  it('направление, раздел и категория сужают выдачу', () => {
    expect(ids(queryProducts({ direction: 'retail' }))).toEqual(['p01', 'p02', 'p03', 'p04', 'p05', 'p06']);
    expect(ids(queryProducts({ direction: 'retail', section: 'trade-equipment' }))).toEqual(['p01', 'p02', 'p03', 'p04', 'p05']);
    expect(ids(queryProducts({ direction: 'retail', section: 'trade-equipment', category: 'counters' }))).toEqual(['p04', 'p05']);
  });

  it('отрасль, материал и подсветка', () => {
    expect(ids(queryProducts({ industry: 'pharmacy' }))).toEqual(['p01', 'p04', 'p06']);
    expect(ids(queryProducts({ material: 'wood' }))).toEqual(['p05', 'p07', 'p12']);
    expect(ids(queryProducts({ light: 'warm' }))).toEqual(['p01', 'p05']);
    expect(ids(queryProducts({ light: 'none' }))).toEqual(['p04']);
  });

  it('фильтры складываются по И', () => {
    expect(ids(queryProducts({ direction: 'retail', material: 'glass' }))).toEqual(['p01', 'p02', 'p03', 'p05', 'p06']);
    expect(ids(queryProducts({ direction: 'retail', material: 'glass', light: 'cold' }))).toEqual(['p02', 'p06']);
  });

  it('неизвестное значение фильтра даёт пустую выдачу, а не ошибку', () => {
    const result = queryProducts({ direction: 'bogus' });
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
    expect(result.pages).toBe(1);
    expect(result.page).toBe(1);
  });
});

describe('queryProducts: поиск', () => {
  it('без учёта регистра, по названию, лучшее совпадение первым', () => {
    expect(ids(queryProducts({ q: 'витрина' }))).toEqual(['p01', 'p02', 'p03', 'p06']);
    expect(ids(queryProducts({ q: 'ВИТРИНА' }))).toEqual(['p01', 'p02', 'p03', 'p06']);
  });

  it('ё = е в обе стороны, в названии и в характеристиках', () => {
    expect(ids(queryProducts({ q: 'лед' }))).toEqual(['p03']);
    expect(ids(queryProducts({ q: 'ЛЁГКАЯ' }))).toEqual(['p07']);
    expect(ids(queryProducts({ q: 'тяжелый' }))).toEqual(['p14']);
    expect(ids(queryProducts({ q: 'закаленное' }))).toEqual(['p01']);
    expect(ids(queryProducts({ q: 'закалённое' }))).toEqual(['p01']);
  });

  it('ищет по названию категории', () => {
    expect(ids(queryProducts({ q: 'прилавки' }))).toEqual(['p04', 'p05']);
  });

  it('несколько слов — товар должен содержать все', () => {
    expect(ids(queryProducts({ q: 'витрина угловая' }))).toEqual(['p02']);
    expect(ids(queryProducts({ q: 'металлический шкаф' }))).toEqual(['p10', 'p11']);
  });

  it('ничего не нашлось — пустой список и одна страница', () => {
    const result = queryProducts({ q: 'несуществующее' });
    expect(result).toMatchObject({ total: 0, items: [], pages: 1, page: 1 });
  });

  it('поиск складывается с фильтрами', () => {
    expect(ids(queryProducts({ q: 'витрина', industry: 'pharmacy' }))).toEqual(['p01', 'p06']);
  });
});

describe('queryProducts: сортировка', () => {
  it('по названию (русский алфавит, регистр не важен)', () => {
    const sorted = ids(queryProducts({ direction: 'retail', sort: 'name' }));
    expect(sorted.slice(0, 4)).toEqual(['p06', 'p02', 'p01', 'p03']);
    expect(new Set(sorted.slice(4))).toEqual(new Set(['p04', 'p05']));
  });

  it('по цене: дешёвые первыми, «по запросу» в конце в исходном порядке', () => {
    expect(ids(queryProducts({ direction: 'retail', sort: 'price' }))).toEqual(['p06', 'p01', 'p02', 'p05', 'p03', 'p04']);
  });

  it('релевантность без поиска сохраняет порядок данных', () => {
    expect(ids(queryProducts({ direction: 'metal', sort: 'relevance' }))).toEqual(['p10', 'p11', 'p12', 'p13', 'p14']);
  });
});

describe('queryProducts: фасеты', () => {
  const facetMap = (facet) => Object.fromEntries(facet.map(({ value, count }) => [value, count]));

  it('считаются из данных по всему каталогу', () => {
    const { facets } = queryProducts({});
    expect(facetMap(facets.industry)).toEqual({ pharmacy: 3, jewelry: 3, school: 32, municipal: 3, industrial: 5 });
    expect(facetMap(facets.material)).toEqual({ metal: 9, glass: 5, ldsp: 2, wood: 3, stone: 1, plastic: 31 });
    expect(facetMap(facets.light)).toEqual({ warm: 2, cold: 2, rgb: 1, none: 1 });
    expect(facetMap(facets.category)).toEqual({
      showcases: 3,
      counters: 2,
      'pharmacy-showcases': 1,
      'park-benches': 2,
      slides: 31,
      lockers: 2,
      workbenches: 2,
    });
  });

  it('у значения есть читаемая подпись', () => {
    const { facets } = queryProducts({});
    expect(facets.industry.find((item) => item.value === 'pharmacy')).toEqual({ value: 'pharmacy', label: 'Аптеки', count: 3 });
    expect(facets.material.find((item) => item.value === 'glass')?.label).toBe('Стекло');
    expect(facets.light.find((item) => item.value === 'warm')?.label).toBe('Тёплый свет');
    expect(facets.category.find((item) => item.value === 'workbenches')?.label).toBe('Верстаки');
  });

  it('учитывают остальные фильтры и не учитывают свой собственный', () => {
    const { facets } = queryProducts({ material: 'glass' });
    // отрасли — только среди стеклянных товаров
    expect(facetMap(facets.industry)).toEqual({ pharmacy: 2, jewelry: 3 });
    // материалы — как если бы фильтра по материалу не было, чтобы можно было переключиться
    expect(facetMap(facets.material).metal).toBe(9);
    expect(facetMap(facets.material).glass).toBe(5);
  });

  it('направление сужает все фасеты', () => {
    const { facets } = queryProducts({ direction: 'retail' });
    expect(facetMap(facets.material)).toEqual({ glass: 5, metal: 2, ldsp: 2, wood: 1 });
    expect(facetMap(facets.category)).toEqual({ showcases: 3, counters: 2, 'pharmacy-showcases': 1 });
  });

  it('выбранное значение остаётся в списке, даже если в нём ноль товаров', () => {
    const { facets } = queryProducts({ direction: 'metal', material: 'glass' });
    expect(facetMap(facets.material)).toEqual({ metal: 5, wood: 1, glass: 0 });
  });

  it('поиск тоже сужает фасеты', () => {
    const { facets } = queryProducts({ q: 'верстак' });
    expect(facetMap(facets.category)).toEqual({ workbenches: 2 });
  });
});

describe('parseCatalogParams', () => {
  it('читает параметры маршрута и строки запроса', () => {
    const query = parseCatalogParams(
      { direction: 'retail', section: 'trade-equipment', category: 'showcases' },
      new URLSearchParams('industry=pharmacy&material=glass&light=warm&q=витрина&sort=price&page=2'),
    );
    expect(query).toEqual({
      direction: 'retail',
      section: 'trade-equipment',
      category: 'showcases',
      industry: 'pharmacy',
      material: 'glass',
      light: 'warm',
      q: 'витрина',
      sort: 'price',
      page: 2,
    });
  });

  it('пустой вход даёт пустой запрос', () => {
    expect(parseCatalogParams({}, new URLSearchParams())).toEqual({
      direction: null,
      section: null,
      category: null,
      industry: null,
      material: null,
      light: null,
      q: '',
      sort: 'relevance',
      page: 1,
    });
    expect(parseCatalogParams()).toEqual(parseCatalogParams({}, new URLSearchParams()));
  });

  it('мусорные и неизвестные значения отбрасывает без ошибки', () => {
    const query = parseCatalogParams(
      { direction: 'nope', section: '<script>', category: '../../etc' },
      new URLSearchParams('industry=zzz&material=unobtainium&light=disco&sort=random&page=-1'),
    );
    expect(query).toMatchObject({ direction: null, section: null, category: null, industry: null, material: null, light: null, sort: 'relevance', page: 1 });
    expect(parseCatalogParams({}, new URLSearchParams('page=abc')).page).toBe(1);
    expect(parseCatalogParams({}, new URLSearchParams('page=2.5')).page).toBe(1);
    expect(parseCatalogParams({}, new URLSearchParams('page=0')).page).toBe(1);
    expect(parseCatalogParams({}, new URLSearchParams('page=99999999999999999999')).page).toBe(1);
  });

  it('раздел и категория, не принадлежащие родителю, отбрасываются', () => {
    expect(parseCatalogParams({ direction: 'retail', section: 'benches' }, new URLSearchParams())).toMatchObject({ direction: 'retail', section: null, category: null });
    expect(parseCatalogParams({ direction: 'retail', section: 'trade-equipment', category: 'workbenches' }, new URLSearchParams())).toMatchObject({
      direction: 'retail',
      section: 'trade-equipment',
      category: null,
    });
  });

  it('категорию из плоской ссылки достраивает до раздела и направления', () => {
    expect(parseCatalogParams({}, new URLSearchParams('category=workbenches'))).toMatchObject({
      direction: 'metal',
      section: 'metal-furniture',
      category: 'workbenches',
    });
  });

  it('направление можно передать и в строке запроса', () => {
    expect(parseCatalogParams({}, new URLSearchParams('direction=landscape')).direction).toBe('landscape');
  });

  it('поиск: пробелы схлопываются, длина ограничена, повторы — первое значение', () => {
    expect(parseCatalogParams({}, new URLSearchParams('q=%20%20витрина%20%20%20угловая%20')).q).toBe('витрина угловая');
    expect(parseCatalogParams({}, new URLSearchParams(`q=${'а'.repeat(500)}`)).q).toHaveLength(100);
    expect(parseCatalogParams({}, new URLSearchParams('material=glass&material=wood')).material).toBe('glass');
  });

  it('понимает и строку запроса, и обычный объект', () => {
    expect(parseCatalogParams({}, 'material=wood').material).toBe('wood');
    expect(parseCatalogParams({}, { material: 'wood' }).material).toBe('wood');
  });
});

describe('toSearchParams', () => {
  it('выписывает только непустое; сортировка по умолчанию и первая страница не пишутся', () => {
    const params = toSearchParams({
      direction: null,
      section: null,
      category: null,
      industry: 'pharmacy',
      material: null,
      light: 'warm',
      q: 'витрина',
      sort: 'relevance',
      page: 1,
    });
    expect(params).toBeInstanceOf(URLSearchParams);
    expect(Object.fromEntries(params)).toEqual({ industry: 'pharmacy', light: 'warm', q: 'витрина' });
    expect(toSearchParams({}).toString()).toBe('');
  });

  it('сортировка и страница пишутся, когда отличаются от умолчаний', () => {
    expect(Object.fromEntries(toSearchParams({ sort: 'price', page: 3 }))).toEqual({ sort: 'price', page: '3' });
  });

  it('withPath: false оставляет направление, раздел и категорию для пути', () => {
    const query = parseCatalogParams({ direction: 'retail', section: 'trade-equipment', category: 'showcases' }, 'material=glass');
    expect(Object.fromEntries(toSearchParams(query, { withPath: false }))).toEqual({ material: 'glass' });
    expect(Object.fromEntries(toSearchParams(query))).toEqual({
      direction: 'retail',
      section: 'trade-equipment',
      category: 'showcases',
      material: 'glass',
    });
  });

  it('обратимо: разбор выписанного возвращает тот же запрос', () => {
    const query = parseCatalogParams(
      { direction: 'metal', section: 'metal-furniture', category: 'workbenches' },
      'industry=industrial&material=wood&q=верстак+слесарный&sort=name&page=2',
    );
    expect(parseCatalogParams({}, toSearchParams(query))).toEqual(query);
    expect(parseCatalogParams({}, new URLSearchParams(toSearchParams(query).toString()))).toEqual(query);
  });
});

describe('справочники', () => {
  it('направления, разделы, категории', () => {
    expect(getDirections().map((direction) => direction.id)).toEqual(['retail', 'landscape', 'metal']);
    expect(getDirection('retail')?.name).toBe('Ритейл и экспозиция');
    expect(getDirection('nope')).toBeUndefined();
    expect(getSection('retail', 'trade-equipment')?.categories).toHaveLength(2);
    expect(getSection('retail', 'benches')).toBeUndefined();
    expect(getCategory('workbenches')).toMatchObject({ name: 'Верстаки', sectionId: 'metal-furniture', directionId: 'metal' });
    expect(getCategory('nope')).toBeUndefined();
  });

  it('отрасли', () => {
    expect(getIndustries().map((industry) => industry.id)).toEqual(['pharmacy', 'jewelry', 'school', 'municipal', 'industrial']);
    expect(getIndustry('pharmacy')?.name).toBe('Аптеки');
    expect(getIndustry('nope')).toBeUndefined();
  });

  it('товары, проекты, компания', () => {
    expect(getProduct('vitrina-uzkaya')?.id).toBe('p01');
    expect(getProduct('nope')).toBeUndefined();
    expect(getProductById('p02')?.slug).toBe('vitrina-uglovaya');
    expect(getProductById('nope')).toBeUndefined();
    expect(getProjects()).toHaveLength(3);
    expect(getProjects({ direction: 'metal' }).map((project) => project.slug)).toEqual(['sklad-fixture']);
    expect(getProject('park-fixture')?.direction).toBe('landscape');
    expect(getProject('nope')).toBeUndefined();
    expect(getCompany().cities.spb.label).toBe('Санкт-Петербург');
  });

  it('итог позиций направления: сумма разделов; по id, по объекту и для неизвестного направления', () => {
    // фикстура: ритейл 5 + 1 + 0, благоустройство 2 + 31, металл 2 + 1 + 2
    expect(getDirectionTotal('retail')).toBe(6);
    expect(getDirectionTotal(getDirection('landscape'))).toBe(33);
    expect(getDirectionTotal({ sections: [{ count: 2 }, { count: null }, {}] })).toBe(2);
    expect(getDirectionTotal('nope')).toBe(0);
    expect(getDirectionTotal(null)).toBe(0);
  });

  it('факта или шага цикла в данных нет — «[уточнить]» и undefined, без выдумки', () => {
    expect(getFactText('night-install')).toBe('[уточнить]');
    expect(getCycleStep('measure')).toBeUndefined();
  });

  it('похожие: сначала та же категория, себя нет, чужих направлений нет, по умолчанию 4', () => {
    const product = getProduct('vitrina-uzkaya');
    const similar = getSimilar(product);
    expect(similar).toHaveLength(4);
    expect(similar.map((item) => item.id).slice(0, 2)).toEqual(['p02', 'p03']);
    expect(similar.every((item) => item.id !== 'p01' && item.direction === 'retail')).toBe(true);
    expect(getSimilar(product, 2)).toHaveLength(2);
  });
});
