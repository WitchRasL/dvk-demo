import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { brokenStorage, memoryStorage } from '../../../tests/fixtures/memory-storage.js';

vi.mock('../catalog/data.js', () => import('../../../tests/fixtures/dataset.js'));

import { KP_KEY, createKpStore, kpItemsToPayload, kpReducer, useKp } from './index.js';

describe('kpReducer', () => {
  it('add кладёт товар с количеством 1 по умолчанию и с заданным количеством', () => {
    expect(kpReducer([], { type: 'add', id: 'p01' })).toEqual([{ id: 'p01', qty: 1 }]);
    expect(kpReducer([], { type: 'add', id: 'p01', qty: 3 })).toEqual([{ id: 'p01', qty: 3 }]);
  });

  it('повторный add того же товара прибавляет количество', () => {
    const state = kpReducer([{ id: 'p01', qty: 1 }], { type: 'add', id: 'p01', qty: 2 });
    expect(state).toEqual([{ id: 'p01', qty: 3 }]);
  });

  it('количество всегда целое от 1 до 9999', () => {
    expect(kpReducer([], { type: 'add', id: 'a', qty: 0 })).toEqual([{ id: 'a', qty: 1 }]);
    expect(kpReducer([], { type: 'add', id: 'a', qty: -5 })).toEqual([{ id: 'a', qty: 1 }]);
    expect(kpReducer([], { type: 'add', id: 'a', qty: 2.7 })).toEqual([{ id: 'a', qty: 2 }]);
    expect(kpReducer([], { type: 'add', id: 'a', qty: 'много' })).toEqual([{ id: 'a', qty: 1 }]);
    expect(kpReducer([], { type: 'add', id: 'a', qty: 100000 })).toEqual([{ id: 'a', qty: 9999 }]);
  });

  it('setQty меняет количество, но не опускает его ниже 1', () => {
    const state = [{ id: 'p01', qty: 2 }];
    expect(kpReducer(state, { type: 'setQty', id: 'p01', qty: 5 })).toEqual([{ id: 'p01', qty: 5 }]);
    expect(kpReducer(state, { type: 'setQty', id: 'p01', qty: 0 })).toEqual([{ id: 'p01', qty: 1 }]);
  });

  it('remove убирает позицию, clear — все', () => {
    const state = [
      { id: 'p01', qty: 1 },
      { id: 'p02', qty: 4 },
    ];
    expect(kpReducer(state, { type: 'remove', id: 'p01' })).toEqual([{ id: 'p02', qty: 4 }]);
    expect(kpReducer(state, { type: 'clear' })).toEqual([]);
  });

  it('действия с неизвестным товаром, пустым id и чужим типом не меняют состояние', () => {
    const state = Object.freeze([Object.freeze({ id: 'p01', qty: 1 })]);
    expect(kpReducer(state, { type: 'remove', id: 'nope' })).toBe(state);
    expect(kpReducer(state, { type: 'setQty', id: 'nope', qty: 3 })).toBe(state);
    expect(kpReducer(state, { type: 'add', id: '' })).toBe(state);
    expect(kpReducer(state, { type: 'something-else' })).toBe(state);
  });

  it('не изменяет прежнее состояние', () => {
    const state = Object.freeze([Object.freeze({ id: 'p01', qty: 1 })]);
    expect(() => kpReducer(state, { type: 'add', id: 'p01' })).not.toThrow();
    expect(state).toEqual([{ id: 'p01', qty: 1 }]);
  });
});

describe('хранилище КП', () => {
  it('ключ хранения — dvk-kp-v1, состояние переживает «перезагрузку»', () => {
    const storage = memoryStorage();
    const first = createKpStore(storage);
    first.dispatch({ type: 'add', id: 'p01', qty: 2 });
    first.dispatch({ type: 'add', id: 'p02' });
    expect(KP_KEY).toBe('dvk-kp-v1');
    expect(JSON.parse(storage.data['dvk-kp-v1'])).toEqual([
      { id: 'p01', qty: 2 },
      { id: 'p02', qty: 1 },
    ]);
    const reloaded = createKpStore(storage);
    expect(reloaded.getSnapshot()).toEqual([
      { id: 'p01', qty: 2 },
      { id: 'p02', qty: 1 },
    ]);
  });

  it('после clear в хранилище ничего не остаётся', () => {
    const storage = memoryStorage();
    const store = createKpStore(storage);
    store.dispatch({ type: 'add', id: 'p01' });
    store.dispatch({ type: 'clear' });
    expect(storage.getItem('dvk-kp-v1')).toBeNull();
  });

  it('мусор в хранилище не ломает: целые записи сохраняются, остальное отбрасывается', () => {
    expect(createKpStore(memoryStorage({ 'dvk-kp-v1': 'не json' })).getSnapshot()).toEqual([]);
    expect(createKpStore(memoryStorage({ 'dvk-kp-v1': '{"a":1}' })).getSnapshot()).toEqual([]);
    const mixed = JSON.stringify([{ id: 'p01', qty: 2 }, { nope: 1 }, { id: 'p02', qty: 0 }, { id: 'p01', qty: 5 }, 7, null]);
    expect(createKpStore(memoryStorage({ 'dvk-kp-v1': mixed })).getSnapshot()).toEqual([
      { id: 'p01', qty: 2 },
      { id: 'p02', qty: 1 },
    ]);
  });

  it('localStorage недоступен или падает — подборка живёт в памяти', () => {
    for (const storage of [brokenStorage, null]) {
      const store = createKpStore(storage);
      expect(() => store.dispatch({ type: 'add', id: 'p01', qty: 2 })).not.toThrow();
      expect(store.getSnapshot()).toEqual([{ id: 'p01', qty: 2 }]);
      store.dispatch({ type: 'remove', id: 'p01' });
      expect(store.getSnapshot()).toEqual([]);
    }
  });

  it('подписчик узнаёт об изменении, отписанный — нет', () => {
    const store = createKpStore(memoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.dispatch({ type: 'add', id: 'p01' });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.dispatch({ type: 'add', id: 'p02' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('изменение из другой вкладки (событие storage) подхватывается', () => {
    const storage = memoryStorage();
    const store = createKpStore(storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    storage.setItem('dvk-kp-v1', JSON.stringify([{ id: 'p09', qty: 3 }]));
    window.dispatchEvent(new StorageEvent('storage', { key: 'dvk-kp-v1' }));
    expect(store.getSnapshot()).toEqual([{ id: 'p09', qty: 3 }]);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});

describe('kpItemsToPayload', () => {
  it('отдаёт id, название, количество и ссылку на сайт; без товара — id вместо названия', () => {
    const items = [
      { id: 'p01', qty: 2, product: { name: 'Витрина узкая торговая', sourceUrl: 'https://example.test/vitrina-uzkaya' } },
      { id: 'gone', qty: 1, product: null },
    ];
    expect(kpItemsToPayload(items)).toEqual([
      { id: 'p01', name: 'Витрина узкая торговая', qty: 2, sourceUrl: 'https://example.test/vitrina-uzkaya' },
      { id: 'gone', name: 'gone', qty: 1, sourceUrl: null },
    ]);
  });
});

describe('useKp', () => {
  it('отдаёт позиции с товаром из каталога, счётчики и has', () => {
    const store = createKpStore(memoryStorage());
    const { result } = renderHook(() => useKp(store));
    expect(result.current.count).toBe(0);
    act(() => result.current.add('p01', 2));
    act(() => result.current.add('p02'));
    expect(result.current.items.map((item) => [item.id, item.qty, item.product?.name])).toEqual([
      ['p01', 2, 'Витрина узкая торговая'],
      ['p02', 1, 'Витрина угловая'],
    ]);
    expect(result.current.count).toBe(2);
    expect(result.current.totalQty).toBe(3);
    expect(result.current.has('p01')).toBe(true);
    expect(result.current.has('p99')).toBe(false);
  });

  it('setQty, remove и clear', () => {
    const store = createKpStore(memoryStorage());
    const { result } = renderHook(() => useKp(store));
    act(() => result.current.add('p01'));
    act(() => result.current.setQty('p01', 4));
    expect(result.current.items[0].qty).toBe(4);
    act(() => result.current.setQty('p01', 0));
    expect(result.current.items[0].qty).toBe(1);
    act(() => result.current.remove('p01'));
    expect(result.current.count).toBe(0);
    act(() => result.current.add('p02'));
    act(() => result.current.clear());
    expect(result.current.items).toEqual([]);
  });

  it('товар, исчезнувший из данных, отдаётся с product: null', () => {
    const storage = memoryStorage({ 'dvk-kp-v1': JSON.stringify([{ id: 'ушёл-из-каталога', qty: 2 }]) });
    const store = createKpStore(storage);
    const { result } = renderHook(() => useKp(store));
    expect(result.current.items).toEqual([{ id: 'ушёл-из-каталога', qty: 2, product: null }]);
  });

  it('несколько компонентов видят одну подборку', () => {
    const store = createKpStore(memoryStorage());
    const header = renderHook(() => useKp(store));
    const page = renderHook(() => useKp(store));
    act(() => page.result.current.add('p03'));
    expect(header.result.current.count).toBe(1);
    expect(header.result.current.has('p03')).toBe(true);
  });

  describe('общее хранилище по умолчанию (localStorage)', () => {
    afterEach(() => {
      const { result } = renderHook(() => useKp());
      act(() => result.current.clear());
    });

    it('пишет в localStorage под ключом dvk-kp-v1', () => {
      const { result } = renderHook(() => useKp());
      act(() => result.current.add('p05', 3));
      expect(JSON.parse(window.localStorage.getItem('dvk-kp-v1'))).toEqual([{ id: 'p05', qty: 3 }]);
    });
  });
});
