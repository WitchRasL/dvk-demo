#!/usr/bin/env node
// Сбор контента с dvk-style.ru → src/data/{categories,products,projects,company}.json,
// scripts/collect/image-jobs.json (для npm run fetch-images) и docs/todo-utochnit.md.
//   node scripts/collect/collect.mjs
// Вежливо: robots.txt, пауза 0,5–1 с, HTML кэшируется в scripts/collect/.cache/ (повторный запуск — без сети).
// Правило честности: каждый текст о компании сверяется с фрагментами страницы (verify); нет фрагмента — сбор падает.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { CATEGORIES, DIRECTIONS, DUPLICATE_SECTIONS, FACET_LABELS, INDUSTRIES, SECTIONS } from './catalog-map.mjs';
import { ORIGIN, originalImageUrl, parseCatalogTree, parseGallery, parseMenuChildren, parsePageText, parseProduct } from './parse.mjs';
import { HERO_PHOTOS, PRODUCTS, PROJECTS } from './picks.mjs';
import { createPoliteClient } from './polite.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TODAY = new Date().toISOString().slice(0, 10);
const client = createPoliteClient({ log: (msg) => console.log(msg) });
const pageCache = new Map();

async function page(path) {
  const url = path.startsWith('http') ? path : `${ORIGIN}/${path}`;
  if (!pageCache.has(url)) pageCache.set(url, await client.getText(url));
  return { url, html: pageCache.get(url) };
}

const squash = (text) => String(text ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const normalize = (text) =>
  squash(text)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»„“”"']/g, '"')
    .replace(/\s*[-–—]\s*/g, '-')
    .replace(/\s+/g, ' ');
const codeOf = (url) => new URL(url).pathname.split('/').filter(Boolean)[1];
const fixQuotes = (text) => squash(text).replace(/"\s*([^"]+?)\s*"/g, '«$1»');
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const titleCase = (text) => capitalize(text.toLowerCase());

function pageText(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return normalize($('body').text());
}

/** Факт о компании — только если каждый фрагмент найден на странице. */
async function verify(path, fragments) {
  const { url, html } = await page(path);
  const text = pageText(html);
  for (const fragment of fragments) {
    if (!text.includes(normalize(fragment))) throw new Error(`Нет на странице ${url}: «${fragment}»`);
  }
  return url;
}

/** Предложение из описания раздела сайта (.bxr-section-desc), начинающееся с fragment или содержащее его, — дословно. */
function siteSentence(html, fragment) {
  if (!fragment) return null;
  const $ = cheerio.load(html);
  const wanted = normalize(fragment);
  for (const p of $('.bxr-section-desc p').toArray()) {
    const text = squash($(p).text());
    if (!normalize(text).includes(wanted)) continue;
    const sentences = text.split(/(?<=[.!?])\s+(?=[А-ЯЁA-Z«"])/);
    return sentences.find((sentence) => normalize(sentence).includes(wanted)) ?? null;
  }
  return null;
}

const todo = [];
const addTodo = (text) => todo.push(`[уточнить] ${text}`);

// ---------- фото: задания для fetch-images и уже известные размеры ----------
const jobs = [];
const knownSizes = new Map();
function loadManifest(folder) {
  const file = join(ROOT, 'public', folder, 'manifest.json');
  if (!existsSync(file)) return;
  for (const entry of JSON.parse(readFileSync(file, 'utf8')).files ?? []) knownSizes.set(`${entry.base}|${entry.source}`, entry);
}
function image(folder, n, source, alt) {
  if (!source) throw new Error(`нет оригинала для ${folder}/${n}`);
  const base = `images/${folder}/${n}`;
  if (!knownSizes.size || !knownSizes.has(`${base}|${source}`)) loadManifest(`images/${folder}`);
  const known = knownSizes.get(`${base}|${source}`);
  jobs.push({ base, source, alt });
  return { base, alt, w: known?.width ?? null, h: known?.height ?? null };
}

// ---------- характеристики товара ----------
function mergeSpecs(specs) {
  const merged = [];
  for (const { label, value } of specs) {
    if (/^(новинка|лидер продаж|хит продаж)$/i.test(label)) continue;
    const existing = merged.find((spec) => spec.label === label);
    if (existing) existing.value = `${existing.value}; ${value}`;
    else merged.push({ label, value });
  }
  return merged;
}

/** «Размеры ВхШхГ, мм: 2000х900х400» → { w: 900, h: 2000, d: 400 }; Д — длина (идёт в w), тогда Ш — глубина. */
function parseDimensions(specs) {
  for (const { label, value } of specs) {
    const match = label.match(/^Размеры\s+([ВШГД][xх]?[ВШГД][xх]?[ВШГД])\s*,\s*мм$/i);
    if (!match) continue;
    const letters = match[1].toUpperCase().replace(/[XХ]/g, '').split('');
    const numbers = value.match(/^\s*(\d+)\s*[xх×]\s*(\d+)\s*[xх×]\s*(\d+)\s*(?:мм)?\.?\s*$/i);
    if (!numbers || letters.length !== 3) return null;
    const hasLength = letters.includes('Д');
    const axis = { В: 'h', Г: 'd', Д: 'w', Ш: hasLength ? 'd' : 'w' };
    const result = { w: null, h: null, d: null, unit: 'mm' };
    letters.forEach((letter, index) => {
      result[axis[letter]] = Number(numbers[index + 1]);
    });
    return result;
  }
  return null;
}

const MATERIAL_RULES = [
  ['metal', /металл|сталь|стальн|алюмини|оцинк|хром|труба|профиль/],
  ['glass', /стекл(?!опласт)|зеркал/],
  ['ldsp', /лдсп|дсп|меламин/],
  ['mdf', /мдф/],
  ['plywood', /фанер/],
  ['wood', /брус|дерев|древес|массив/],
  ['plastic', /пластик|арпа|arpa|abet|абет|стеклопласт|композит/],
  ['concrete', /бетон/],
];
const METAL_SECTIONS = ['metal-cabinets', 'metal-racks', 'metal-furniture'];

function detectMaterials(specs, name, sectionId) {
  const source = specs
    .filter(({ label }) => /материал|столешниц|корпус|каркас/i.test(label))
    .map(({ value }) => value)
    .join('; ')
    .toLowerCase()
    .replace(/[^,;]*кромк[^,;]*/g, ' ');
  let found = MATERIAL_RULES.filter(([, rule]) => rule.test(source)).map(([id]) => id);
  if (!found.length) found = MATERIAL_RULES.filter(([, rule]) => rule.test(name.toLowerCase())).map(([id]) => id);
  if (!found.length && METAL_SECTIONS.includes(sectionId)) found = ['metal'];
  return found;
}

function detectLoad(specs) {
  const spec = specs.find(({ label }) => /^(максимальная )?нагрузка(, кг)?$/i.test(label) || /^нагрузка на (полку|ярус|секцию)/i.test(label));
  const number = spec?.value.replace(/\s/g, '').match(/\d+/);
  return number ? Number(number[0]) : null;
}

// ---------- 1. Дерево каталога ----------
async function buildCategories() {
  const { html: homeHtml } = await page('');
  const tree = parseCatalogTree(homeHtml);
  const menu = parseMenuChildren(homeHtml);
  const treeByCode = new Map(tree.map((section) => [codeOf(section.url), section]));
  const aliases = {};
  const addAlias = (name, id) => {
    const key = squash(name);
    if (!key) return;
    if (aliases[key] && aliases[key] !== id) console.warn(`алиас «${key}»: ${aliases[key]} и ${id}, оставлен первый`);
    else aliases[key] = id;
  };
  const isSeries = (code) => /^(seriya-|set-aptek-)/.test(code);
  const seriesSite = [];

  const directions = DIRECTIONS.map((direction) => {
    const sections = direction.sections.map((code) => {
      const site = treeByCode.get(code);
      if (!site) throw new Error(`раздела ${code} нет в каталоге сайта`);
      const mapped = SECTIONS[code];
      addAlias(site.name, mapped.id);
      const categories = [];
      for (const child of site.children) {
        const childCode = codeOf(child.url);
        if (isSeries(childCode)) {
          seriesSite.push(child);
          addAlias(child.name, mapped.id);
          continue;
        }
        if (DUPLICATE_SECTIONS[childCode]) {
          addAlias(child.name, SECTIONS[DUPLICATE_SECTIONS[childCode]].id);
          continue;
        }
        if (child.count === null) {
          // Пункт меню без числа товаров на сайте — не категория, только алиас на раздел.
          addAlias(child.name, mapped.id);
          continue;
        }
        const category = CATEGORIES[childCode];
        if (!category) throw new Error(`категория ${childCode} («${child.name}») не размечена в catalog-map.mjs`);
        addAlias(child.name, category.id);
        categories.push({ id: category.id, name: category.name, slug: category.id, count: child.count, sourceUrl: child.url });
      }
      return { id: mapped.id, name: mapped.name, slug: mapped.id, count: site.count, sourceUrl: site.url, categories };
    });
    const names = sections.map((section, index) => (index ? section.name.toLowerCase() : section.name));
    const summary = `${names.slice(0, -1).join(', ')} и ${names.at(-1)}`;
    return { id: direction.id, name: direction.name, slug: direction.id, summary, sections };
  });

  // Дубль «Промышленная мебель» → «Металлическая мебель»; его пункты с хвостом «1» → те же категории.
  for (const [duplicate, target] of Object.entries(DUPLICATE_SECTIONS)) {
    const site = treeByCode.get(duplicate);
    if (site) addAlias(site.name, SECTIONS[target].id);
    const items = [...(site?.children ?? []), ...(menu[`${ORIGIN}/catalog/${duplicate}/`] ?? [])];
    for (const item of items) {
      const category = CATEGORIES[codeOf(item.url).replace(/1$/, '')];
      if (category) addAlias(item.name, category.id);
    }
  }

  // Третий уровень меню и пункты без числа товаров → ближайший узел нового дерева.
  const nodeByUrl = new Map();
  for (const direction of directions)
    for (const section of direction.sections) {
      nodeByUrl.set(section.sourceUrl, section.id);
      for (const category of section.categories) nodeByUrl.set(category.sourceUrl, category.id);
    }
  for (const [parentUrl, items] of Object.entries(menu)) {
    const parentId = nodeByUrl.get(parentUrl);
    if (!parentId) continue;
    for (const item of items) {
      if (nodeByUrl.has(item.url)) continue;
      if (isSeries(codeOf(item.url)) && !seriesSite.some((series) => series.url === item.url)) seriesSite.push({ ...item, count: null });
      addAlias(item.name, parentId);
    }
  }

  // Отрасли.
  const industries = [];
  for (const industry of INDUSTRIES) {
    const { url, html } = await page(`catalog/${industry.source}/`);
    const $ = cheerio.load(html);
    const desc = $('.bxr-section-desc').filter((_, el) => $(el).find('p').length > 0).first();
    const summary = siteSentence(html, industry.summary);
    if (!summary) addTodo(`описание отрасли «${industry.name}» — на странице ${url} нет подходящего текста`);
    const entry = {
      id: industry.id,
      name: industry.name,
      slug: industry.id,
      directions: industry.directions,
      summary: summary ?? '[уточнить]',
      sourceUrl: url,
      categoryIds: industry.categories,
    };
    if (industry.id === 'pharmacy') {
      entry.equipmentTypes = [];
      let inTypes = false;
      desc.find('h2, p').each((_, el) => {
        const text = squash($(el).text());
        if (el.tagName === 'h2') inTypes = /виды оборудования/i.test(text);
        else if (inTypes) {
          const match = text.match(/^([^—]{3,40}?)\s+—\s+(.+)$/);
          if (match) entry.equipmentTypes.push({ name: match[1], text: match[2] });
        }
      });
      entry.series = await buildSeries(seriesSite, html);
    }
    industries.push(entry);
  }

  const nodeIds = new Set(nodeByUrl.values());
  for (const industry of industries)
    for (const id of industry.categoryIds) if (!nodeIds.has(id)) throw new Error(`отрасль ${industry.id}: нет узла ${id}`);

  return {
    directions,
    industries,
    aliases,
    facetLabels: FACET_LABELS,
    meta: { source: ORIGIN, collectedAt: TODAY },
  };
}

async function buildSeries(seriesSite, pharmacyHtml) {
  const $ = cheerio.load(pharmacyHtml);
  const result = [];
  for (const site of seriesSite) {
    const code = codeOf(site.url);
    if (!site.count) {
      console.log(`серия ${site.name}: на сайте нет товаров — пропущена (только алиас)`);
      continue;
    }
    const raw = site.name.replace(/^Серия аптек\s*/i, '').replace(/["«»]/g, '').trim();
    const name = /[a-z]/i.test(raw) && !/[а-яё]/i.test(raw) ? capitalize(raw.toLowerCase()) : titleCase(raw);
    const slug = code.replace(/^(seriya-aptek-|seriya-|set-aptek-)/, '');
    const thumb = $(`a[href="/catalog/${code}/"] img`).first().attr('src');
    const original = originalImageUrl(thumb);
    result.push({
      name,
      slug,
      count: site.count,
      image: original ? image(`company/pharmacy-series`, slug, original, `Серия аптек «${name}»`) : null,
      sourceUrl: site.url,
    });
  }
  return result;
}

// ---------- 2. Товары ----------
async function buildProducts(categories) {
  const sections = categories.directions.flatMap((direction) =>
    direction.sections.map((section) => ({ ...section, direction: direction.id })),
  );
  const industryIds = new Set(categories.industries.map((industry) => industry.id));
  const products = [];
  for (const pick of PRODUCTS) {
    const { url, html } = await page(`catalog/${pick.url}`);
    const site = parseProduct(html, url);
    const section = sections.find((s) => s.categories.some((c) => c.id === pick.category));
    if (!section) throw new Error(`${pick.url}: категории ${pick.category} нет в дереве`);
    for (const id of pick.industries) if (!industryIds.has(id)) throw new Error(`${pick.url}: нет отрасли ${id}`);
    const slug = pick.url.split('/').filter(Boolean).pop();
    const name = /[а-яё]/.test(site.name) ? site.name : titleCase(site.name);
    const specs = mergeSpecs(site.specs);
    if (!specs.length) throw new Error(`${url}: нет характеристик`);
    if (!site.images.length) throw new Error(`${url}: нет фото`);
    const lighting = pick.lighting ?? null;
    if (lighting && !/подсвет|галоген|светодиод/i.test(`${specs.map((s) => s.value).join(' ')} ${site.description}`))
      throw new Error(`${url}: подсветка «${lighting}» не подтверждена текстом сайта`);
    products.push({
      id: slug,
      slug,
      name,
      direction: section.direction,
      sectionId: section.id,
      categoryId: pick.category,
      industries: pick.industries,
      materials: detectMaterials(specs, name, section.id),
      lighting,
      dimensions: parseDimensions(specs),
      load: detectLoad(specs),
      specs,
      price: site.price,
      priceNote: site.price ? null : 'по запросу',
      description: site.description || null,
      images: site.images.map((source, index) =>
        image(`products/${slug}`, index + 1, source, index ? `${name}, фото ${index + 1}` : name),
      ),
      kind: pick.kind,
      sourceUrl: url,
    });
  }
  return products;
}

// ---------- 3. Проекты ----------
async function buildProjects() {
  const projects = [];
  for (const pick of PROJECTS) {
    const { url, html } = await page(`projects/${pick.page}/`);
    const photos = parseGallery(html).filter((item) => item.title === pick.match);
    if (!photos.length) throw new Error(`${url}: нет фото с подписью «${pick.match}»`);
    if (pick.cover) photos.sort((a, b) => Number(b.src.includes(`/${pick.cover}`)) - Number(a.src.includes(`/${pick.cover}`)));
    if (pick.city && !normalize(pick.match).includes(normalize(pick.city).slice(0, 5)))
      throw new Error(`${pick.slug}: город ${pick.city} не из подписи`);
    projects.push({
      id: pick.slug,
      slug: pick.slug,
      title: pick.title,
      client: null,
      city: pick.city,
      year: null,
      direction: pick.direction,
      industry: pick.industry,
      summary: `${pick.match}.${pick.extra ? ` ${pick.extra}` : ''}`,
      scope: pick.scope,
      images: photos.slice(0, 4).map((photo, index) =>
        image(`projects/${pick.slug}`, index + 1, photo.src, index ? `${pick.match}, фото ${index + 1}` : pick.match),
      ),
      sourceUrl: url,
    });
  }
  if (PROJECTS.some((p) => p.extra)) await verify('services/dizayn-proekt/dizayn-magazina/', ['по дизайн-проектам выполненными нашими сотрудниками']);
  return projects;
}

// ---------- 4. Компания ----------
const CLIENT_SLUGS = {
  Сбербанк: 'sberbank', Эрмитаж: 'hermitage', Газпром: 'gazprom', Северсталь: 'severstal', Knauf: 'knauf', Makita: 'makita',
  Ford: 'ford', Tikkurila: 'tikkurila', 'Natur Produkt': 'natur-produkt', 'Театр Ленсовета': 'lensovet-theatre',
};

async function buildCompany(projects) {
  const home = await page('');
  const about = `${ORIGIN}/company/`;
  const production = `${ORIGIN}/company/nashe-proizvodstvo/`;
  const contacts = `${ORIGIN}/company/contacts/`;

  await verify('', ['ДВК Стиль © 1998', 'ООО "ДВК Стиль"']);
  const promiseUrl = await verify('', ['Закажите бесплатный подбор', 'оборудования для решения', 'Мы свяжемся с вами в течение 2х часов']);

  const cycle = [
    {
      id: 'measure', title: 'Замер и планировка',
      text: 'Выезд специалиста на замер в тот же день; выезд на место монтажа для ознакомления с помещением — бесплатно.',
      sourceUrl: await verify('services/zamer/zamer-i-planirovka/', ['Выезд специалиста на замер в этот - же день', 'для ознакомления с помещением - бесплатно']),
    },
    {
      id: 'design', title: 'Дизайн-проект',
      text: 'Дизайн-проект любой сложности; при заказе оборудования для магазина дизайн-проект магазина предоставляется бесплатно.',
      sourceUrl: await verify('services/dizayn-proekt/dizayn-magazina/', ['разработке дизайн-проекта любой сложности']),
    },
    {
      id: 'production', title: 'Собственное производство',
      text: 'Производство в одном из цехов «Ижорских заводов» в Колпино, на современном немецком оборудовании.',
      sourceUrl: await verify('company/nashe-proizvodstvo/', ['производственной базе военно-промышленного комплекса «Ижорские заводы»', 'в одном из цехов', 'на современном немецком оборудовании']),
    },
    {
      id: 'delivery', title: 'Доставка',
      text: 'Свой парк грузового автотранспорта и доставка по всей России; транспортные компании или самовывоз со склада в Санкт-Петербурге и Москве.',
      sourceUrl: await verify('services/transportnye-uslugi/dostavka-transportom-dvk-elit/', ['Свой парк грузового автотранспорта', 'по всей территории России']),
    },
    {
      id: 'install', title: 'Монтаж и такелаж',
      text: 'Монтаж (сборка) и такелаж торгового оборудования, сейфов, металлической мебели и стеллажей силами обученных сотрудников.',
      sourceUrl: await verify('services/montazh-takelazh/montazh/', ['профессиональный монтаж (сборку), такелаж', 'все они прошли обучение', 'торгового оборудования, сейфов, металлической мебели, стеллажей']),
    },
  ];
  await verify('services/transportnye-uslugi/dostavka-transportom-tk-samovyvoz/', ['со склада в Санкт — Петербурге и Москве']);
  await verify('projects/dizayn_magazinov/', ['дизайн-проект магазина предоставляется бесплатно']);
  await verify('company/contacts/', ['Схема проезда на производство', 'Колпино']);

  const branding = await page('catalog/brendirovanie-oborudovaniya/');
  const brandingText = siteSentence(branding.html, 'Оформление торгового оборудования позволяет привлечь внимание покупателей');
  if (!brandingText) addTodo('текст услуги «Брендирование оборудования» — на сайте есть только раздел каталога без описания');

  const services = [
    { id: 'branding', title: 'Брендирование оборудования', text: brandingText ?? '[уточнить]', sourceUrl: branding.url },
    {
      id: 'gov-orders', title: 'Госзаказы и тендеры',
      text: 'Более 9 лет участвует в тендерах, аукционах и конкурсах государственных и частных компаний; зарегистрированы на «ЭТП ГПБ», «Сбербанк-АСТ», в тендерах ОАО «РЖД».',
      sourceUrl: await verify('services/goszakazy-tendery/podgotovka-tekhzadaniya/', ['уже более 9 лет активно принимает участие в тендерах, аукционах, конкурсах государственных и частных компаний', '«ЭТП ГПБ»', '«Сбербанк АСТ»', 'Тендеры ОАО «РЖД»']),
    },
    {
      id: 'tender-specs', title: 'ТЗ к тендерам',
      text: 'Подготовка технического задания к тендерам и аукционам по заявкам государственных предприятий, в том числе по 44-ФЗ.',
      sourceUrl: await verify('services/goszakazy-tendery/podgotovka-tekhzadaniya/', ['Подготовка технического задания к тендерам, аукционам по заявкам государственных предприятий', 'ТЕХНИЧЕСКОЕ ЗАДАНИЕ НА ЗАКУПКУ ПО 44-ФЗ']),
    },
    {
      id: 'shop-design', title: 'Дизайн магазина',
      text: 'Чертежи по пожеланиям заказчика, 3D-моделирование и выезд дизайнера на место.',
      sourceUrl: await verify('projects/dizayn_magazinov/', ['составление чертежей по Вашим предпочтениям, 3D-моделирование и выезд дизайнера на место']),
    },
  ];

  // Клиенты: логотипы с главной + названия из текста «О компании».
  const $home = cheerio.load(home.html);
  const clients = [];
  $home('img[src*="/999_60_1/"]').each((_, img) => {
    const name = squash($home(img).attr('alt'));
    if (!name || clients.some((c) => c.name === name)) return;
    const slug = CLIENT_SLUGS[name];
    if (!slug) throw new Error(`логотип «${name}»: нет slug в CLIENT_SLUGS`);
    clients.push({ name, logo: image('company/clients', slug, originalImageUrl($home(img).attr('src')), `Логотип: ${name}`), sourceUrl: home.url });
  });
  await verify('company/', ['Сбербанк РФ, ВТБ 24, Санкт-Петербургский Метрополитен', '"К-РАУТА"', '"ПИТ Продукт", ФГУП "Гознак"']);
  for (const name of ['ВТБ 24', 'Санкт-Петербургский метрополитен', 'К-Раута', 'ПИТ Продукт', 'ФГУП «Гознак»'])
    clients.push({ name, logo: null, sourceUrl: about });

  // Благодарственные письма: тексты со страницы «Отзывы» (сканов на сайте нет).
  const reviews = await page('reviews/');
  const $r = cheerio.load(reviews.html);
  const letters = [];
  $r('.bxr-element-reviews-v2').each((_, el) => {
    const person = squash($r(el).find('.bxr-element-name').text());
    const position = fixQuotes(squash($r(el).find('.bxr-element-post').text()).replace(/^\(|\)$/g, ''));
    const date = squash($r(el).find('.bxr-element-date').text()) || null;
    const summary = fixQuotes($r(el).find('.bxr-element-preview').text()) || null;
    if (!person) return;
    const role = position ? `, ${position.charAt(0).toLowerCase()}${position.slice(1)}` : '';
    letters.push({ from: `${person}${role}`, person, position: position || null, date, summary, image: null, sourceUrl: reviews.url });
  });
  if (!letters.length) throw new Error('на странице отзывов не найдено писем');

  // Контакты.
  const spbAddress = 'Санкт-Петербург, Колпино, бульвар Победы, дом 1, литера АЕ, помещение 1Н';
  const mskAddress = 'Москва, пер. Вадковского, д. 12, помещение 1';
  await verify('company/contacts/', [
    spbAddress, '+7(812) 461-97-51, 460-83-55, +7(931)236-70-23', 'dvkstyle@inbox.ru',
    'Москва, пер. Вадковского, д.12, помещение 1', '+7 (495) 268-15-21 , +7(931)236-70-23', 'dvkstyle1@yandex.ru', 'https://msk.dvk-style.ru/',
    'ул. Ново-Рыбинская 21', 'ТЦ «Квартал»', 'Южно-Сахалинск, проспект Мира, дом 56 корпус 3, офис 308', 'Краснодар, ул.Севастопольская 2 корп. 3, офис 31',
    'С Понедельника по Пятницу 9-20',
  ]);
  const map = (address) => `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
  const cities = {
    spb: {
      label: 'Санкт-Петербург',
      address: spbAddress,
      phones: ['+7 (812) 461-97-51', '+7 (812) 460-83-55', '+7 (931) 236-70-23'],
      emails: ['dvkstyle@inbox.ru'],
      hours: null,
      mapUrl: map(spbAddress),
      note: 'Производство',
      extraAddresses: [{ address: 'Санкт-Петербург, ул. Ново-Рыбинская, 21, ТЦ «Квартал», м. «Московские ворота»', phones: ['+7 (931) 236-70-23'], note: null }],
      sourceUrl: contacts,
    },
    msk: {
      label: 'Москва',
      address: mskAddress,
      phones: ['+7 (495) 268-15-21', '+7 (931) 236-70-23'],
      emails: ['dvkstyle1@yandex.ru'],
      hours: null,
      mapUrl: map(mskAddress),
      site: 'https://msk.dvk-style.ru/',
      sourceUrl: contacts,
    },
  };
  const representativeOffices = [
    { city: 'Южно-Сахалинск', address: 'Южно-Сахалинск, проспект Мира, дом 56, корпус 3, офис 308', phones: ['+7 (931) 236-70-23'], emails: ['dvkstyle@inbox.ru'], sourceUrl: contacts },
    { city: 'Краснодар', address: 'Краснодар, ул. Севастопольская, 2, корп. 3, офис 31 (цоколь подъезда 3)', phones: ['+7 (931) 236-70-23'], emails: ['dvkstyle1@yandex.ru'], sourceUrl: contacts },
  ];

  // Реквизиты: пары «подпись → значение» со страницы реквизитов.
  const requisitesPage = await page('company/requisites/');
  const lines = parsePageText(requisitesPage.html).text.split('\n');
  const after = (label) => {
    const index = lines.findIndex((line) => line.replace(/:$/, '') === label);
    if (index === -1) throw new Error(`реквизиты: нет «${label}»`);
    return lines[index + 1];
  };
  const digits = (value) => value.replace(/\s/g, '');
  const requisites = {
    fullName: fixQuotes(after('Полное фирменное наименование')),
    shortName: fixQuotes(after('Сокращенное фирменное наименование')),
    legalAddress: after('Юридический адрес'),
    postalAddress: after('Почтовый адрес'),
    inn: digits(after('ИНН')),
    kpp: digits(after('КПП')),
    registrationNumber: digits(after('Свид. о регистрации')),
    okpo: digits(after('ОКПО')),
    okato: digits(after('ОКАТО')),
    okopf: digits(after('ОКОПХ')),
    bank: fixQuotes(after('Банк')),
    account: digits(after('Расчетный счет')),
    corrAccount: digits(after('Кор. счет')),
    bik: digits(after('БИК')),
    phones: ['+7 (812) 460-83-55', '+7 (812) 461-97-51'],
    email: 'dvkstyle@inbox.ru',
    sourceUrl: requisitesPage.url,
  };
  await verify('company/requisites/', ['+7 (812) 460-83-55, 461-97-51', 'dvkstyle@inbox.ru']);

  // Сертификаты и свидетельства (сканы — со страницы «Лицензии и сертификаты»).
  const licenses = await page('company/licenses/');
  const $l = cheerio.load(licenses.html);
  const certificates = [];
  $l('.bxr-image-v1').each((index, el) => {
    const title = squash($l(el).find('.bxr-element-name').text());
    const original = originalImageUrl($l(el).find('img').attr('src'));
    if (!title || !original) return;
    const kind = /дилер/i.test(title) ? 'dealer' : /санитар/i.test(title) ? 'sanitary' : 'conformity';
    certificates.push({ title, kind, image: image('company/certificates', certificates.length + 1, original, title), sourceUrl: licenses.url });
  });

  const heroPhotos = HERO_PHOTOS.map((pick) => {
    const project = projects.find((p) => p.slug === pick.project);
    const photo = project.images[pick.photo - 1];
    return { base: photo.base, alt: photo.alt, w: photo.w, h: photo.h, direction: pick.direction, project: project.slug, sourceUrl: project.sourceUrl };
  });

  const facts = [
    { id: 'izhora', text: 'Производство — в одном из цехов «Ижорских заводов» в Колпино', sourceUrl: production },
    { id: 'german-machines', text: 'Продукция производится на современном немецком оборудовании', sourceUrl: production },
    { id: 'own-fleet', text: 'Свой парк грузового автотранспорта, доставка по всей России', sourceUrl: cycle[3].sourceUrl },
    { id: 'same-day-measure', text: 'Выезд специалиста на замер в тот же день', sourceUrl: cycle[0].sourceUrl },
    { id: 'free-shop-design', text: 'При заказе оборудования для магазина дизайн-проект магазина — бесплатно', sourceUrl: `${ORIGIN}/projects/dizayn_magazinov/` },
    { id: 'tenders', text: 'Более 9 лет участия в тендерах и аукционах', sourceUrl: services[1].sourceUrl },
    { id: 'moscow-office', text: 'Представительство в Москве — с конца 2012 года', sourceUrl: await verify('company/', ['В конце 2012 года для удобства заказчиков было открыто представительство']) },
    { id: 'night-install', text: 'Монтаж в торговых центрах — в том числе ночью', sourceUrl: await verify('services/transportnye-uslugi/dostavka-transportom-dvk-elit/', ['в ночное время для монтажа в торговых центрах']) },
  ];

  addTodo('год основания и стаж: на странице «О компании» года основания нет; там же «за прошедшие 25 лет», на «Наше производство» — «за прошедшие 20 лет», в подвале сайта — «© 1998 - 2026»; нужен год основания и одна цифра стажа');
  addTodo('юридическое лицо: в реквизитах — ООО «ДВК Элит» (ИНН 7817113879), в подвале и текстах — ООО «ДВК Стиль»; какое наименование показывать на сайте');
  addTodo('режим работы: в разметке страницы «Контакты» — «С Понедельника по Пятницу 9-20, Суббота, Воскресенье круглосуточно», похоже на ошибку шаблона; нужен режим работы СПб и Москвы');
  addTodo('стоимость замера: на странице «Замер и планировка» сразу «выезд … бесплатно*» и «Выезд на замеры и подготовка проекта оснащения — 1000 рублей»; какая формулировка верна');
  addTodo('благодарственные письма: на сайте только тексты, сканов нет; нужны сканы или фото писем');
  addTodo('клиенты: на главной 10 логотипов, страница «Партнёры и клиенты» закрыта в robots.txt; нужен полный список клиентов, которых можно показывать');
  addTodo('проекты: у фото на сайте есть только подпись и город; нужны год, заказчик и состав работ по каждому проекту');
  addTodo('фото для hero: оригиналы фото проектов на сайте не крупнее 1586×550 px; для первого экрана нужны фото интерьеров от 1920 px по ширине');
  addTodo('адрес «ул. Ново-Рыбинская, 21, ТЦ «Квартал»» в контактах указан без пояснения; что там — шоурум, офис или склад');
  addTodo('текст политики обработки персональных данных: /company/konfid.php закрыт в robots.txt, текст не взят');
  addTodo('гарантия: общих гарантийных сроков на сайте нет (у части товаров в характеристиках — свои: 12 месяцев, 5–6 лет); нужна формулировка гарантии компании');
  addTodo('число выполненных объектов и сроки производства: на сайте не указаны');
  addTodo('тендеры: на странице «Госзаказы, тендеры» — «согласно Федеральному закону №43 и №223», вероятно опечатка (44-ФЗ); подтвердить');
  addTodo('представительства в Южно-Сахалинске и Краснодаре: показывать ли их на сайте');

  return {
    name: 'ДВК Стиль',
    legalName: 'ООО «ДВК Стиль»',
    years: null,
    foundedYear: null,
    promise: 'Бесплатный подбор оборудования, ответ на заявку в течение 2 часов',
    positioning: 'Проектируем, производим и монтируем — от витрины до детской площадки, по всей России',
    cycle,
    services,
    clients,
    letters,
    cities,
    representativeOffices,
    requisites,
    certificates,
    heroPhotos,
    facts,
    sources: {
      promise: promiseUrl,
      positioning: 'бриф (R13), формулировка редакции',
      about,
      production,
      contacts,
      requisites: requisites.sourceUrl,
      reviews: reviews.url,
      licenses: licenses.url,
    },
    todo,
  };
}

// ---------- запись ----------
function writeJson(relative, value) {
  const file = join(ROOT, relative);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  console.log(`записан ${relative}`);
}

function writeTodoDoc(company, products) {
  const noDims = products.filter((p) => !p.dimensions).map((p) => `${p.name} (${p.sourceUrl})`);
  const lines = [
    '# Что уточнить у заказчика',
    '',
    `Собрано с dvk-style.ru ${TODAY} скриптом \`scripts/collect/collect.mjs\` (файл генерируется). На сайте прототипа такие места показаны видимой пометкой \`[уточнить]\`.`,
    '',
    '## Компания',
    '',
    ...company.todo.map((item) => `- ${item.replace(/^\[уточнить\] /, '')}`),
    '',
    '## Товары',
    '',
    `- Цены: у ${products.filter((p) => p.price === null).length} из ${products.length} товаров цены на сайте нет («Звоните») — в прототипе «по запросу».`,
    `- Габариты: у ${noDims.length} товаров на сайте размеры «подбираются/рассчитываются индивидуально» или указаны не одной тройкой чисел — в прототипе показана строка характеристик как на сайте, схема размеров не строится:`,
    ...noDims.map((item) => `  - ${item}`),
    '- Подсветка: отмечена только у товаров, где она встроена по тексту сайта; у витрин, где подсветка «дополнительно можно заказать», фильтр «Подсветка» её не показывает.',
    '',
    '## Страница политики конфиденциальности',
    '',
    '- `/privacy` в прототипе — заглушка `[уточнить]` до получения текста (см. выше).',
    '',
  ];
  mkdirSync(join(ROOT, 'docs'), { recursive: true });
  writeFileSync(join(ROOT, 'docs/todo-utochnit.md'), `${lines.join('\n')}`);
  console.log('записан docs/todo-utochnit.md');
}

const categories = await buildCategories();
const products = await buildProducts(categories);
const projects = await buildProjects();
const company = await buildCompany(projects);

writeJson('src/data/categories.json', categories);
writeJson('src/data/products.json', products);
writeJson('src/data/projects.json', projects);
writeJson('src/data/company.json', company);
const uniqueJobs = [...new Map(jobs.map((job) => [job.base, job])).values()];
writeJson('scripts/collect/image-jobs.json', uniqueJobs);
writeTodoDoc(company, products);
console.log(`Готово: товаров ${products.length}, проектов ${projects.length}, фото к загрузке ${uniqueJobs.length}, сетевых запросов ${client.stats().requests}.`);
