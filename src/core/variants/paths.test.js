import { describe, expect, it } from 'vitest';
import { fallbackVariantPath, swapVariantInPath } from './paths.js';

describe('swapVariantInPath', () => {
  it('меняет только первый сегмент и сохраняет путь и query (пример из спецификации)', () => {
    expect(swapVariantInPath('/ral/catalog/metal', '?q=шкаф', 'blueprint')).toBe(
      '/blueprint/catalog/metal?q=шкаф',
    );
  });

  it('сохраняет query с несколькими параметрами и кодированием как есть', () => {
    expect(
      swapVariantInPath('/showroom/catalog/retail/showcases', '?material=glass&q=%D1%88%D0%BA%D0%B0%D1%84&page=2', 'ral'),
    ).toBe('/ral/catalog/retail/showcases?material=glass&q=%D1%88%D0%BA%D0%B0%D1%84&page=2');
  });

  it('главная варианта ведёт на главную другого варианта', () => {
    expect(swapVariantInPath('/ral', '', 'showroom')).toBe('/showroom');
    expect(swapVariantInPath('/', '', 'ral')).toBe('/ral');
    expect(swapVariantInPath('', '', 'blueprint')).toBe('/blueprint');
  });

  it('без query не добавляет «?», а query без «?» дополняет', () => {
    expect(swapVariantInPath('/blueprint/product/vitrina-1', '', 'showroom')).toBe('/showroom/product/vitrina-1');
    expect(swapVariantInPath('/blueprint/catalog', 'q=1', 'ral')).toBe('/ral/catalog?q=1');
    expect(swapVariantInPath('/blueprint/catalog', '?', 'ral')).toBe('/ral/catalog');
  });

  it('сохраняет хвостовой слэш', () => {
    expect(swapVariantInPath('/ral/projects/', '', 'blueprint')).toBe('/blueprint/projects/');
  });

  it('если первый сегмент не вариант — добавляет вариант перед путём', () => {
    expect(swapVariantInPath('/catalog/metal', '?q=1', 'ral')).toBe('/ral/catalog/metal?q=1');
  });

  it('неизвестный целевой вариант заменяется вариантом по умолчанию', () => {
    expect(swapVariantInPath('/ral/about', '', 'nope')).toBe('/showroom/about');
  });
});

describe('fallbackVariantPath', () => {
  it('неизвестный вариант → showroom с тем же остатком пути и query', () => {
    expect(fallbackVariantPath('/nope/catalog/metal', '?q=шкаф')).toBe('/showroom/catalog/metal?q=шкаф');
    expect(fallbackVariantPath('/nope', '')).toBe('/showroom');
  });

  it('путь страницы без варианта получает вариант по умолчанию впереди', () => {
    expect(fallbackVariantPath('/product/vitrina-1', '')).toBe('/showroom/product/vitrina-1');
    expect(fallbackVariantPath('/contacts', '')).toBe('/showroom/contacts');
  });
});
