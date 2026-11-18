import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./data.js', () => import('../../../tests/fixtures/dataset.js'));

import { useCatalogQuery } from './index.js';

// Те же пути, что в App.jsx: /:variant/catalog/:direction/:section?/:category?
function setup(initialUrl) {
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route path=":variant/catalog" element={children} />
        <Route path=":variant/catalog/:direction/:section?/:category?" element={children} />
      </Routes>
    </MemoryRouter>
  );
  return renderHook(
    () => {
      const catalog = useCatalogQuery();
      const location = useLocation();
      return { ...catalog, url: `${location.pathname}${location.search}` };
    },
    { wrapper },
  );
}

describe('useCatalogQuery', () => {
  it('читает маршрут и строку запроса и отдаёт результат', () => {
    const { result } = setup('/showroom/catalog/retail/trade-equipment?material=glass&q=витрина');
    expect(result.current.query).toMatchObject({ direction: 'retail', section: 'trade-equipment', material: 'glass', q: 'витрина' });
    expect(result.current.result.items.map((item) => item.id)).toEqual(['p01', 'p02', 'p03']);
  });

  it('мусор в ссылке игнорируется, страница не падает', () => {
    const { result } = setup('/showroom/catalog/nope/zzz?material=unobtainium&page=abc&sort=drop');
    expect(result.current.query).toMatchObject({ direction: null, material: null, page: 1, sort: 'relevance' });
    expect(result.current.result.total).toBe(44);
  });

  it('фильтр из строки запроса пишется в URL и читается обратно', () => {
    const { result } = setup('/showroom/catalog');
    act(() => result.current.setFilter('material', 'glass'));
    expect(result.current.url).toBe('/showroom/catalog?material=glass');
    expect(result.current.query.material).toBe('glass');
    expect(result.current.result.total).toBe(5);
    act(() => result.current.setFilter('material', null));
    expect(result.current.url).toBe('/showroom/catalog');
  });

  it('направление, раздел и категория живут в пути', () => {
    const { result } = setup('/blueprint/catalog?material=metal');
    act(() => result.current.setFilter('direction', 'metal'));
    expect(result.current.url).toBe('/blueprint/catalog/metal?material=metal');
    act(() => result.current.setFilter('category', 'workbenches'));
    expect(result.current.url).toBe('/blueprint/catalog/metal/metal-furniture/workbenches?material=metal');
    expect(result.current.result.items.map((item) => item.id)).toEqual(['p12', 'p14']);
    act(() => result.current.setFilter('direction', 'retail'));
    expect(result.current.url).toBe('/blueprint/catalog/retail?material=metal');
  });

  it('любое изменение фильтра возвращает на первую страницу, а смена страницы — нет', () => {
    const { result } = setup('/ral/catalog?page=2');
    expect(result.current.query.page).toBe(2);
    act(() => result.current.setFilter('page', 2));
    expect(result.current.url).toBe('/ral/catalog?page=2');
    act(() => result.current.setFilter('light', 'warm'));
    expect(result.current.url).toBe('/ral/catalog?light=warm');
  });

  it('поиск и сортировка пишутся в URL', () => {
    const { result } = setup('/showroom/catalog');
    act(() => result.current.setFilter('q', 'шкаф'));
    act(() => result.current.setFilter('sort', 'name'));
    expect(result.current.url).toBe(`/showroom/catalog?q=${encodeURIComponent('шкаф')}&sort=name`);
    expect(result.current.result.items.map((item) => item.id)).toEqual(['p10', 'p11']);
  });

  it('недопустимое значение фильтра в URL не попадает', () => {
    const { result } = setup('/showroom/catalog');
    act(() => result.current.setFilter('light', 'disco'));
    expect(result.current.url).toBe('/showroom/catalog');
  });

  it('reset сбрасывает фильтры строки запроса и остаётся в своём направлении', () => {
    const { result } = setup('/showroom/catalog/retail/trade-equipment?material=glass&q=витрина&page=1');
    act(() => result.current.reset());
    expect(result.current.url).toBe('/showroom/catalog/retail/trade-equipment');
  });

  it('reset со scope: all возвращает весь каталог', () => {
    const { result } = setup('/showroom/catalog/retail/trade-equipment?material=glass');
    act(() => result.current.reset({ all: true }));
    expect(result.current.url).toBe('/showroom/catalog');
  });
});
