import { describe, expect, it } from 'vitest';
import { variantForKey } from './keyboard.js';

const onPage = { tagName: 'DIV', isContentEditable: false };

describe('variantForKey', () => {
  it('1/2/3 вне полей ввода дают «Шоурум», «Палитру RAL», «Чертёж»', () => {
    expect(variantForKey({ key: '1', target: onPage })).toBe('showroom');
    expect(variantForKey({ key: '2', target: onPage })).toBe('ral');
    expect(variantForKey({ key: '3', target: onPage })).toBe('blueprint');
  });

  it('другие клавиши ничего не переключают', () => {
    expect(variantForKey({ key: '4', target: onPage })).toBeNull();
    expect(variantForKey({ key: 'a', target: onPage })).toBeNull();
    expect(variantForKey({ key: 'Enter', target: onPage })).toBeNull();
  });

  it('в полях ввода цифры остаются цифрами', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) {
      expect(variantForKey({ key: '2', target: { tagName } })).toBeNull();
    }
    expect(variantForKey({ key: '2', target: { tagName: 'DIV', isContentEditable: true } })).toBeNull();
  });

  it('с модификаторами, автоповтором или уже обработанное событие — не переключает', () => {
    expect(variantForKey({ key: '2', ctrlKey: true, target: onPage })).toBeNull();
    expect(variantForKey({ key: '2', metaKey: true, target: onPage })).toBeNull();
    expect(variantForKey({ key: '2', altKey: true, target: onPage })).toBeNull();
    expect(variantForKey({ key: '2', repeat: true, target: onPage })).toBeNull();
    expect(variantForKey({ key: '2', defaultPrevented: true, target: onPage })).toBeNull();
  });

  it('событие без цели (на документе) тоже работает', () => {
    expect(variantForKey({ key: '3', target: null })).toBe('blueprint');
  });
});
