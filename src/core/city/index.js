// Город (СПб / Москва): выбор в localStorage['dvk-city'], контакты — из company.json. Без провайдера.
import { useMemo } from 'react';
import { getCompany } from '../catalog/index.js';
import { createPersistedStore, useStore } from '../kp/persisted-store.js';

export const CITIES = ['spb', 'msk'];
export const DEFAULT_CITY = 'spb';
export const CITY_KEY = 'dvk-city';

/** Действие: { type: 'set', city }; неизвестный город игнорируется. В хранилище лежит сам id ('spb' | 'msk'). */
function cityReducer(state, action) {
  return action?.type === 'set' && CITIES.includes(action.city) ? action.city : state;
}

/** @param {Storage|null} [storage] — по умолчанию localStorage; null — только память */
export function createCityStore(storage) {
  return createPersistedStore({
    key: CITY_KEY,
    reducer: cityReducer,
    initial: () => DEFAULT_CITY,
    serialize: (state) => state,
    deserialize: (raw) => (CITIES.includes(raw) ? raw : null),
    storage,
    sync: true,
  });
}

const defaultStore = createCityStore();

/**
 * @param {ReturnType<typeof createCityStore>} [store] — только для тестов
 * @returns {{ city: 'spb'|'msk', setCity: (city: string) => void, contacts: object|null }}
 *   contacts — company.cities[city]: { label, address, phones, emails, hours, mapUrl }
 */
export function useCity(store = defaultStore) {
  const city = useStore(store);
  return useMemo(
    () => ({
      city,
      setCity: (next) => store.dispatch({ type: 'set', city: next }),
      contacts: getCompany().cities?.[city] ?? null,
    }),
    [city, store],
  );
}
