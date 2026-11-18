// Редакторский выбор: какие товары и проекты с dvk-style.ru попадают в прототип.
// Всё фактическое (название, цена, характеристики, фото) collect.mjs берёт со страницы по url.
// Здесь — только наша разметка: категория в новом дереве, отрасли, тип для «Режима чертёж», подсветка.
// lighting ставится только там, где подсветка встроена по тексту сайта; «по заказу» и неизвестно → null.

export const PRODUCTS = [
  // Ритейл и экспозиция — 12
  { url: 'muzeynoe-oborudovanie/muzeynaya-vitrina-mvp-30/', category: 'museum-equipment', industries: ['museums'], kind: 'showcase' },
  { url: 'vitriny-dlya-muzeya/muzeynoe-oborudovanie-vt-10-k-1/', category: 'showcases', industries: ['museums'], kind: 'showcase' },
  { url: 'yuvelirnoe-torgovoe-oborudovanie/vitrina-dlya-chasov-vchyu-23/', category: 'jewelry-equipment', industries: ['jewelry'], kind: 'showcase' },
  { url: 'oborudovanie-dlya-optiki-i-ochkov/vitrina-pristennaya-s-nakopitelem-vod-24/', category: 'optics-equipment', industries: ['optics'], kind: 'showcase' },
  { url: 'prilavki/prilavok-dlya-optiki-pod-20/', category: 'counters', industries: ['optics'], kind: 'counter' },
  { url: 'vitriny-dlya-aptek/vitriny-peredney-linii/', category: 'pharmacy-showcases', industries: ['pharmacy'], kind: 'showcase' },
  { url: 'aptechnye-prilavki/kassovyy-prilavok-bolshoy/', category: 'pharmacy-counters', industries: ['pharmacy'], kind: 'counter' },
  { url: 'stellazhi-dlya-aptek/ostrovnoy-stellazh-osf-22/', category: 'pharmacy-racks', industries: ['pharmacy'], kind: 'rack' },
  { url: 'oborudovanie-dlya-odezhdy/stellazh-dlya-odezhdy-sp-4/', category: 'apparel-equipment', industries: ['apparel'], kind: 'rack' },
  // «лампы галогеновые» в материалах — встроенная подсветка; галогенные лампы относим к тёплому свету.
  { url: 'dlya-magazinov-kosmetiki-i-parfyumerii/stellazh-demonstratsionnyy-sd-12/', category: 'cosmetics-store-equipment', industries: ['cosmetics'], kind: 'rack', lighting: 'warm' },
  { url: 'yuvelirnye/torgovyy-modul-tmd-3210/', category: 'islands-jewelry', industries: ['jewelry', 'mall-islands'], kind: 'island' },
  { url: 'vystavochnye-stendy/mobilnyy-vystavochnyy-stend-svm-67/', category: 'exhibition-stands', industries: ['museums'], kind: 'other' },

  // Благоустройство — 12
  { url: 'detskie-kompleksy-korabliki/igrovoy-kompleks-d-24-akula/', category: 'play-complexes', industries: ['yards-schools'], kind: 'playground' },
  { url: 'detskie-kompleksy-korabliki/igrovoy-kompleks-mgm-78-korablik/', category: 'play-complexes', industries: ['yards-schools'], kind: 'playground' },
  { url: 'detskie-gorodki-s-kachelyami/detskiy-gorodok-mgk-202-rusich-skazka-s-kachelyami-gnezdo/', category: 'play-towns', industries: ['yards-schools'], kind: 'playground' },
  { url: 'mayatnikovye-kacheli/detskie-mayatnikovye-kacheli-next-k-2013-s-tsepnym-podvesom-tip-2/', category: 'swings', industries: ['yards-schools'], kind: 'playground' },
  { url: 'karuseli-detskie/karusel-next-mk-27/', category: 'carousels', industries: ['yards-schools'], kind: 'playground' },
  { url: 'detskie-gorki-dlya-dachi/detskaya-gorka-mgs-3-vverkh-nogami/', category: 'slides', industries: ['yards-schools'], kind: 'playground' },
  { url: 'pesochnitsa-dlya-detskogo-sada/interaktivnyy-igrovoy-kompleks-s-pesochnitsey-khobbity-rk-25/', category: 'sandboxes', industries: ['yards-schools'], kind: 'playground' },
  { url: 'skameyki-ulichnye-parkovye/skamya-parkovaya-s-75-v-arkhitekturnoy-kroshke-1/', category: 'park-benches', industries: ['public-spaces'], kind: 'bench' },
  { url: 'skameyki-betonnye/skameyka-na-betonnom-osnovanii-s-222/', category: 'concrete-benches', industries: ['public-spaces'], kind: 'bench' },
  { url: 'urny-ulichnye/urna-u-205/', category: 'street-bins', industries: ['public-spaces'], kind: 'other' },
  { url: 'ulichnye-trenazhery/trk-1-1-trenazhernaya-besedka-iz-10-trenazherov-na-rame/', category: 'outdoor-fitness', industries: ['public-spaces', 'yards-schools'], kind: 'playground' },
  { url: 'varkaut/vorkaut-w-07-008/', category: 'workout', industries: ['public-spaces', 'yards-schools'], kind: 'playground' },

  // Металлическая мебель — 11
  { url: 'shkafy-metallicheskie-arkhivnye/shkaf-arkhivnyy-sham-11-920/', category: 'archive-cabinets', industries: ['offices-archives'], kind: 'cabinet' },
  { url: 'shkafy-kartotechnye-metall-zavod-/shkaf-kartotechnyy-shk-8-a4/', category: 'card-index-cabinets', industries: ['offices-archives'], kind: 'cabinet' },
  { url: 'shkafy-dlya-odezhdy/shkaf-dlya-odezhdy-nobilis-nl-04/', category: 'clothes-cabinets', industries: ['locker-rooms'], kind: 'cabinet' },
  { url: 'seyfy/seyf-ofisnyy-ls-052f/', category: 'safes', industries: ['offices-archives'], kind: 'cabinet' },
  { url: 'stellazhi-srednegruzovye/stellazh-metallicheskiy-ms-pro-2500-1010x800-4/', category: 'medium-duty-racks', industries: ['warehouses'], kind: 'rack' },
  { url: 'arkhivnye-stellazhi/stellazh-arkhivnyy-stf-1034-2-5/', category: 'archive-racks', industries: ['offices-archives'], kind: 'rack' },
  { url: 'verstaki-metallicheskie-serii-vl-do-1500-kg/verstak-vl-200-05-s-ekranom-vl-200-e4/', category: 'workbenches', industries: ['workshops'], kind: 'workbench' },
  { url: 'verstaki-metallicheskie-serii-vs-do-3000-kg/verstak-vs-100-01/', category: 'workbenches', industries: ['workshops'], kind: 'workbench' },
  { url: 'tyazhelye-modulnye-shkafy-serii-hard/shkaf-instrumentalnyy-hard-2000-062000/', category: 'tool-cabinets', industries: ['workshops'], kind: 'cabinet' },
  { url: 'tumby-instrumentalnye/tumba-instrumentalnaya-ti-7-006/', category: 'tool-pedestals', industries: ['workshops'], kind: 'cabinet' },
  { url: 'sistema-khraneniya-instrumenta/sistema-khraneniya-boxes-1-2/', category: 'tool-storage', industries: ['workshops'], kind: 'other' },
];

const DESIGNED = 'Оборудование изготовлено по дизайн-проекту сотрудников «ДВК Стиль».';

/**
 * Проекты — фото из галерей /projects/…; одинаковая подпись = один проект.
 * cover — начало имени файла фото, которое идёт первым (самое крупное); title — наша короткая подпись из подписи сайта; summary начинается с подписи сайта дословно.
 * DESIGNED подтверждено страницей /services/dizayn-proekt/dizayn-magazina/.
 */
export const PROJECTS = [
  {
    slug: 'perfume-balashikha', cover: 'b6645506ca', page: 'dizayn-torgovogo-oborudovaniya',
    match: 'Дизайн торгового оборудования для парфюмерии в г. Балашиха',
    title: 'Оборудование для парфюмерии', city: 'Балашиха', direction: 'retail', industry: 'cosmetics',
    extra: DESIGNED, scope: ['Дизайн-проект', 'Производство оборудования'],
  },
  {
    slug: 'museum-bryansk', cover: 'ac119496ba', page: 'dizayn-torgovogo-oborudovaniya',
    match: 'Дизайн торгового оборудования для музеев в г. Брянск',
    title: 'Оборудование для музея', city: 'Брянск', direction: 'retail', industry: 'museums',
    extra: DESIGNED, scope: ['Дизайн-проект', 'Производство оборудования'],
  },
  {
    slug: 'duty-free-spb', cover: '60aadb23e7', page: 'dizayn-torgovogo-oborudovaniya',
    match: 'Дизайн торгового оборудования для магазинов «ДЮТИ ФРИ» в г. Санкт-Петербург',
    title: 'Оборудование для магазинов «Дьюти фри»', city: 'Санкт-Петербург', direction: 'retail', industry: null,
    extra: DESIGNED, scope: ['Дизайн-проект', 'Производство оборудования'],
  },
  {
    slug: 'shoes-perm', page: 'dizayn-torgovogo-oborudovaniya',
    match: 'Дизайн торгового оборудования для обуви в г. Пермь',
    title: 'Оборудование для обувного магазина', city: 'Пермь', direction: 'retail', industry: 'apparel',
    extra: DESIGNED, scope: ['Дизайн-проект', 'Производство оборудования'],
  },
  {
    slug: 'pharmacy-vladivostok', cover: 'e0c0007fd5', page: 'dizayn-oborudovaniya-dlya-aptek',
    match: 'Дизайн оборудования для аптек в городе Владивосток',
    title: 'Оборудование для аптеки', city: 'Владивосток', direction: 'retail', industry: 'pharmacy',
    extra: DESIGNED, scope: ['Дизайн-проект', 'Производство оборудования'],
  },
  {
    slug: 'playground-voronezh', cover: '615be7a3a0', page: 'detskie-igrovye-ploshchadki',
    match: 'Детская площадка в городе Воронеж',
    title: 'Детская площадка', city: 'Воронеж', direction: 'landscape', industry: 'yards-schools',
    extra: null, scope: ['Детское игровое оборудование'],
  },
  {
    slug: 'playground-moscow', cover: 'cdb4b58f06', page: 'detskie-igrovye-ploshchadki',
    match: 'Детская площадка в Москве',
    title: 'Детская площадка', city: 'Москва', direction: 'landscape', industry: 'yards-schools',
    extra: null, scope: ['Детское игровое оборудование'],
  },
  {
    slug: 'workshop-furniture', cover: '10618157c5', page: 'metallicheskaya-mebel',
    match: 'Металлическая мебель для мастерской',
    title: 'Металлическая мебель для мастерской', city: null, direction: 'metal', industry: 'workshops',
    extra: null, scope: ['Металлическая мебель'],
  },
  {
    slug: 'pallet-racks', cover: '4a550fe1de', page: 'metallicheskaya-mebel',
    match: 'Паллетные стеллажи',
    title: 'Паллетные стеллажи', city: null, direction: 'metal', industry: 'warehouses',
    extra: null, scope: ['Металлические стеллажи'],
  },
];

/** Заглушки hero и опорные кадры для генерации видео: лучшие по размеру фото интерьеров из проектов. */
export const HERO_PHOTOS = [
  { project: 'perfume-balashikha', photo: 1, direction: 'retail' },
  { project: 'museum-bryansk', photo: 1, direction: 'retail' },
  { project: 'playground-voronezh', photo: 1, direction: 'landscape' },
  { project: 'playground-moscow', photo: 1, direction: 'landscape' },
  { project: 'workshop-furniture', photo: 1, direction: 'metal' },
  { project: 'pallet-racks', photo: 1, direction: 'metal' },
];
