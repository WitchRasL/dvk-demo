// Справочники каталога: деревья направлений, отрасли, товары, проекты, компания.
// Индексы строятся один раз при загрузке модуля; сами данные приходят из data.js.
import { categories, company, products, projects } from './data.js';
import { UNKNOWN } from './labels.js';

/** Дерево с обратными ссылками: у раздела есть directionId, у категории — sectionId и directionId. */
const directions = (categories?.directions ?? []).map((direction) => ({
  ...direction,
  sections: (direction.sections ?? []).map((section) => ({
    ...section,
    directionId: direction.id,
    categories: (section.categories ?? []).map((category) => ({
      ...category,
      sectionId: section.id,
      directionId: direction.id,
    })),
  })),
}));

const industries = categories?.industries ?? [];

/** Находит по id, а если такого нет — по slug. */
function findByIdOrSlug(list, value) {
  if (value == null || value === '') return undefined;
  const key = String(value);
  return list.find((item) => item.id === key) ?? list.find((item) => item.slug === key);
}

const allSections = directions.flatMap((direction) => direction.sections);
const allCategories = allSections.flatMap((section) => section.categories);

export function getDirections() {
  return directions;
}

export function getDirection(id) {
  return findByIdOrSlug(directions, id);
}

/** Раздел внутри направления; без направления — первый подходящий во всём дереве. */
export function getSection(directionId, sectionId) {
  if (directionId == null) return findByIdOrSlug(allSections, sectionId);
  const direction = getDirection(directionId);
  return direction ? findByIdOrSlug(direction.sections, sectionId) : undefined;
}

/** Категория с directionId и sectionId родителей; sectionId (необязательно) сужает поиск одним разделом. */
export function getCategory(id, sectionId) {
  if (sectionId != null) {
    const section = findByIdOrSlug(allSections, sectionId);
    return section ? findByIdOrSlug(section.categories, id) : undefined;
  }
  return findByIdOrSlug(allCategories, id);
}

/** Итог позиций направления на dvk-style.ru: сумма `count` его разделов. Принимает id, slug или сам объект. */
export function getDirectionTotal(direction) {
  const source = direction && typeof direction === 'object' ? direction : getDirection(direction);
  return (source?.sections ?? []).reduce((sum, section) => sum + (Number(section?.count) || 0), 0);
}

export function getIndustries() {
  return industries;
}

export function getIndustry(slug) {
  return findByIdOrSlug(industries, slug);
}

const productList = Array.isArray(products) ? products : [];
const productBySlug = new Map(productList.map((product) => [product.slug, product]));
const productById = new Map(productList.map((product) => [String(product.id), product]));

export function getProducts() {
  return productList;
}

export function getProduct(slug) {
  return productBySlug.get(String(slug));
}

export function getProductById(id) {
  return productById.get(String(id));
}

const overlap = (a = [], b = []) => a.filter((item) => b.includes(item)).length;

/** Похожие: та же категория, затем тот же раздел, затем направление; отрасли и материалы — к весу. */
export function getSimilar(product, n = 4) {
  if (!product) return [];
  const scored = [];
  productList.forEach((candidate, index) => {
    if (candidate.id === product.id) return;
    let score = 0;
    if (candidate.direction === product.direction) score += 10;
    if (candidate.sectionId === product.sectionId) score += 40;
    if (candidate.categoryId && candidate.categoryId === product.categoryId) score += 100;
    score += overlap(candidate.industries, product.industries) * 3;
    score += overlap(candidate.materials, product.materials);
    // без общего направления, раздела или категории товар не «похож»
    const related = candidate.direction === product.direction || candidate.sectionId === product.sectionId;
    if (related && score > 0) scored.push({ candidate, score, index });
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, Math.max(0, n)).map((entry) => entry.candidate);
}

const projectList = Array.isArray(projects) ? projects : [];

export function getProjects({ direction } = {}) {
  return direction ? projectList.filter((project) => project.direction === direction) : projectList;
}

export function getProject(slug) {
  return projectList.find((project) => project.slug === slug);
}

export function getCompany() {
  return company;
}

/** Текст факта о компании (`company.facts`) по id; факта нет — видимая заглушка «[уточнить]». */
export function getFactText(id) {
  return company?.facts?.find((item) => item.id === id)?.text ?? UNKNOWN;
}

/** Шаг полного цикла (`company.cycle`) по id или undefined. */
export function getCycleStep(id) {
  return company?.cycle?.find((item) => item.id === id);
}
