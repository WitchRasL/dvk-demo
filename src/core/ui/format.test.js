import { describe, expect, it } from 'vitest';
import { UNKNOWN, WORD_FORMS, countText, formatDimensions, formatPrice, plural, toTel, wordFor } from './format.js';

// Пробелы в числах — неразрывные; для сравнения приводим к обычным.
const plain = (text) => String(text).replace(/\s/g, ' ');

describe('plural: русское склонение по числу', () => {
  const forms = ['товар', 'товара', 'товаров'];
  it.each([
    [0, 'товаров'],
    [1, 'товар'],
    [2, 'товара'],
    [4, 'товара'],
    [5, 'товаров'],
    [11, 'товаров'],
    [12, 'товаров'],
    [21, 'товар'],
    [22, 'товара'],
    [101, 'товар'],
    [111, 'товаров'],
    [408, 'товаров'],
  ])('%i → %s', (count, expected) => {
    expect(plural(count, forms)).toBe(expected);
  });
});

describe('formatPrice: цена или «по запросу»', () => {
  it('число — рубли с разделителем тысяч', () => {
    expect(plain(formatPrice({ price: 69734 }))).toBe('69 734 ₽');
    expect(plain(formatPrice({ price: 4500 }))).toBe('4 500 ₽');
  });
  it('нет цены — пометка из данных, иначе «по запросу»', () => {
    expect(formatPrice({ price: null, priceNote: 'по запросу' })).toBe('по запросу');
    expect(formatPrice({ price: null, priceNote: null })).toBe('по запросу');
    expect(formatPrice({})).toBe('по запросу');
  });
});

describe('formatDimensions: габариты Ш × В × Г', () => {
  it('три размера и единица', () => {
    expect(formatDimensions({ w: 900, h: 2000, d: 400, unit: 'mm' })).toBe('900 × 2000 × 400 мм');
  });
  it('нет данных — null, чтобы страница показала [уточнить] или промолчала', () => {
    expect(formatDimensions(null)).toBeNull();
    expect(formatDimensions({ w: null, h: null, d: null, unit: 'mm' })).toBeNull();
  });
});

describe('toTel: телефон для ссылки tel:', () => {
  it('оставляет плюс и цифры', () => {
    expect(toTel('+7 (812) 461-97-51')).toBe('+78124619751');
    expect(toTel('8 (495) 268-15-21')).toBe('+74952681521');
  });
});

describe('общие формы слов и маркер неизвестного', () => {
  it('маркер того, чего нет в данных, — «[уточнить]»', () => {
    expect(UNKNOWN).toBe('[уточнить]');
  });

  it.each([
    ['position', 1, 'позиция'],
    ['position', 3, 'позиции'],
    ['position', 408, 'позиций'],
    ['product', 21, 'товар'],
    ['product', 35, 'товаров'],
    ['series', 2, 'серии'],
    ['series', 11, 'серий'],
    ['section', 4, 'раздела'],
    ['section', 7, 'разделов'],
    ['project', 9, 'проектов'],
    ['project', 1, 'проект'],
  ])('wordFor(%s, %i) → %s', (word, count, expected) => {
    expect(wordFor(count, word)).toBe(expected);
    expect(plural(count, WORD_FORMS[word])).toBe(expected);
  });

  it('countText — число и слово одной строкой', () => {
    expect(countText(787, 'position')).toBe('787 позиций');
    expect(countText(1, 'section')).toBe('1 раздел');
    expect(countText(0, 'product')).toBe('0 товаров');
  });
});
