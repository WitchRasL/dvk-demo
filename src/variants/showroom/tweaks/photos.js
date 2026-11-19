// Сгенерированные фото для главной «Шоурума» (Higgsfield, Nano Banana 2.1): кандидаты кадра hero, плитки
// направлений, отрасли, товары каталога-витрины и проекты. Это визуализации, а не съёмка объектов и товаров
// ДВК — так они и подписаны на странице. Реальные фото остаются на страницах товаров и проектов.
// Файлы лежат парами <base>-800.webp и <base>-1600.webp; у кадров hero есть ещё <base>-2400.webp.
const DIR = 'images/gen/showroom';

/** Значение твика hero «оставить ролик, который стоит сейчас». */
export const HERO_VIDEO = 'video';
/** Значение твиков «фото с сайта заказчика». */
export const FROM_SITE = 'site';
/** Значение твика отраслей «сгенерированные фото». */
export const GENERATED = 'generated';

const hero = (id, name, alt) => ({
  id,
  code: id.toUpperCase(),
  name,
  alt: `${alt} — визуализация интерьера`,
  base: `${DIR}/hero-${id}`,
  src: `${DIR}/hero-${id}-2400.webp`,
  w: 1600,
  h: 893,
});

/** Кандидаты кадра hero: из выбранных потом делается ролик. Порядок — порядок в панели твиков. */
export const HERO_PHOTOS = Object.freeze([
  hero('h1', 'Ювелирный салон: орех и мрамор', 'Ночной ювелирный салон: панели из тёмного ореха, витрины с тёплой подсветкой на каменных тумбах'),
  hero('h2', 'Часовой бутик: чёрный мрамор и бронза', 'Часовой бутик: чёрный мрамор, подсвеченные ниши с витринами и островной прилавок со стеклом'),
  hero('h3', 'Ювелирный салон: светлый травертин', 'Светлый ювелирный салон: травертин, арочные ниши с витринами и стеклянные кубы на круглых тумбах'),
  hero('h4', 'Парфюмерия: подсвеченный оникс', 'Парфюмерный бутик: стена из подсвеченного оникса, полки из янтарного стекла, тёмный дуб'),
  hero('h5', 'Галерея витрин: графит', 'Тёмная галерея: ряд высоких стеклянных витрин с точечным светом уходит в перспективу'),
  hero('h6', 'Оптика: дымчатый дуб', 'Салон оптики: стена подсвеченных полок с оправами и стеклянные прилавки с латунной кромкой'),
  hero('h7', 'Ювелирный флагман: изумруд и латунь', 'Ювелирный салон: изумрудные лаковые панели, латунь, овальный стеклянный прилавок и люстра'),
  hero('h8', 'Ночной зал: горит одна витрина', 'Закрытый бутик ночью: в тёмном зале светится одна высокая стеклянная витрина'),
]);

const HERO_BY_ID = new Map(HERO_PHOTOS.map((photo) => [photo.id, photo]));

/** @param {string} id значение твика → кадр из набора или null (ролик, фото с сайта, неизвестное значение) */
export function heroPhoto(id) {
  return HERO_BY_ID.get(id) ?? null;
}

/** Кадр 4:3 (1200×896) из набора: file — имя без размера, alt — что в кадре. */
const pic = (file, alt, size = { w: 1200, h: 896 }) => ({ base: `${DIR}/${file}`, ...size, alt: `${alt} — визуализация` });
const industry = (id, alt) => pic(`industry-${id}`, alt);
const WIDE = { w: 1376, h: 768 };
const LANDSCAPE = { w: 1264, h: 848 };

/** Фото отраслей для экрана «Решения по отраслям»: по одному на розничные отрасли. */
export const INDUSTRY_PHOTOS = Object.freeze({
  pharmacy: industry('pharmacy', 'Аптека: линия стеклянных витрин у прилавка и подсвеченные стеллажи из светлого дуба'),
  jewelry: industry('jewelry', 'Ювелирный салон: линия стеклянных прилавков с латунной рамой и пристенная витрина'),
  optics: industry('optics', 'Салон оптики: подсвеченные полки с оправами, тумба-накопитель и стеклянный прилавок'),
  museums: industry('museums', 'Музейный зал: высокие стеклянные витрины с керамикой и бронзой, точечный свет'),
  apparel: industry('apparel', 'Бутик одежды и обуви: подсвеченные ниши со штангами и стена полок с обувью'),
  'mall-islands': industry('mall-islands', 'Торговый островок в атриуме: кольцо стеклянных прилавков с подсветкой'),
  'yards-schools': industry('yards-schools', 'Школьный двор: игровая площадка с невысокими комплексами, качелями и скамьями'),
  warehouses: pic('tile-racks', 'Склад: высокие металлические стеллажи вдоль прохода'),
});

/** Плитки «Выбор направления» по разделам каталога. Большую плитку ритейла выбирает твик — её здесь нет. */
export const TILE_PHOTOS = Object.freeze({
  'pharmacy-equipment': INDUSTRY_PHOTOS.pharmacy,
  'trade-islands': INDUSTRY_PHOTOS['mall-islands'],
  playgrounds: pic('tile-playgrounds', 'Детская площадка во дворе жилого комплекса: игровой комплекс из дерева и стали'),
  benches: pic('tile-benches', 'Парковая скамья с деревянными рейками на бетонном основании'),
  'small-architectural-forms': pic('tile-small-forms', 'Малые формы на городской площади: пергола, вазоны и урна'),
  'metal-cabinets': pic('tile-cabinets', 'Ряд металлических шкафов, один открыт'),
  'metal-racks': pic('tile-racks', 'Металлические стеллажи на складе'),
  'metal-furniture': pic('tile-metal-furniture', 'Мастерская: верстаки, инструментальные панели и шкафы'),
});

/** Товары каталога-витрины по slug: предмет в интерьере, во всю рамку карточки. */
export const PRODUCT_PHOTOS = Object.freeze({
  'vitrina-dlya-chasov-vchyu-23': pic('product-watch-vitrine', 'Стеклянная витрина для часов на тёмной тумбе в бутике'),
  'igrovoy-kompleks-mgm-78-korablik': pic('product-korablik', 'Игровой комплекс в виде корабля во дворе'),
  'shkaf-instrumentalnyy-hard-2000-062000': pic('product-tool-cabinet', 'Инструментальный шкаф с открытыми дверцами в мастерской'),
  'torgovyy-modul-tmd-3210': pic('product-trade-island', 'Торговый островок со стеклянными прилавками в торговом центре'),
  'detskaya-gorka-mgs-3-vverkh-nogami': pic('product-slide', 'Детская горка на площадке во дворе'),
  'verstak-vl-200-05-s-ekranom-vl-200-e4': pic('product-workbench', 'Слесарный верстак с перфорированным экраном в мастерской'),
});

/** Проекты экрана «Проекты» по slug. */
export const PROJECT_PHOTOS = Object.freeze({
  'museum-bryansk': pic('project-museum', 'Музейный зал: высокие стеклянные витрины с историческими костюмами', LANDSCAPE),
  'duty-free-spb': pic('project-duty-free', 'Магазин беспошлинной торговли: круглый остров и подсвеченные стеллажи', WIDE),
  'pharmacy-vladivostok': pic('project-pharmacy', 'Аптека: островные и пристенные стеллажи с открытой выкладкой', WIDE),
  'playground-moscow': pic('project-playground', 'Игровой комплекс с башнями и горками во дворе жилого дома', WIDE),
  'workshop-furniture': pic('project-workshop', 'Мастерская с металлическими шкафами, стеллажами и верстаком', WIDE),
});

/** Подпись сгенерированного кадра на странице: видно, что это не объект компании. */
export const GENERATED_CAPTION = 'Визуализация · не объект ДВК';
/** Пометки под экранами, где стоят сгенерированные фото. */
export const GENERATED_NOTES = Object.freeze({
  tiles: 'Фото плиток — визуализации, не объекты ДВК.',
  catalog: 'Фото товаров на этом экране — визуализации.',
  projects: 'Фото объектов на этом экране — визуализации.',
});

/** Значения твиков по умолчанию и допустимые значения каждого. */
export const TWEAK_DEFAULTS = Object.freeze({ hero: HERO_VIDEO, tile: 'h4', industries: GENERATED, catalog: GENERATED, projects: GENERATED });

const ALLOWED = {
  hero: new Set([...HERO_BY_ID.keys(), HERO_VIDEO]),
  tile: new Set([...HERO_BY_ID.keys(), FROM_SITE]),
  industries: new Set([GENERATED, FROM_SITE]),
  catalog: new Set([GENERATED, FROM_SITE]),
  projects: new Set([GENERATED, FROM_SITE]),
};

/** Приводит сохранённые значения к допустимым: неизвестный ключ отбрасывается, неизвестное значение → по умолчанию. */
export function sanitizeTweaks(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return Object.fromEntries(Object.entries(TWEAK_DEFAULTS).map(([key, fallback]) => [key, ALLOWED[key].has(source[key]) ? source[key] : fallback]));
}
