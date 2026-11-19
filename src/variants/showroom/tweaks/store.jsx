// Твики главной «Шоурума»: какое фото стоит в hero, в плитке «Торговое оборудование» и в отраслях.
// Выбор живёт в браузере (localStorage) — это инструмент отбора фото, а не настройка сайта для посетителя.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { TWEAK_DEFAULTS, sanitizeTweaks } from './photos.js';

export const TWEAKS_STORAGE_KEY = 'dvk-showroom-tweaks';

function readStored() {
  try {
    const text = window.localStorage.getItem(TWEAKS_STORAGE_KEY);
    return sanitizeTweaks(text ? JSON.parse(text) : null);
  } catch {
    return { ...TWEAK_DEFAULTS }; // приватное окно, запрет хранилища, битая запись
  }
}

function writeStored(values) {
  try {
    window.localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(values));
  } catch {
    // хранилище недоступно — выбор живёт до перезагрузки
  }
}

const TweaksContext = createContext(null);
const NO_PROVIDER = Object.freeze({ values: TWEAK_DEFAULTS, set: () => {}, reset: () => {}, isDefault: true });

export function TweaksProvider({ children }) {
  const [values, setValues] = useState(readStored);
  const set = useCallback((key, value) => {
    setValues((current) => {
      const next = sanitizeTweaks({ ...current, [key]: value });
      writeStored(next);
      return next;
    });
  }, []);
  const reset = useCallback(() => {
    const next = { ...TWEAK_DEFAULTS };
    writeStored(next);
    setValues(next);
  }, []);
  const api = useMemo(() => {
    const isDefault = Object.keys(TWEAK_DEFAULTS).every((key) => values[key] === TWEAK_DEFAULTS[key]);
    return { values, set, reset, isDefault };
  }, [values, set, reset]);
  return <TweaksContext.Provider value={api}>{children}</TweaksContext.Provider>;
}

/** Значения твиков. Вне провайдера — значения по умолчанию, без записи. */
export function useTweaks() {
  return useContext(TweaksContext) ?? NO_PROVIDER;
}
