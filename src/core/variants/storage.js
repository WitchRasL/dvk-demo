// Последний выбранный вариант: localStorage['dvk-variant'], любая ошибка хранилища — молча.
import { DEFAULT_VARIANT, isVariantId } from './registry.js';

export const LAST_VARIANT_KEY = 'dvk-variant';

function defaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined; // доступ к localStorage сам по себе может бросить (приватный режим, песочница)
  }
}

/** @param {Storage} [storage] @returns {string} id варианта, по умолчанию DEFAULT_VARIANT */
export function readLastVariant(storage = defaultStorage()) {
  try {
    const value = storage?.getItem(LAST_VARIANT_KEY);
    return isVariantId(value) ? value : DEFAULT_VARIANT;
  } catch {
    return DEFAULT_VARIANT;
  }
}

/** @param {string} id @param {Storage} [storage] */
export function saveLastVariant(id, storage = defaultStorage()) {
  if (!isVariantId(id)) return;
  try {
    storage?.setItem(LAST_VARIANT_KEY, id);
  } catch {
    // хранилище недоступно — выбор живёт до перезагрузки, этого достаточно
  }
}
