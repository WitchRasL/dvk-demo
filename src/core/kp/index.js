// Запрос КП вместо корзины: подборка товаров в localStorage['dvk-kp-v1'], без провайдера.
import { useMemo } from 'react';
import { getProductById } from '../catalog/index.js';
import { createPersistedStore, useStore } from './persisted-store.js';

export const KP_KEY = 'dvk-kp-v1';
export const MAX_QTY = 9999;

function clampQty(value) {
  const qty = Math.floor(Number(value));
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_QTY, Math.max(1, qty));
}

/**
 * Чистый редьюсер. Состояние — массив { id, qty } в порядке добавления.
 * Действия: { type: 'add', id, qty = 1 } (повтор прибавляет), { type: 'remove', id },
 * { type: 'setQty', id, qty }, { type: 'clear' }. Количество — целое от 1 до 9999.
 * Действие, ничего не меняющее, возвращает то же состояние.
 */
export function kpReducer(state = [], action = {}) {
  const id = action.id == null ? '' : String(action.id);
  switch (action.type) {
    case 'add': {
      if (!id) return state;
      const qty = clampQty(action.qty ?? 1);
      if (!state.some((item) => item.id === id)) return [...state, { id, qty }];
      return state.map((item) => (item.id === id ? { id, qty: clampQty(item.qty + qty) } : item));
    }
    case 'setQty': {
      if (!state.some((item) => item.id === id)) return state;
      return state.map((item) => (item.id === id ? { id, qty: clampQty(action.qty) } : item));
    }
    case 'remove':
      return state.some((item) => item.id === id) ? state.filter((item) => item.id !== id) : state;
    case 'clear':
      return state.length ? [] : state;
    default:
      return state;
  }
}

/** Сохранённое → массив { id, qty }: целые записи остаются, остальное и дубли отбрасываются. */
function deserialize(raw) {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return null;
  const seen = new Set();
  const state = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || !entry.id || seen.has(entry.id)) continue;
    seen.add(entry.id);
    state.push({ id: entry.id, qty: clampQty(entry.qty) });
  }
  return state;
}

/** Стор подборки. `storage`: Storage | null (только память); без аргумента — localStorage. */
export function createKpStore(storage) {
  return createPersistedStore({
    key: KP_KEY,
    reducer: kpReducer,
    initial: () => [],
    serialize: (state) => (state.length ? JSON.stringify(state) : null),
    deserialize,
    storage,
    sync: true,
  });
}

const defaultStore = createKpStore();

/** Позиции КП → строки заявки { id, name, qty, sourceUrl }; товар пропал из данных — вместо названия id. */
export function kpItemsToPayload(items) {
  return items.map(({ id, qty, product }) => ({
    id,
    name: product?.name ?? id,
    qty,
    sourceUrl: product?.sourceUrl ?? null,
  }));
}

/**
 * @param {ReturnType<typeof createKpStore>} [store] — только для тестов
 * @returns {{ items: { id: string, qty: number, product: object|null }[], count: number, totalQty: number,
 *   add(id: string, qty?: number): void, remove(id: string): void, setQty(id: string, qty: number): void,
 *   clear(): void, has(id: string): boolean }}
 *   count — число позиций (для счётчика в шапке), totalQty — сумма количеств.
 */
export function useKp(store = defaultStore) {
  const state = useStore(store);
  return useMemo(() => {
    const items = state.map(({ id, qty }) => ({ id, qty, product: getProductById(id) ?? null }));
    const ids = new Set(state.map((item) => item.id));
    return {
      items,
      count: items.length,
      totalQty: items.reduce((sum, item) => sum + item.qty, 0),
      add: (id, qty = 1) => store.dispatch({ type: 'add', id, qty }),
      remove: (id) => store.dispatch({ type: 'remove', id }),
      setQty: (id, qty) => store.dispatch({ type: 'setQty', id, qty }),
      clear: () => store.dispatch({ type: 'clear' }),
      has: (id) => ids.has(String(id)),
    };
  }, [state, store]);
}
