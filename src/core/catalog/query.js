// Запрос к каталогу: разбор параметров URL, выписывание обратно, фильтры, поиск, сортировка,
// пагинация и фасеты. Чистые функции над данными из lookup.js.
import { getCategory, getDirection, getIndustry, getProducts, getSection } from './lookup.js';
import { normalizeText, tokenize } from './text.js';

export const PAGE_SIZE = 24;
export const SORTS = ['relevance', 'name', 'price'];
export const LIGHTS = ['warm', 'cold', 'rgb', 'none'];

export const SORT_LABELS = { relevance: 'По релевантности', name: 'По названию', price: 'По цене' };
export const LIGHT_LABELS = { warm: 'Тёплый свет', cold: 'Холодный свет', rgb: 'RGB', none: 'Без подсветки' };
/** Подписи известных материалов; для остальных значений из данных подписью служит само значение. */
export const MATERIAL_LABELS = { metal: 'Металл', glass: 'Стекло', ldsp: 'ЛДСП', wood: 'Дерево', plastic: 'Пластик', stone: 'Камень' };

const MAX_QUERY_LENGTH = 100;
const FACET_KEYS = ['industry', 'material', 'light', 'category'];

export const EMPTY_QUERY = Object.freeze({
  direction: null,
  section: null,
  category: null,
  industry: null,
  material: null,
  light: null,
  q: '',
  sort: 'relevance',
  page: 1,
});

const products = getProducts();
const knownMaterials = new Set(products.flatMap((product) => product.materials ?? []));

/** Предподсчитанные строки для поиска: название, название категории, характеристики. */
const searchIndex = products.map((product, order) => ({
  product,
  order,
  name: normalizeText(product.name),
  category: normalizeText(getCategory(product.categoryId, product.sectionId)?.name ?? getCategory(product.categoryId)?.name),
  specs: normalizeText((product.specs ?? []).map((spec) => `${spec?.label ?? ''} ${spec?.value ?? ''}`).join(' ')),
}));

function toParams(input) {
  try {
    return new URLSearchParams(input ?? '');
  } catch {
    return new URLSearchParams();
  }
}

/**
 * Разбирает параметры маршрута и строку запроса в CatalogQuery.
 * Параметры маршрута главнее строки запроса. Неизвестное и несогласованное (раздел не из этого
 * направления и т. п.) отбрасывается молча; родители категории и раздела достраиваются.
 * @param {Record<string, string|undefined>} [routeParams]
 * @param {URLSearchParams|string|Record<string, string>} [searchParams]
 */
export function parseCatalogParams(routeParams = {}, searchParams = '') {
  const route = routeParams ?? {};
  const search = toParams(searchParams);
  const pick = (key) => {
    const value = route[key] ?? search.get(key);
    return value == null ? '' : String(value);
  };

  const directionValue = pick('direction');
  const sectionValue = pick('section');
  const categoryValue = pick('category');

  let direction = directionValue ? (getDirection(directionValue) ?? null) : null;
  let section = null;
  let category = null;

  const directionBroken = Boolean(directionValue) && !direction;
  if (!directionBroken && sectionValue) section = getSection(direction ? direction.id : null, sectionValue) ?? null;

  const sectionBroken = directionBroken || (Boolean(sectionValue) && !section);
  if (!sectionBroken && categoryValue) {
    const found = getCategory(categoryValue, section?.id);
    if (found && (!direction || found.directionId === direction.id)) category = found;
  }

  if (category && !section) section = getSection(category.directionId, category.sectionId) ?? null;
  if (section && !direction) direction = getDirection(section.directionId) ?? null;

  const material = pick('material').toLowerCase();
  const light = pick('light').toLowerCase();
  const sort = pick('sort');
  const page = pick('page');
  const q = pick('q').replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH).trim();

  return {
    direction: direction?.id ?? null,
    section: section?.id ?? null,
    category: category?.id ?? null,
    industry: getIndustry(pick('industry'))?.id ?? null,
    material: knownMaterials.has(material) ? material : null,
    light: LIGHTS.includes(light) ? light : null,
    q,
    sort: SORTS.includes(sort) ? sort : 'relevance',
    page: /^\d{1,5}$/.test(page) && Number(page) >= 1 ? Number(page) : 1,
  };
}

/**
 * CatalogQuery → URLSearchParams, только непустое. `withPath: false` пропускает направление,
 * раздел и категорию — они живут в пути маршрута.
 * @param {Partial<typeof EMPTY_QUERY>} [query]
 * @param {{ withPath?: boolean }} [options]
 */
export function toSearchParams(query = {}, { withPath = true } = {}) {
  const source = { ...EMPTY_QUERY, ...query };
  const params = new URLSearchParams();
  const set = (key, value) => {
    if (value != null && value !== '') params.set(key, String(value));
  };
  if (withPath) {
    const direction = getDirection(source.direction);
    set('direction', direction?.slug ?? source.direction);
    const section = getSection(direction?.id ?? null, source.section);
    set('section', section?.slug ?? source.section);
    const category = getCategory(source.category, section?.id);
    set('category', category?.slug ?? source.category);
  }
  set('industry', getIndustry(source.industry)?.slug ?? source.industry);
  set('material', source.material);
  set('light', source.light);
  set('q', source.q);
  if (source.sort && source.sort !== 'relevance') set('sort', source.sort);
  if (Number(source.page) > 1) set('page', source.page);
  return params;
}

/** Путь страницы каталога для запроса: /<вариант>/catalog/<направление>/<раздел>/<категория>?<остальное>. */
export function buildCatalogUrl(variantId, query = {}) {
  const source = { ...EMPTY_QUERY, ...query };
  const segments = variantId ? [variantId, 'catalog'] : ['catalog'];
  const direction = getDirection(source.direction);
  if (direction) {
    segments.push(direction.slug);
    const section = getSection(direction.id, source.section);
    if (section) {
      segments.push(section.slug);
      const category = getCategory(source.category, section.id);
      if (category) segments.push(category.slug);
    }
  }
  const search = toSearchParams(source, { withPath: false }).toString();
  return `/${segments.map(encodeURIComponent).join('/')}${search ? `?${search}` : ''}`;
}

/**
 * Запрос с одним изменённым фильтром; результат всегда согласован и проходит через разбор.
 * Любое изменение, кроме `page`, возвращает на первую страницу.
 */
export function applyFilter(query, key, value) {
  const next = { ...EMPTY_QUERY, ...query };
  const empty = value == null || value === '';
  switch (key) {
    case 'direction':
      next.direction = empty ? null : value;
      next.section = null;
      next.category = null;
      break;
    case 'section': {
      next.section = empty ? null : value;
      next.category = null;
      const section = empty ? undefined : getSection(null, value);
      if (section) next.direction = section.directionId;
      break;
    }
    case 'category': {
      next.category = empty ? null : value;
      const category = empty ? undefined : getCategory(value);
      if (category) {
        next.section = category.sectionId;
        next.direction = category.directionId;
      }
      break;
    }
    case 'industry':
    case 'material':
    case 'light':
      next[key] = empty ? null : value;
      break;
    case 'q':
      next.q = empty ? '' : String(value);
      break;
    case 'sort':
      next.sort = empty ? 'relevance' : value;
      break;
    case 'page':
      next.page = empty ? 1 : value;
      break;
    default:
      break;
  }
  if (key !== 'page') next.page = 1;
  return parseCatalogParams({}, toSearchParams(next));
}

function normalizeInput(input) {
  const source = input ?? {};
  const page = Number(source.page);
  return {
    direction: source.direction || null,
    section: source.section || null,
    category: source.category || null,
    industry: source.industry || null,
    material: source.material || null,
    light: source.light || null,
    q: String(source.q ?? ''),
    sort: SORTS.includes(source.sort) ? source.sort : 'relevance',
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** Насколько запрос подходит товару: слово в начале слова названия — 10, в названии — 6, в категории — 3, в характеристиках — 1. */
function relevance(entry, tokens) {
  let score = 0;
  for (const token of tokens) {
    const at = entry.name.indexOf(token);
    if (at === 0 || (at > 0 && !/[\p{L}\p{N}]/u.test(entry.name[at - 1]))) score += 10;
    else if (at > 0) score += 6;
    else if (entry.category.includes(token)) score += 3;
    else score += 1;
  }
  return score;
}

const compareNames = (a, b) => a.product.name.localeCompare(b.product.name, 'ru', { numeric: true, sensitivity: 'base' });
const priceOf = (entry) => (typeof entry.product.price === 'number' ? entry.product.price : Infinity);

const facetLabel = {
  industry: (value) => getIndustry(value)?.name ?? value,
  material: (value) => MATERIAL_LABELS[value] ?? value,
  light: (value) => LIGHT_LABELS[value] ?? value,
  category: (value) => getCategory(value)?.name ?? value,
};

function buildFacet(key, counts, selected) {
  const entries = [...counts].map(([value, count]) => ({ value, label: facetLabel[key](value), count }));
  if (selected && !counts.has(selected)) entries.push({ value: selected, label: facetLabel[key](selected), count: 0 });
  if (key === 'light') return entries.sort((a, b) => LIGHTS.indexOf(a.value) - LIGHTS.indexOf(b.value));
  return entries.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'));
}

/**
 * Фильтры, поиск, сортировка, страница и фасеты.
 * Фасет считается по товарам, прошедшим все фильтры, кроме собственного, — так видно, что даст переключение.
 * В фасете только значения с товарами плюс выбранное значение (даже при нуле).
 * `pages` не меньше 1; `page` прижимается к последней странице.
 * @param {Partial<typeof EMPTY_QUERY>} [input]
 */
export function queryProducts(input) {
  const query = normalizeInput(input);
  const tokens = tokenize(query.q);
  const matched = [];
  const counts = Object.fromEntries(FACET_KEYS.map((key) => [key, new Map()]));
  const bump = (key, value) => {
    if (value == null || value === '') return;
    counts[key].set(value, (counts[key].get(value) ?? 0) + 1);
  };

  for (const entry of searchIndex) {
    const { product } = entry;
    const failed = [];
    if (tokens.length && !tokens.every((token) => entry.name.includes(token) || entry.category.includes(token) || entry.specs.includes(token))) failed.push('q');
    if (query.direction && product.direction !== query.direction) failed.push('direction');
    if (query.section && product.sectionId !== query.section) failed.push('section');
    if (query.category && product.categoryId !== query.category) failed.push('category');
    if (query.industry && !(product.industries ?? []).includes(query.industry)) failed.push('industry');
    if (query.material && !(product.materials ?? []).includes(query.material)) failed.push('material');
    if (query.light && product.lighting !== query.light) failed.push('light');
    if (failed.length > 1) continue;
    if (failed.length === 1 && !FACET_KEYS.includes(failed[0])) continue;

    const forFacet = (key) => failed.length === 0 || failed[0] === key;
    if (forFacet('industry')) (product.industries ?? []).forEach((value) => bump('industry', value));
    if (forFacet('material')) (product.materials ?? []).forEach((value) => bump('material', value));
    if (forFacet('light')) bump('light', product.lighting);
    if (forFacet('category')) bump('category', product.categoryId);
    if (failed.length === 0) matched.push(entry);
  }

  if (query.sort === 'name') matched.sort((a, b) => compareNames(a, b) || a.order - b.order);
  else if (query.sort === 'price') matched.sort((a, b) => priceOf(a) - priceOf(b) || a.order - b.order);
  else if (tokens.length) {
    const scores = new Map(matched.map((entry) => [entry, relevance(entry, tokens)]));
    matched.sort((a, b) => scores.get(b) - scores.get(a) || a.order - b.order);
  }

  const total = matched.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, pages);
  const items = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((entry) => entry.product);

  const facets = Object.fromEntries(FACET_KEYS.map((key) => [key, buildFacet(key, counts[key], query[key])]));
  return { items, total, page, pages, facets };
}
