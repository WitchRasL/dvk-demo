// Хук страницы каталога: фильтры живут в URL, результат считается из них.
import { useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { EMPTY_QUERY, applyFilter, buildCatalogUrl, parseCatalogParams, queryProducts } from './query.js';

/**
 * Маршрут: /:variant/catalog/:direction?/:section?/:category? + строка запроса.
 * @returns {{
 *   query: ReturnType<typeof parseCatalogParams>,
 *   result: ReturnType<typeof queryProducts>,
 *   setFilter: (key: string, value: string|number|null) => void,
 *   reset: (options?: { all?: boolean }) => void,
 * }}
 *   setFilter: direction/section/category меняют путь, остальное — строку запроса; поиск (`q`) заменяет запись
 *   в истории, чтобы набор текста не засорял «Назад». reset очищает фильтры строки запроса и остаётся
 *   в текущем направлении/разделе/категории; `{ all: true }` возвращает весь каталог.
 */
export function useCatalogQuery() {
  const { variant, direction, section, category } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const search = searchParams.toString();

  const query = useMemo(
    () => parseCatalogParams({ direction, section, category }, search),
    [direction, section, category, search],
  );
  const result = useMemo(() => queryProducts(query), [query]);

  const setFilter = useCallback(
    (key, value) => {
      const next = applyFilter(query, key, value);
      navigate(buildCatalogUrl(variant, next), { replace: key === 'q' });
    },
    [navigate, query, variant],
  );

  const reset = useCallback(
    ({ all = false } = {}) => {
      const scope = all ? EMPTY_QUERY : { ...EMPTY_QUERY, direction: query.direction, section: query.section, category: query.category };
      navigate(buildCatalogUrl(variant, scope));
    },
    [navigate, query, variant],
  );

  return { query, result, setFilter, reset };
}
