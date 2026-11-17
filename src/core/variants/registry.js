// Реестр вариантов — единственное место, где ядро знает о папках src/variants/.
// meta.js импортируются статически (лёгкие), модули вариантов — лениво через load().
import showroomMeta from '../../variants/showroom/meta.js';
import ralMeta from '../../variants/ral/meta.js';
import blueprintMeta from '../../variants/blueprint/meta.js';

export const VARIANT_IDS = ['showroom', 'ral', 'blueprint'];
export const DEFAULT_VARIANT = 'showroom';

export const VARIANTS = [
  {
    id: 'showroom',
    number: 1,
    name: showroomMeta.name,
    description: showroomMeta.description,
    load: () => import('../../variants/showroom/index.jsx'),
  },
  {
    id: 'ral',
    number: 2,
    name: ralMeta.name,
    description: ralMeta.description,
    load: () => import('../../variants/ral/index.jsx'),
  },
  {
    id: 'blueprint',
    number: 3,
    name: blueprintMeta.name,
    description: blueprintMeta.description,
    load: () => import('../../variants/blueprint/index.jsx'),
  },
];

/** @param {string} id @returns {typeof VARIANTS[number] | undefined} */
export function getVariant(id) {
  return VARIANTS.find((variant) => variant.id === id);
}

/** @param {string} id */
export function isVariantId(id) {
  return VARIANT_IDS.includes(id);
}
