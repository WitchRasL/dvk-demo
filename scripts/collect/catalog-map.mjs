// Редакторская карта каталога: код раздела/категории на dvk-style.ru → наш id и чистое название.
// Названия — без капса и хвостов поставщиков; смысл и состав — как на сайте. Число товаров и адреса берёт collect.mjs с сайта.
// Всё, что на сайте называлось иначе (капс, подкатегории, хвосты «промет», «диком», «версия», дубль «Промышленная мебель»),
// попадает в categories.json → aliases: «старое название» → id узла.

export const DIRECTIONS = [
  {
    id: 'retail',
    name: 'Ритейл и экспозиция',
    sections: ['torgovoe-oborudovanie', 'torgovaya-mebel', 'oborudovanie-dlya-aptek', 'torgovye-ostrovki'],
  },
  {
    id: 'landscape',
    name: 'Благоустройство',
    sections: ['detskie-ploshchadki', 'skameyki', 'malye-arkhitekturnye-formy'],
  },
  {
    id: 'metal',
    name: 'Металлическая мебель',
    sections: ['metallicheskie-shkafy', 'metallicheskie-stellazhi', 'metallicheskaya-mebel'],
  },
];

/** Разделы (верхний уровень каталога сайта). */
export const SECTIONS = {
  'torgovoe-oborudovanie': { id: 'trade-equipment', name: 'Торговое оборудование' },
  'torgovaya-mebel': { id: 'trade-furniture', name: 'Торговая мебель' },
  'oborudovanie-dlya-aptek': { id: 'pharmacy-equipment', name: 'Оборудование для аптек' },
  'torgovye-ostrovki': { id: 'trade-islands', name: 'Торговые островки' },
  'detskie-ploshchadki': { id: 'playgrounds', name: 'Детские игровые площадки' },
  skameyki: { id: 'benches', name: 'Скамейки' },
  'malye-arkhitekturnye-formy': { id: 'small-architectural-forms', name: 'Малые архитектурные формы' },
  'metallicheskie-shkafy': { id: 'metal-cabinets', name: 'Металлические шкафы' },
  'metallicheskie-stellazhi': { id: 'metal-racks', name: 'Металлические стеллажи' },
  'metallicheskaya-mebel': { id: 'metal-furniture', name: 'Металлическая мебель' },
};

/** Раздел-дубль: на сайте «Промышленная мебель» повторяет «Металлическую мебель» (коды с хвостом «1»). */
export const DUPLICATE_SECTIONS = { 'promyshlennaya-mebel': 'metallicheskaya-mebel' };

/** Категории (второй уровень). Серии аптек сюда не входят — они в industries.pharmacy.series. */
export const CATEGORIES = {
  vitriny: { id: 'showcases', name: 'Витрины' },
  prilavki: { id: 'counters', name: 'Прилавки' },
  'dlya-magazinov-bytovoy-tekhniki': { id: 'appliance-store-equipment', name: 'Оборудование для магазинов бытовой техники' },
  'dlya-magazinov-nizhnego-belya': { id: 'lingerie-store-equipment', name: 'Оборудование для магазинов нижнего белья' },
  'oborudovanie-dlya-odezhdy': { id: 'apparel-equipment', name: 'Оборудование для одежды' },
  'yuvelirnoe-torgovoe-oborudovanie': { id: 'jewelry-equipment', name: 'Ювелирное торговое оборудование' },
  'oborudovanie-dlya-optiki-i-ochkov': { id: 'optics-equipment', name: 'Оборудование для оптики и очков' },
  'muzeynoe-oborudovanie': { id: 'museum-equipment', name: 'Музейное оборудование' },
  'vystavochnye-stendy': { id: 'exhibition-stands', name: 'Выставочные стенды' },
  'dlya-magazinov-kosmetiki-i-parfyumerii': { id: 'cosmetics-store-equipment', name: 'Оборудование для магазинов косметики и парфюмерии' },
  'dlya-obuvnogo-magazina': { id: 'shoe-equipment', name: 'Оборудование для обувного магазина' },

  'brendirovanie-oborudovaniya': { id: 'branded-equipment', name: 'Брендирование торгового оборудования' },
  'oborudovanie-dlya-torgovli': { id: 'retail-equipment', name: 'Оборудование для торговли' },
  'oborudovanie-dlya-sporttovarov': { id: 'sports-store-equipment', name: 'Оборудование для спорттоваров' },
  'oborudovanie-dlya-stroitelnykh-magazinov': { id: 'hardware-store-equipment', name: 'Оборудование для строительных магазинов' },

  'vitriny-dlya-aptek': { id: 'pharmacy-showcases', name: 'Витрины для аптек' },
  'shkafy-dlya-aptek': { id: 'pharmacy-cabinets', name: 'Шкафы для аптек' },
  'aptechnye-prilavki': { id: 'pharmacy-counters', name: 'Аптечные прилавки' },
  'stellazhi-dlya-aptek': { id: 'pharmacy-racks', name: 'Стеллажи для аптек' },

  bizhuteriya: { id: 'islands-costume-jewelry', name: 'Островки для бижутерии' },
  'galantereynaya-produktsiya': { id: 'islands-haberdashery', name: 'Островки для галантереи' },
  'detskie-tovary': { id: 'islands-kids-goods', name: 'Островки для детских товаров' },
  igrushki: { id: 'islands-toys', name: 'Островки для игрушек' },
  'kantselyarskie-tovary': { id: 'islands-stationery', name: 'Островки для канцелярских товаров' },
  'kosmetika-parfyumeriya': { id: 'islands-cosmetics', name: 'Островки для косметики и парфюмерии' },
  'mobilnaya-svyaz': { id: 'islands-mobile', name: 'Островки для мобильной связи и аксессуаров' },
  'napitki-produkty': { id: 'islands-food', name: 'Островки для напитков и продуктов' },
  ochki: { id: 'islands-glasses', name: 'Островки для очков' },
  'servisnye-stoyki': { id: 'service-desks', name: 'Сервисные стойки' },
  'suveniry-i-podarki': { id: 'islands-souvenirs', name: 'Островки для сувениров и подарков' },
  chasy: { id: 'islands-watches', name: 'Островки для часов' },
  'ekspress-manikyur': { id: 'islands-manicure', name: 'Островки для экспресс-маникюра' },
  'ekspress-uslugi': { id: 'islands-express-services', name: 'Островки для экспресс-услуг' },
  'elektronika-bytovaya-tekhnika': { id: 'islands-electronics', name: 'Островки для электроники и бытовой техники' },
  yuvelirnye: { id: 'islands-jewelry', name: 'Островки для ювелирных изделий' },
  'pavilony-dlya-torgovogo-tsentra': { id: 'mall-pavilions', name: 'Павильоны для торгового центра' },
  'torgovye-moduli': { id: 'trade-modules', name: 'Торговые модули' },

  'detskie-gorodki': { id: 'play-towns', name: 'Детские городки' },
  'detskie-igrovye-kompleksy': { id: 'play-complexes', name: 'Детские игровые комплексы' },
  kacheli: { id: 'swings', name: 'Детские качели' },
  'karuseli-detskie': { id: 'carousels', name: 'Детские карусели' },
  'gorki-detskie': { id: 'slides', name: 'Детские горки' },
  'pesochnitsy-detskie': { id: 'sandboxes', name: 'Детские песочницы' },

  'skameyki-v-razdevalku': { id: 'locker-room-benches', name: 'Скамейки для раздевалок' },
  'skameyki-so-spinkoy': { id: 'benches-with-backrest', name: 'Скамейки со спинкой' },
  'skameyki-ulichnye-parkovye': { id: 'park-benches', name: 'Уличные парковые скамейки' },
  'detskie-skameyki': { id: 'kids-benches', name: 'Детские скамейки' },
  'skameyki-dlya-magazinov': { id: 'store-benches', name: 'Скамейки для магазинов' },
  'krasivye-skameyki': { id: 'design-benches', name: 'Красивые скамейки' },
  'lavki-skameyki': { id: 'lavki', name: 'Лавки' },
  'metallicheskie-skameyki': { id: 'metal-benches', name: 'Металлические скамейки' },
  'sadovye-skameyki': { id: 'garden-benches', name: 'Садовые скамейки' },
  'skameyki-betonnye': { id: 'concrete-benches', name: 'Бетонные скамейки' },
  'skameyki-plastikovye': { id: 'plastic-benches', name: 'Пластиковые скамейки' },

  'urny-ulichnye': { id: 'street-bins', name: 'Уличные бетонные урны' },
  'ulichnye-trenazhery': { id: 'outdoor-fitness', name: 'Уличные тренажёры' },
  varkaut: { id: 'workout', name: 'Воркаут' },
  'vazony-tsvetochnitsy': { id: 'planters', name: 'Вазоны и цветочницы' },

  'shkafy-dlya-dokumentov': { id: 'document-cabinets', name: 'Шкафы для документов' },
  'shkafy-metallicheskie-arkhivnye': { id: 'archive-cabinets', name: 'Архивные шкафы' },
  'shkafy-ofisnye-': { id: 'office-cabinets', name: 'Офисные шкафы' },
  'shkafy-kartotechnye': { id: 'card-index-cabinets', name: 'Картотечные шкафы' },
  'shkafy-dlya-abonentov': { id: 'subscriber-cabinets', name: 'Абонентские шкафы' },
  'shkafy-dlya-odezhdy': { id: 'clothes-cabinets', name: 'Шкафы для одежды' },
  'shkafy-sektsionnye': { id: 'sectional-cabinets', name: 'Секционные шкафы' },
  'shkafy-dlya-razdevalok': { id: 'locker-room-cabinets', name: 'Шкафы для раздевалок' },
  'shkafy-dlya-sushki-odezhdy': { id: 'drying-cabinets', name: 'Шкафы для сушки одежды' },
  'shkafy-dlya-mobilnykh-telefonov': { id: 'phone-lockers', name: 'Шкафы для мобильных телефонов' },
  'shkafy-metallicheskie-dvukhsektsionnye': { id: 'two-section-cabinets', name: 'Двухсекционные шкафы' },
  'shkafy-metallicheskie-napolnye': { id: 'floor-cabinets', name: 'Напольные шкафы' },
  'metallicheskie-garderobnye-shkafy': { id: 'wardrobe-cabinets', name: 'Гардеробные шкафы' },

  'stellazhi-peredvizhnye': { id: 'mobile-racks', name: 'Передвижные стеллажи' },
  'stellazhi-dlya-kolyes': { id: 'tire-racks', name: 'Стеллажи для колёс' },
  'stellazhi-s-naklonnymi-polkami': { id: 'inclined-shelf-racks', name: 'Стеллажи с наклонными полками' },
  'stellazhi-srednegruzovye': { id: 'medium-duty-racks', name: 'Среднегрузовые стеллажи' },
  'stellazhi-s-vykatnymi-platformami': { id: 'roll-out-racks', name: 'Стеллажи с выкатными платформами' },
  'stellazhi-s-konsolyami': { id: 'cantilever-racks', name: 'Консольные стеллажи' },
  'arkhivnye-stellazhi': { id: 'archive-racks', name: 'Архивные стеллажи' },
  'skladskie-stellazhi': { id: 'warehouse-racks', name: 'Складские стеллажи' },

  verstaki: { id: 'workbenches', name: 'Верстаки' },
  'shkafy-instrumentalnye': { id: 'tool-cabinets', name: 'Инструментальные шкафы' },
  'sistema-khraneniya-instrumenta': { id: 'tool-storage', name: 'Системы хранения инструмента' },
  'tumby-instrumentalnye': { id: 'tool-pedestals', name: 'Инструментальные тумбы' },
  'telezhki-instrumentalnye': { id: 'tool-trolleys', name: 'Инструментальные тележки' },
  kassetnitsy: { id: 'cassette-cabinets', name: 'Кассетницы' },
  'stoyki-podkatnye': { id: 'roll-stands', name: 'Подкатные стойки' },
  'tumby-kompyuternye': { id: 'computer-pedestals', name: 'Компьютерные тумбы' },
  'telezhki-kompyuternye': { id: 'computer-trolleys', name: 'Компьютерные тележки' },
  seyfy: { id: 'safes', name: 'Сейфы' },
  'kartoteki-drayvera': { id: 'card-files', name: 'Картотеки и драйверы' },
};

/** Отрасли («Решения»): наша группировка категорий сайта; summary — начало предложения, которое берётся дословно со страницы source. */
export const INDUSTRIES = [
  { id: 'pharmacy', name: 'Аптеки', directions: ['retail'], summary: 'специализируется на производстве аптечных витрин', source: 'oborudovanie-dlya-aptek', categories: ['pharmacy-showcases', 'pharmacy-cabinets', 'pharmacy-counters', 'pharmacy-racks'] },
  { id: 'jewelry', name: 'Ювелирные салоны', directions: ['retail'], summary: 'производитель оборудования для ювелирного магазина, а не дилер', source: 'yuvelirnoe-torgovoe-oborudovanie', categories: ['jewelry-equipment', 'islands-jewelry'] },
  { id: 'optics', name: 'Оптика', directions: ['retail'], summary: 'Торговое оборудование для очков производится из', source: 'oborudovanie-dlya-optiki-i-ochkov', categories: ['optics-equipment', 'islands-glasses'] },
  { id: 'museums', name: 'Музеи и выставки', directions: ['retail'], summary: 'производитель музейного оборудования, а не дилер', source: 'muzeynoe-oborudovanie', categories: ['museum-equipment', 'exhibition-stands'] },
  { id: 'apparel', name: 'Одежда и обувь', directions: ['retail'], summary: 'Для залов и магазинов, продающих обувь', source: 'dlya-obuvnogo-magazina', categories: ['apparel-equipment', 'shoe-equipment', 'lingerie-store-equipment'] },
  { id: 'cosmetics', name: 'Косметика и парфюмерия', directions: ['retail'], summary: 'Наиболее удобная для покупателя демонстрация косметики', source: 'dlya-magazinov-kosmetiki-i-parfyumerii', categories: ['cosmetics-store-equipment', 'islands-cosmetics'] },
  { id: 'mall-islands', name: 'Островки в ТЦ', directions: ['retail'], summary: 'торговые островки на заказ и стандартные', source: 'torgovye-ostrovki', categories: [] },
  { id: 'yards-schools', name: 'Дворы, детские сады и школы', directions: ['landscape'], summary: 'проектирует и производит игровые комплексы', source: 'detskie-ploshchadki', categories: [] },
  { id: 'public-spaces', name: 'Парки и общественные пространства', directions: ['landscape'], summary: 'Их роль двоякая', source: 'malye-arkhitekturnye-formy', categories: ['park-benches', 'street-bins', 'planters', 'outdoor-fitness', 'workout'] },
  { id: 'offices-archives', name: 'Офисы и архивы', directions: ['metal'], summary: 'Архивные шкафы (канцелярские) решат', source: 'shkafy-metallicheskie-arkhivnye', categories: ['document-cabinets', 'archive-cabinets', 'office-cabinets', 'card-index-cabinets', 'archive-racks', 'safes', 'card-files'] },
  { id: 'warehouses', name: 'Склады и цеха', directions: ['metal'], summary: 'Металлические стеллажи используются для хранения', source: 'skladskie-stellazhi', categories: ['warehouse-racks', 'medium-duty-racks', 'cantilever-racks', 'tire-racks'] },
  { id: 'workshops', name: 'Автосервисы и мастерские', directions: ['metal'], summary: 'Металлические верстаки слесарные используют', source: 'verstaki', categories: ['workbenches', 'tool-cabinets', 'tool-storage', 'tool-pedestals', 'tool-trolleys'] },
  { id: 'locker-rooms', name: 'Раздевалки', directions: ['metal', 'landscape'], summary: 'Шкафчики для раздевалок необходимы', source: 'shkafy-dlya-razdevalok', categories: ['locker-room-cabinets', 'clothes-cabinets', 'drying-cabinets', 'locker-room-benches'] },
];

/** Подписи значений фасетов (для ядра каталога). */
export const FACET_LABELS = {
  material: {
    metal: 'Металл',
    glass: 'Стекло',
    ldsp: 'ЛДСП',
    mdf: 'МДФ',
    wood: 'Дерево',
    plywood: 'Фанера',
    plastic: 'Пластик',
    concrete: 'Бетон',
    stone: 'Камень',
  },
  light: { warm: 'Тёплая подсветка', cold: 'Холодная подсветка', rgb: 'RGB-подсветка', none: 'Без подсветки' },
};
