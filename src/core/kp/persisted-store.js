// Модульный стор с сохранением в localStorage — общий для КП, города и черновика квиза.
// Работает без провайдера: компоненты подписываются через useSyncExternalStore (см. useStore).
import { useSyncExternalStore } from 'react';

/** localStorage или null: само обращение к нему может бросить (приватный режим, песочница). */
export function getDefaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * @template S
 * @param {{
 *   key: string,
 *   reducer: (state: S, action: any) => S,
 *   initial: () => S,
 *   serialize: (state: S) => string|null,   // null — удалить ключ
 *   deserialize: (raw: string) => S|null,   // null — сохранённое не годится, начать с initial()
 *   storage?: Storage|null,                 // по умолчанию localStorage; null — только память
 *   sync?: boolean,                         // подхватывать изменения из других вкладок
 * }} options
 */
export function createPersistedStore({ key, reducer, initial, serialize, deserialize, storage, sync = false }) {
  const resolveStorage = () => (storage === undefined ? getDefaultStorage() : storage);

  function read() {
    try {
      return resolveStorage()?.getItem(key) ?? null;
    } catch {
      return null; // хранилище недоступно — начинаем с нуля
    }
  }

  function write(state) {
    try {
      const target = resolveStorage();
      if (!target) return;
      const raw = serialize(state);
      if (raw == null) target.removeItem(key);
      else target.setItem(key, raw);
    } catch {
      // квота или запрет записи — состояние остаётся в памяти до перезагрузки
    }
  }

  function load() {
    const raw = read();
    if (raw == null) return initial();
    try {
      return deserialize(raw) ?? initial();
    } catch {
      return initial(); // испорченные данные в хранилище
    }
  }

  let state;
  let ready = false;
  const listeners = new Set();

  const getSnapshot = () => {
    if (!ready) {
      state = load();
      ready = true;
    }
    return state;
  };

  const emit = () => listeners.forEach((listener) => listener());

  const onStorage = (event) => {
    if (event.key !== null && event.key !== key) return;
    state = load();
    ready = true;
    emit();
  };

  return {
    getSnapshot,
    dispatch(action) {
      const previous = getSnapshot();
      const next = reducer(previous, action);
      if (next === previous) return;
      state = next;
      write(next);
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      if (sync && listeners.size === 1 && typeof window !== 'undefined') window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        if (sync && listeners.size === 0 && typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
      };
    },
  };
}

/** Подписка компонента на стор. */
export function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
