// Как показывать фото товара и как выводить его название.
// В каменную нишу (multiply растворяет белый фон в камне) годится только предметная съёмка на белом.
// Фото в интерьере и на цветном фоне легли бы в нишу плашкой — их показываем как кадр: во всю рамку, cover.
// В данных такого признака нет, поэтому список собран по самим фото из src/data/products.json.

/** Товары, чьё первое фото — съёмка в интерьере или на цветном фоне. Остальные сняты на белом. */
const SCENE_PHOTOS = new Set([
  'muzeynaya-vitrina-mvp-30', // оранжевый фон с сеткой водяных знаков
  'muzeynoe-oborudovanie-vt-10-k-1',
  'vitrina-dlya-chasov-vchyu-23',
  'vitrina-pristennaya-s-nakopitelem-vod-24',
  'prilavok-dlya-optiki-pod-20',
  'vitriny-peredney-linii',
  'kassovyy-prilavok-bolshoy',
  'ostrovnoy-stellazh-osf-22',
  'stellazh-dlya-odezhdy-sp-4',
  'stellazh-demonstratsionnyy-sd-12',
  'torgovyy-modul-tmd-3210',
  'mobilnyy-vystavochnyy-stend-svm-67',
  'skamya-parkovaya-s-75-v-arkhitekturnoy-kroshke-1', // серый фон
]);

/**
 * @param {{ slug?: string }|null|undefined} product
 * @returns {'photo'|'product'} photo — кадр во всю рамку; product — предмет на белом, в каменную нишу
 */
export function photoKind(product) {
  return SCENE_PHOTOS.has(product?.slug) ? 'photo' : 'product';
}

/** Название для вывода: прямые кавычки из выгрузки сайта («"Кораблик"») — ёлочками. */
export function displayName(name) {
  return String(name ?? '').replace(/"([^"]*)"/g, '«$1»');
}
