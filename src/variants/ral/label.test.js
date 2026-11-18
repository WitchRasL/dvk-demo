// Этикетка карточки-образца: одна сетка на каждой карточке — RAL/материал · габариты · артикул.
// Ожидаемые значения взяты руками из src/data/products.json; чего в данных нет — «[уточнить]», не выдумка.
import { describe, expect, it } from 'vitest';
import { getProduct } from '../../core/catalog/index.js';
import { swatchLabel } from './label.js';

const label = (slug) => swatchLabel(getProduct(slug));

describe('этикетка образца', () => {
  it('код RAL берётся из характеристики «Цвет», габариты — Ш×В×Г, артикул — обозначение модели', () => {
    expect(label('shkaf-arkhivnyy-sham-11-920')).toEqual({
      finish: 'RAL 7035',
      finishCaption: 'RAL',
      size: '450×1830×920',
      article: 'ШАМ-11-920',
    });
  });

  it('два кода RAL у комбинированной окраски — оба', () => {
    expect(label('tumba-instrumentalnaya-ti-7-006')).toMatchObject({ finish: 'RAL 5005 / RAL 7035', article: 'ТИ-7.006', size: '500×1010×482' });
  });

  it('без кода RAL — материалы', () => {
    expect(label('muzeynaya-vitrina-mvp-30')).toMatchObject({ finish: 'Стекло, ЛДСП', finishCaption: 'Материал', article: 'МВП-30' });
    expect(label('igrovoy-kompleks-d-24-akula')).toMatchObject({ finish: 'Металл, Дерево', article: 'Д-24', size: '9535×3750×3230' });
  });

  it('нет габаритов в полях — значение из характеристики «Размеры» как есть', () => {
    expect(label('vitrina-pristennaya-s-nakopitelem-vod-24')).toMatchObject({ size: 'Рассчитывается индивидуально', article: 'ВОД-24' });
    expect(label('trk-1-1-trenazhernaya-besedka-iz-10-trenazherov-na-rame')).toMatchObject({ size: '6000х4000', article: 'ТРК-1.1' });
  });

  it('обозначения без дефиса: марка и номер серии', () => {
    expect(label('shkaf-instrumentalnyy-hard-2000-062000').article).toBe('HARD 2000-062000');
    expect(label('stellazh-arkhivnyy-stf-1034-2-5').article).toBe('СТФ 1034-2.5');
    expect(label('stellazh-metallicheskiy-ms-pro-2500-1010x800-4').article).toBe('MS Pro 2500/1010x800/4');
    expect(label('sistema-khraneniya-boxes-1-2').article).toBe('BOXES №1-2');
  });

  it('нет данных — видимая заглушка', () => {
    expect(swatchLabel({ name: 'Изделие', specs: [], materials: [], dimensions: null })).toEqual({
      finish: '[уточнить]',
      finishCaption: 'RAL / материал',
      size: '[уточнить]',
      article: '[уточнить]',
    });
  });
});
