import { describe, expect, it } from 'vitest';
import { isAllowed, parseRobots } from './robots.mjs';

// Фрагмент настоящего https://dvk-style.ru/robots.txt (ноябрь 2026).
const DVK_ROBOTS = `User-Agent: *
Disallow: */index.php
Disallow: /bitrix/
Disallow: */filter/
Disallow: /*partners_and_clients
Disallow: /*search
Disallow: /*?
Disallow: /include/
Allow: */upload/
Allow: /bitrix/*.js
Allow: /local/*.jpg
sitemap: https://dvk-style.ru/sitemap.xml
`;

describe('robots.txt', () => {
  const rules = parseRobots(DVK_ROBOTS);

  it('пускает в обычные страницы каталога и в /upload/', () => {
    expect(isAllowed(rules, 'https://dvk-style.ru/catalog/vitriny/')).toBe(true);
    expect(isAllowed(rules, '/upload/iblock/7a1/abc.jpg')).toBe(true);
  });

  it('закрывает адреса с query-строкой, фильтры, поиск и служебные разделы', () => {
    expect(isAllowed(rules, 'https://dvk-style.ru/catalog/vitriny/?PAGEN_1=2')).toBe(false);
    expect(isAllowed(rules, '/catalog/vitriny/filter/price-from-10/')).toBe(false);
    expect(isAllowed(rules, '/about/partners_and_clients/')).toBe(false);
    expect(isAllowed(rules, '/search/')).toBe(false);
    expect(isAllowed(rules, '/bitrix/admin/')).toBe(false);
    expect(isAllowed(rules, '/catalog/index.php')).toBe(false);
  });

  it('более длинное Allow побеждает короткое Disallow', () => {
    expect(isAllowed(rules, '/bitrix/js/main/core.js')).toBe(true);
    expect(isAllowed(rules, '/bitrix/css/main.css')).toBe(false);
  });

  it('понимает якорь $ и правила для других роботов не применяет', () => {
    const custom = parseRobots(`User-agent: Yandex
Disallow: /
User-agent: *
Disallow: /*.php$
`);
    expect(isAllowed(custom, '/konfid.php')).toBe(false);
    expect(isAllowed(custom, '/konfid.php.html')).toBe(true);
    expect(isAllowed(custom, '/catalog/')).toBe(true);
  });

  it('пустой robots.txt разрешает всё', () => {
    expect(isAllowed(parseRobots(''), '/anything?x=1')).toBe(true);
  });
});
