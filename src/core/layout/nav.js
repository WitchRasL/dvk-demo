// Навигация-заглушка каркаса. Таск страниц достраивает мега-меню по направлениям
// (directions — из getDirections() ядра каталога) и отрасли в «Решениях».
import { useMemo } from 'react';
import { useVariant } from '../variants/VariantContext.jsx';

/** @param {string} variantId */
export function buildNav(variantId) {
  const base = `/${variantId}`;
  return {
    items: [
      { id: 'catalog', label: 'Каталог', to: `${base}/catalog` },
      { id: 'solutions', label: 'Решения', to: `${base}/solutions/pharmacy` },
      { id: 'projects', label: 'Проекты', to: `${base}/projects` },
      { id: 'about', label: 'Производство', to: `${base}/about` },
      { id: 'contacts', label: 'Контакты', to: `${base}/contacts` },
    ],
    directions: [],
  };
}

/** @returns {{ items: { id, label, to, children? }[], directions: { id, name, to, sections }[] }} */
export function useNav() {
  const { id } = useVariant();
  return useMemo(() => buildNav(id), [id]);
}
