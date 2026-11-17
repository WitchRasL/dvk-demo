import { createContext, use, useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import * as baseUi from '../ui/base.jsx';
import { DEFAULT_VARIANT, getVariant } from './registry.js';
import { swapVariantInPath } from './paths.js';
import { saveLastVariant } from './storage.js';

const VariantContext = createContext(null);

// Один промис на вариант: повторный заход в вариант не грузит модуль заново,
// а React `use()` читает уже выполненный промис синхронно.
const modulePromises = new Map();

/** @param {string} id @returns {Promise<object>} default export модуля варианта */
export function loadVariantModule(id) {
  const entry = getVariant(id) ?? getVariant(DEFAULT_VARIANT);
  let promise = modulePromises.get(entry.id);
  if (!promise) {
    promise = entry.load().then((mod) => mod.default);
    promise.catch(() => modulePromises.delete(entry.id)); // после сбоя сети — повторить при следующем заходе
    modulePromises.set(entry.id, promise);
  }
  return promise;
}

/**
 * Грузит модуль варианта (приостанавливает рендер до загрузки — нужен <Suspense> выше)
 * и отдаёт { id, meta, module, ui } через useVariant().
 */
export function VariantProvider({ id, children }) {
  const meta = getVariant(id) ?? getVariant(DEFAULT_VARIANT);
  const module = use(loadVariantModule(meta.id));

  const value = useMemo(
    () => ({ id: meta.id, meta, module, ui: { ...baseUi, ...(module.ui ?? {}) } }),
    [meta, module],
  );

  useEffect(() => {
    saveLastVariant(meta.id);
  }, [meta.id]);

  return <VariantContext value={value}>{children}</VariantContext>;
}

/** @returns {{ id: string, meta: object, module: object, ui: object }} */
export function useVariant() {
  const value = useContext(VariantContext);
  if (!value) throw new Error('useVariant() вызван вне <VariantProvider>');
  return value;
}

/** @returns {(nextId: string) => void} переход на ту же страницу и query в другом варианте */
export function useSwitchVariant() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  return useCallback((nextId) => navigate(swapVariantInPath(pathname, search, nextId)), [navigate, pathname, search]);
}
