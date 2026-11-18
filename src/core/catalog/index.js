// Ядро каталога: справочники (дерево, отрасли, товары, проекты, компания) и запрос к товарам.
// Страницы и варианты читают данные только отсюда, а не из src/data/*.json.
export { LIGHT_LABELS, MATERIAL_LABELS, UNKNOWN, lightLabel, materialLabel } from './labels.js';
export {
  getCategory,
  getCompany,
  getCycleStep,
  getDirection,
  getDirectionTotal,
  getDirections,
  getFactText,
  getIndustries,
  getIndustry,
  getProduct,
  getProductById,
  getProject,
  getProjects,
  getSection,
  getSimilar,
} from './lookup.js';
export {
  EMPTY_QUERY,
  LIGHTS,
  PAGE_SIZE,
  SORTS,
  SORT_LABELS,
  applyFilter,
  buildCatalogUrl,
  parseCatalogParams,
  queryProducts,
  toSearchParams,
} from './query.js';
export { useCatalogQuery } from './useCatalogQuery.js';
export { normalizeText } from './text.js';
