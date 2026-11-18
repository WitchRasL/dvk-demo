// Разбор страниц dvk-style.ru (шаблон Bitrix BXR Business). Только чтение HTML, без сети.
import * as cheerio from 'cheerio';

export const ORIGIN = 'https://dvk-style.ru';

const squash = (text) => String(text ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

export function absolute(href) {
  if (!href) return null;
  return new URL(href.trim(), `${ORIGIN}/`).href.replace('://www.', '://');
}

/** «ВИТРИНЫ (178)» → { name: 'ВИТРИНЫ', count: 178 } */
export function splitCount(label) {
  const match = squash(label).match(/^(.*?)\s*\((\d+)\)$/);
  return match ? { name: match[1], count: Number(match[2]) } : { name: squash(label), count: null };
}

/**
 * Оригинал фото по адресу миниатюры: /upload/resize_cache/iblock/595/<dir>/500_375_1/f.jpg → /upload/iblock/595/<dir>/f.jpg.
 * Сжатые копии модуля dev2fun (webp с другим именем) восстановить нельзя — для них null.
 */
export function originalImageUrl(src) {
  if (!src) return null;
  const url = absolute(src);
  const { pathname } = new URL(url);
  if (/^\/upload\/(iblock|medialibrary)\//.test(pathname)) return url;
  const resized = pathname.match(/^\/upload\/resize_cache\/(iblock|medialibrary)\/(.+)\/\d+_\d+_\d+\/([^/]+)$/);
  if (resized) return `${ORIGIN}/upload/${resized[1]}/${resized[2]}/${resized[3]}`;
  return null;
}

/** Дерево каталога с числом товаров — блоки «bxr-section-horizontal-v2» на главной. */
export function parseCatalogTree(html) {
  const $ = cheerio.load(html);
  const sections = [];
  $('.bxr-section-horizontal-v2').each((_, block) => {
    const head = $(block).find('.bxr-element-name a').first();
    const { name, count } = splitCount(head.text());
    const children = $(block)
      .find('.bxr-child li a')
      .map((__, a) => ({ ...splitCount($(a).text()), url: absolute($(a).attr('href')) }))
      .get();
    sections.push({ name, count, url: absolute(head.attr('href')), children });
  });
  return sections;
}

/** Третий уровень меню (мобильное меню «data-parent»): родитель → дочерние пункты. */
export function parseMenuChildren(html) {
  const $ = cheerio.load(html);
  const byParent = {};
  $('ul[data-parent]').each((_, ul) => {
    const parent = $(ul).find('.child-title a').first();
    const parentUrl = absolute(parent.attr('href'));
    if (!parentUrl || !parentUrl.includes('/catalog/')) return;
    const items = $(ul)
      .children('li')
      .children('a.root-item')
      .map((__, a) => ({ name: squash($(a).text()), url: absolute($(a).attr('href')) }))
      .get();
    if (items.length) byParent[parentUrl] = items;
  });
  return byParent;
}

/** Карточки товаров на странице категории: [{ name, url, image }]. */
export function parseProductList(html) {
  const $ = cheerio.load(html);
  const seen = new Map();
  $('a[href^="/catalog/"]').each((_, a) => {
    const href = $(a).attr('href');
    if (!/^\/catalog\/[^/]+\/[^/]+\/$/.test(href)) return;
    const url = absolute(href);
    const entry = seen.get(url) || { url, name: null, image: null };
    const text = squash($(a).text());
    if (text && !/^(купить|подробнее|заказать)$/i.test(text) && !entry.name) entry.name = text;
    const img = $(a).find('img').attr('src') || $(a).find('img').attr('data-src');
    if (img && !entry.image) entry.image = absolute(img);
    seen.set(url, entry);
  });
  return [...seen.values()];
}

/** Карточка товара. */
export function parseProduct(html, url) {
  const $ = cheerio.load(html);
  const detail = $('.bxr-element-detail').first();
  const name = squash(detail.find('meta[itemprop="name"]').attr('content') || $('h1').first().text());

  const priceNode = detail.find('.bxr-current-price[itemprop="price"]').first();
  const priceValue = priceNode.attr('content');
  const price = priceValue && Number(priceValue) > 0 ? Number(priceValue) : null;
  const oldPriceText = squash(detail.find('.bxr-old-price').first().text()).replace(/[^\d]/g, '');
  const oldPrice = oldPriceText ? Number(oldPriceText) : null;

  const categories = detail
    .find('.parcat a')
    .map((_, a) => ({ name: squash($(a).text()), url: absolute($(a).attr('href')) }))
    .get();

  const specs = [];
  detail.find('.bxr-props-table tr').each((_, tr) => {
    const label = squash($(tr).find('.bxr-props-name').text());
    const value = squash($(tr).find('.bxr-props-data').text());
    if (label && value) specs.push({ label, value });
  });

  const descriptionNode = detail.find('[itemprop="description"]').first();
  descriptionNode.find('br').replaceWith('\n');
  const description = descriptionNode
    .text()
    .split('\n')
    .map(squash)
    .filter(Boolean)
    .join('\n');

  const images = [];
  const pushImage = (src) => {
    const original = originalImageUrl(src);
    if (original && !images.includes(original)) images.push(original);
  };
  detail.find('.bxr-element-slider-main img, .bxr-element-slider-nav img').each((_, img) => pushImage($(img).attr('src')));
  detail.find('.bxr-element-slider-main a, .bxr-element-slider-nav a').each((_, a) => pushImage($(a).attr('href')));

  return { url, name, price, oldPrice, categories, specs, description, images };
}

/** Галерея medialibrary (страницы проектов, писем): [{ src, title, caption }]. */
export function parseGallery(html) {
  const $ = cheerio.load(html);
  return $('.gallery-medialibrary-list-item a[href]')
    .map((_, a) => ({
      src: originalImageUrl($(a).attr('href')),
      title: squash($(a).attr('title')),
      caption: squash($(a).find('img').attr('title')),
    }))
    .get()
    .filter((item) => item.src);
}

/** Заголовок и вводный текст страницы. */
export function parsePageText(html, selector = '.bxr-content') {
  const $ = cheerio.load(html);
  $('script, style, noscript, form, .modal').remove();
  const root = $(selector).first();
  root.find('br').replaceWith('\n');
  root.find('p, li, h2, h3, h4, div, tr').each((_, el) => {
    $(el).prepend('\n');
    $(el).append('\n');
  });
  const text = root
    .text()
    .split('\n')
    .map(squash)
    .filter(Boolean)
    .join('\n');
  return { title: squash($('h1').first().text()), text };
}
