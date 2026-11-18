import { describe, expect, it } from 'vitest';
import { pageWindow } from './Pagination.jsx';
import { buildSpecRows } from './SpecTable.jsx';

describe('pageWindow: номера страниц нумерации', () => {
  it('до семи страниц — все подряд', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('много страниц — первая, последняя, соседи текущей и пропуски', () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 'gap', 20]);
    expect(pageWindow(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
    expect(pageWindow(20, 20)).toEqual([1, 'gap', 19, 20]);
    expect(pageWindow(3, 8)).toEqual([1, 2, 3, 4, 'gap', 8]);
  });
});

describe('buildSpecRows: таблица характеристик', () => {
  it('всё из specs остаётся как есть, в том же порядке, пустые строки отбрасываются', () => {
    const rows = buildSpecRows({
      specs: [
        { label: 'Размеры ВхШхГ, мм', value: '2000х900х400' },
        { label: 'Цвет', value: '' },
        { label: 'Материалы', value: 'ДСП 16мм, стекло 5мм' },
      ],
      dimensions: { w: 900, h: 2000, d: 400, unit: 'mm' },
      materials: ['glass', 'ldsp'],
    });
    expect(rows).toEqual([
      { label: 'Размеры ВхШхГ, мм', value: '2000х900х400' },
      { label: 'Материалы', value: 'ДСП 16мм, стекло 5мм' },
    ]);
  });

  it('недостающее берётся из полей товара: размеры, материалы по-русски, подсветка, нагрузка', () => {
    const rows = buildSpecRows({
      specs: [{ label: 'Цвет', value: 'серый' }],
      dimensions: { w: 840, h: 1000, d: 700, unit: 'mm' },
      materials: ['metal', 'plywood', 'concrete'],
      lighting: 'warm',
      load: 1500,
    });
    expect(rows).toEqual([
      { label: 'Размеры Ш × В × Г', value: '840 × 1000 × 700 мм' },
      { label: 'Цвет', value: 'серый' },
      { label: 'Материалы', value: 'Металл, Фанера, Бетон' },
      { label: 'Подсветка', value: 'Тёплый свет' },
      { label: 'Нагрузка, кг', value: '1500' },
    ]);
  });

  it('неизвестного не выдумывает: нет данных — нет строк', () => {
    expect(buildSpecRows({ specs: [], dimensions: null, materials: [], lighting: null, load: null })).toEqual([]);
  });
});
