import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { brokenStorage, memoryStorage } from '../../../tests/fixtures/memory-storage.js';

vi.mock('../catalog/data.js', () => import('../../../tests/fixtures/dataset.js'));

import { CITIES, CITY_KEY, DEFAULT_CITY, createCityStore, useCity } from './index.js';

describe('useCity', () => {
  it('по умолчанию Санкт-Петербург, контакты берутся из company.json', () => {
    const store = createCityStore(memoryStorage());
    const { result } = renderHook(() => useCity(store));
    expect(DEFAULT_CITY).toBe('spb');
    expect(CITIES).toEqual(['spb', 'msk']);
    expect(result.current.city).toBe('spb');
    expect(result.current.contacts.label).toBe('Санкт-Петербург');
    expect(result.current.contacts.phones).toEqual(['+7 (812) 000-00-01']);
  });

  it('setCity меняет город и контакты', () => {
    const store = createCityStore(memoryStorage());
    const { result } = renderHook(() => useCity(store));
    act(() => result.current.setCity('msk'));
    expect(result.current.city).toBe('msk');
    expect(result.current.contacts.phones).toEqual(['+7 (495) 000-00-02']);
    expect(result.current.contacts.emails).toEqual(['msk@example.test']);
  });

  it('выбор запоминается в localStorage[dvk-city] и переживает «перезагрузку»', () => {
    const storage = memoryStorage();
    createCityStore(storage).dispatch({ type: 'set', city: 'msk' });
    expect(CITY_KEY).toBe('dvk-city');
    expect(storage.data['dvk-city']).toBe('msk');
    expect(createCityStore(storage).getSnapshot()).toBe('msk');
  });

  it('неизвестный город не принимается ни от вызова, ни из хранилища', () => {
    const store = createCityStore(memoryStorage());
    const { result } = renderHook(() => useCity(store));
    act(() => result.current.setCity('nsk'));
    expect(result.current.city).toBe('spb');
    expect(createCityStore(memoryStorage({ 'dvk-city': 'nsk' })).getSnapshot()).toBe('spb');
  });

  it('localStorage недоступен — выбор живёт в памяти', () => {
    const store = createCityStore(brokenStorage);
    const { result } = renderHook(() => useCity(store));
    expect(() => act(() => result.current.setCity('msk'))).not.toThrow();
    expect(result.current.city).toBe('msk');
  });

  it('шапка и страница контактов видят один и тот же город', () => {
    const store = createCityStore(memoryStorage());
    const header = renderHook(() => useCity(store));
    const page = renderHook(() => useCity(store));
    act(() => header.result.current.setCity('msk'));
    expect(page.result.current.city).toBe('msk');
  });

  describe('общее хранилище по умолчанию (localStorage)', () => {
    afterEach(() => {
      window.localStorage.removeItem('dvk-city');
    });

    it('пишет в localStorage под ключом dvk-city', () => {
      const { result } = renderHook(() => useCity());
      act(() => result.current.setCity('msk'));
      expect(window.localStorage.getItem('dvk-city')).toBe('msk');
      act(() => result.current.setCity('spb'));
    });
  });
});
