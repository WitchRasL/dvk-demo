// Навигация вариантов: пункты верхнего уровня и мега-меню «Каталог» по направлениям.
// Данные дерева — из ядра каталога; число у раздела — число товаров на dvk-style.ru (categories.json).
import { useMemo } from 'react';
import { getDirections, getIndustries } from '../catalog/index.js';
import { useVariant } from '../variants/VariantContext.jsx';

const DEFAULT_INDUSTRY = 'pharmacy';

/**
 * @param {string} variantId
 * @returns {{
 *   items: { id: string, label: string, to: string, children?: { id: string, label: string, to: string }[] }[],
 *   directions: { id: string, name: string, to: string, summary: string,
 *     sections: { id: string, name: string, to: string, count: number }[] }[],
 * }}
 */
export function buildNav(variantId) {
  const base = `/${variantId}`;
  const directions = getDirections().map((direction) => ({
    id: direction.id,
    name: direction.name,
    to: `${base}/catalog/${direction.slug}`,
    summary: direction.summary ?? '',
    sections: direction.sections.map((section) => ({
      id: section.id,
      name: section.name,
      to: `${base}/catalog/${direction.slug}/${section.slug}`,
      count: section.count,
    })),
  }));

  const industries = getIndustries().map((industry) => ({
    id: industry.id,
    label: industry.name,
    to: `${base}/solutions/${industry.slug}`,
  }));
  const firstIndustry = industries.find((industry) => industry.id === DEFAULT_INDUSTRY) ?? industries[0];

  return {
    items: [
      {
        id: 'catalog',
        label: 'Каталог',
        to: `${base}/catalog`,
        children: directions.map((direction) => ({ id: direction.id, label: direction.name, to: direction.to })),
      },
      { id: 'solutions', label: 'Решения', to: firstIndustry?.to ?? `${base}/solutions/${DEFAULT_INDUSTRY}`, children: industries },
      { id: 'projects', label: 'Проекты', to: `${base}/projects` },
      { id: 'about', label: 'Производство', to: `${base}/about` },
      { id: 'contacts', label: 'Контакты', to: `${base}/contacts` },
    ],
    directions,
  };
}

/** Меню текущего варианта; пересобирается только при смене варианта. */
export function useNav() {
  const { id } = useVariant();
  return useMemo(() => buildNav(id), [id]);
}
