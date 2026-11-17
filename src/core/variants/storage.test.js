import { describe, expect, it } from 'vitest';
import { LAST_VARIANT_KEY, readLastVariant, saveLastVariant } from './storage.js';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}

const brokenStorage = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('QuotaExceededError');
  },
};

describe('последний выбранный вариант', () => {
  it('ключ хранения — dvk-variant', () => {
    expect(LAST_VARIANT_KEY).toBe('dvk-variant');
  });

  it('по умолчанию — showroom', () => {
    expect(readLastVariant(memoryStorage())).toBe('showroom');
  });

  it('сохранённый вариант читается обратно', () => {
    const storage = memoryStorage();
    saveLastVariant('blueprint', storage);
    expect(storage.data['dvk-variant']).toBe('blueprint');
    expect(readLastVariant(storage)).toBe('blueprint');
  });

  it('мусор в хранилище → showroom', () => {
    expect(readLastVariant(memoryStorage({ 'dvk-variant': 'nope' }))).toBe('showroom');
  });

  it('неизвестный id не сохраняется', () => {
    const storage = memoryStorage({ 'dvk-variant': 'ral' });
    saveLastVariant('nope', storage);
    expect(storage.data['dvk-variant']).toBe('ral');
  });

  it('недоступное хранилище не роняет приложение', () => {
    expect(() => saveLastVariant('ral', brokenStorage)).not.toThrow();
    expect(readLastVariant(brokenStorage)).toBe('showroom');
    expect(readLastVariant(undefined)).toBe('showroom');
  });
});
