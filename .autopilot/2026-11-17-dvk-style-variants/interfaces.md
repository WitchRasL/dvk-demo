# Интерфейсы

Читается первым каждым исполнителем. Имена — английские. Код — JavaScript (JSX), без TypeScript; формы описаны JSDoc-подобно.

## Правила проекта

### Стек и команды

- Node 24, npm 11 (уже стоят). Windows, путь проекта с кириллицей и пробелом — всегда в кавычках. Шелл — Git Bash (POSIX) или PowerShell 5.1.
- Зависимости ставит **только T01** (полный список — в тикете 01). Любая другая новая зависимость — `BLOCKED` с причиной.
- `npm install` — установить; `npm run dev` — локально (Vite, адрес с `base` `/dvk-style-redesign/`); `npm run build` — сборка; `npm run preview` — просмотр сборки.
- **Одна команда проверки:** `npm run check` = `vitest run` + `vite build`. Один файл тестов: `npx vitest run src/core/catalog/catalog.test.js`.
- `npm run fetch-images` — скачать и сконвертировать фото (T02).
- `npm run shot -- <url> <out.png> [--width 1440] [--full]` — скриншот через `puppeteer-core` и установленный Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`) (T01). Lighthouse — `npx --yes lighthouse@12 <url> --form-factor=mobile --only-categories=performance,accessibility --chrome-flags="--headless=new" --output=json --output-path=<file>` против `npm run preview`; это инструмент, не зависимость.
- Дизайн-правила impeccable (R05) для тасков, строящих поверхности: прочитать `.claude/skills/impeccable/reference/craft-floor.md`, `.claude/skills/impeccable/reference/mode-persuade.md`, `PRODUCT.md`, свой direction contract в `.impeccable/surfaces/src-variants-<id>-home-jsx.md`, `.autopilot/2026-11-17-dvk-style-variants--wip/reference.md`. Детектор: `.claude/skills/impeccable/scripts/impeccable detect --json <файлы>`. Скиллы и слэш-команды не вызывать — только читать эти файлы и запускать детектор.
- Git: коммит делает оркестратор; исполнитель не делает `git push`, не публикует, не трогает GitHub.

- Язык интерфейса — русский. Факты о компании — только из `src/data/*.json`; неизвестное — видимая строка `[уточнить]`, никогда не правдоподобная выдумка (цены, сроки, гарантии, число объектов, характеристики, отзывы).
- Анимируются только `transform`, `opacity`, `clip-path`. Всё, что движется, имеет вариант для `prefers-reduced-motion: reduce`.
- Все пути к ассетам — через `asset(path)` из `src/lib/base-url.js` (основа — `import.meta.env.BASE_URL`). Никаких абсолютных `/images/...`.
- Иконки — только `lucide-react` или авторские SVG. Без эмодзи и unicode-значков.
- Запрещено: фиолетово-синие градиенты, всё по центру, три одинаковые карточки «иконка + заголовок + текст» как главный приём, стекло как декор, градиентный текст, надпись-eyebrow над заголовком, стоковые люди, Lorem ipsum.
- Вариант пишет только в свою папку `src/variants/<id>/`, `public/media/<id>/`, `docs/variants/<id>.md`, `docs/hero-video/<id>.md`. Ядро не импортирует ничего из `src/variants/` напрямую — только через реестр.
- Ничего из `.impeccable/` (direction contracts) не копируется в исходники, комментарии, data-атрибуты и бандл.

## Границы, решённые в спецификации

### Структура файлов

```
index.html                      <meta name="robots" content="noindex, nofollow">, lang="ru"
vite.config.js                  base: '/dvk-style-redesign/'; plugins: react(), tailwindcss()
public/robots.txt               User-agent: * / Disallow: /
public/images/…                 фото (T02)
public/media/<variant>/…        постеры, заглушки, (позже) hero.mp4
scripts/fetch-images.mjs        (T02)
src/main.jsx                    монтирует <App/> в HashRouter
src/App.jsx                     маршруты
src/styles/index.css            @import "tailwindcss"; @theme — отображение токенов
src/lib/utils.js                export function cn(...inputs)  // clsx + tailwind-merge
src/lib/base-url.js             export function asset(path)    // BASE_URL + path без ведущего '/'
src/lib/images.js               export function srcSet(base)   // `${asset(base)}-800.webp 800w, …-1600.webp 1600w`
src/components/ui/              место для компонентов 21st.dev (пусто + README)
src/core/variants/registry.js
src/core/variants/VariantContext.jsx
src/core/layout/Shell.jsx       шапка/футер варианта + <Outlet/> + VariantSwitcher
src/core/layout/VariantSwitcher.jsx
src/core/catalog/…              (T03)
src/core/kp/…                   (T03)
src/core/city/…                 (T03)
src/core/request/…              (T03)
src/core/scroll-video/…         (T04)
src/core/pages/…                (T05)
src/core/ui/base.jsx            базовый набор компонентов-заглушек (T01), которым пользуются страницы до появления варианта
src/data/{categories,products,projects,company}.json   (T02)
src/variants/<id>/index.jsx     (T05–T07; T01 кладёт рабочую заглушку)
src/variants/<id>/meta.js       имя и описание варианта для панели (T01 пишет, вариант уточняет)
docs/…
```

### Реестр вариантов — `src/core/variants/registry.js`

```js
export const VARIANT_IDS = ['showroom', 'ral', 'blueprint'];
export const DEFAULT_VARIANT = 'showroom';
export const VARIANTS = [
  { id: 'showroom', number: 1, name: 'Шоурум',
    description: { metaphor, palette, fonts, mood, fishka, patterns, directions, wireframe },  // строки, R24
    load: () => import('../../variants/showroom/index.jsx') },
  // ral (2, «Палитра RAL»), blueprint (3, «Чертёж»)
];
export function getVariant(id) // → объект или undefined
```

`description` (и `name`) живут в `src/variants/<id>/meta.js` (`export default { name, description }`), реестр импортирует их статически — это лёгкий файл, чтобы панель переключателя знала все три варианта, не загружая их модули. T01 пишет `meta.js` по `spec.md` («Три варианта»); вариант-тикет уточняет только свой `meta.js`.

### Модуль варианта — `src/variants/<id>/index.jsx`, default export

```js
export default {
  id: 'showroom',
  Header,          // ({ }) => JSX — читает useCity(), useKp(), навигацию из useNav()
  Footer,          // обязательно содержит текст «Концепт редизайна dvk-style.ru»
  Home,            // главная
  ui: {
    Button,        // ({ variant: 'primary'|'secondary'|'ghost', as, href, to, children, ...rest })
    ProductCard,   // ({ product, onQuickView }) — карточка-«витрина» (R36), кнопка «В запрос КП»
    SectionHeading,// ({ as='h2', title, lead }) — без eyebrow
    PageHeader,    // ({ title, lead, breadcrumbs }) — шапка внутренней страницы
    ProductList,   // необязательно: ({ products, onQuickView }) — замена сетки карточек (V3 — таблица-спецификация)
    Reveal,        // необязательно: ({ children, as, delay }) — появление по скроллу в моушн-языке варианта; откат — core/ui/base
  },
  heroConfig,      // см. ScrollVideo ниже
};
```

CSS варианта импортируется в его `index.jsx` и задаёт токены на `[data-variant="<id>"]`. Shell ставит `data-variant` на корневой элемент, а `data-direction` — на страницах каталога/товара/отрасли.

### Токены (CSS-переменные варианта)

`--bg --surface --surface-2 --fg --fg-muted --line --accent --accent-fg --action --action-fg --focus --font-display --font-body --font-mono --radius --radius-lg --shadow --ease-out --ease-in-out --dur-fast --dur-base --dur-slow`

`src/styles/index.css` отображает их в `@theme` (`--color-bg: var(--bg)` … `--font-display: var(--font-display)`), чтобы работали классы `bg-bg text-fg border-line font-display` и т. п. Направление переопределяет любые из них на `[data-variant="<id>"] [data-direction="retail|landscape|metal"]`.

### Контекст варианта — `src/core/variants/VariantContext.jsx`

```js
export function VariantProvider({ id, children })
export function useVariant()  // → { id, meta /* из реестра */, module /* default export варианта */, ui /* module.ui с откатом на core/ui/base */ }
export function useSwitchVariant() // → (nextId) => navigate на тот же путь и query с новым первым сегментом
```

Последний вариант хранится в `localStorage['dvk-variant']` (обёртка try/catch).

### Маршруты — `src/App.jsx`

| Путь | Страница (из `src/core/pages/`) |
|---|---|
| `/` | редирект на последний вариант или `showroom` |
| `/:variant` | `module.Home` |
| `/:variant/catalog` | `CatalogPage` (все направления) |
| `/:variant/catalog/:direction/:section?/:category?` | `CatalogPage` |
| `/:variant/product/:slug` | `ProductPage` |
| `/:variant/solutions/:industry` | `SolutionPage` |
| `/:variant/projects` · `/:variant/projects/:slug` | `ProjectsPage` · `ProjectPage` |
| `/:variant/about` | `AboutPage` |
| `/:variant/contacts` | `ContactsPage` |
| `/:variant/request` | `RequestPage` (список КП + квиз) |
| `/:variant/privacy` | `PrivacyPage` (заглушка `[уточнить]`) |
| `*` | `NotFoundPage` |

Неизвестный `:variant` → редирект на `showroom` с тем же остатком пути. Все страницы ленивые (`React.lazy`). Направления: `retail`, `landscape`, `metal`.

### Навигация — `src/core/layout/nav.js`

```js
export function useNav() // → { items: [{ id, label, to, children? }], directions: [{ id, name, to, sections: [{ id, name, to, count }] }] }
// пункты: Каталог (мега-меню по направлениям), Решения (отрасли), Проекты, Производство (/about), Контакты
```

### Данные — `src/data/*.json` (T02 пишет, все читают только через `src/core/catalog`)

```js
// categories.json
{ directions: [{ id: 'retail'|'landscape'|'metal', name, slug, summary,
    sections: [{ id, name, slug, count, sourceUrl,
      categories: [{ id, name, slug, count, sourceUrl }] }] }],
  industries: [{ id, name, slug, directions: [...], summary, sourceUrl,
    series?: [{ name, image?, sourceUrl }] }],      // серии аптек — у industry 'pharmacy'
  aliases: { "<старое название с сайта>": "<category id>" },
  meta: { source: 'https://dvk-style.ru', collectedAt: 'YYYY-MM-DD' } }

// products.json — массив
{ id, slug, name, direction, sectionId, categoryId,
  industries: [], materials: [] /* 'metal'|'glass'|'ldsp'|'wood'|'plastic'|'stone'|… */,
  lighting: 'warm'|'cold'|'rgb'|'none'|null,
  dimensions: { w, h, d, unit: 'mm' } | null,
  load: number|null,                      // кг, для верстаков и стеллажей
  specs: [{ label, value }],
  price: number|null, priceNote: 'по запросу'|null,
  images: [{ base: 'images/products/<slug>/1', alt, w, h }],   // base без суффикса
  kind: 'showcase'|'counter'|'cabinet'|'rack'|'workbench'|'bench'|'playground'|'island'|'other',  // для «Режима чертёж»
  sourceUrl }

// projects.json — массив
{ id, slug, title, client|null, city|null, year|null, direction, industry|null,
  summary, scope: [], images: [{ base, alt, w, h }], sourceUrl }

// company.json
{ name, legalName, years, foundedYear|null, promise,
  positioning,                              // строка из брифа R13
  cycle: [{ id, title, text }],             // 5 шагов
  services: [{ id, title, text }],          // брендирование, госзаказ, ТЗ к тендерам…
  clients: [{ name, logo: { base, w, h }|null }],
  letters: [{ from, summary|null, image: { base, w, h }|null, sourceUrl }],
  cities: { spb: { label, address, phones: [], emails: [], hours|null, mapUrl|null },
            msk: { … } },
  requisites: { … }|null, certificates: [], heroPhotos: [{ base, alt, w, h, direction }],
  todo: ['[уточнить] …'] }
```

### Ядро каталога — `src/core/catalog/index.js` (T03)

```js
export function getDirections()                      // → directions[]
export function getDirection(id) / getSection(dirId, sectionId) / getCategory(id)
export function getIndustries() / getIndustry(slug)
export function getProduct(slug) / getSimilar(product, n=4)
export function getProjects({ direction }={}) / getProject(slug)
export function getCompany()
export function parseCatalogParams(routeParams, searchParams) // → CatalogQuery, мусор отброшен
export function toSearchParams(query)                         // → URLSearchParams (только непустое)
export function queryProducts(query)                          // → { items, total, page, pages, facets }
// CatalogQuery = { direction, section, category, industry, material, light, q, sort: 'relevance'|'name'|'price', page }
// facets = { industry: [{ value, label, count }], material: […], light: […], category: […] }
export const PAGE_SIZE = 24
export function useCatalogQuery() // хук: читает маршрут+URL, возвращает { query, result, setFilter(key, value), reset() }
```

Поиск — без регистра, по `name`, `specs`, названию категории; ё = е.

### Запрос КП — `src/core/kp/index.js` (T03)

```js
export function kpReducer(state, action)   // чистая; actions: add {id, qty}, remove {id}, setQty {id, qty}, clear
export function useKp() // → { items: [{ id, qty, product|null }], count, add(id, qty=1), remove(id), setQty(id, qty), clear(), has(id) }
// хранение: localStorage['dvk-kp-v1']; недоступен — в памяти
```

### Город — `src/core/city/index.js` (T03)

```js
export function useCity() // → { city: 'spb'|'msk', setCity(c), contacts /* company.cities[city] */ }
// localStorage['dvk-city'], по умолчанию 'spb'
```

### Заявка и квиз — `src/core/request/index.js` (T03)

```js
export const QUIZ_STEPS = ['direction', 'object', 'timing', 'contacts']
export function quizReducer(state, action)  // чистая; next/back/set/submitStart/submitOk/submitFail/reset
export function useQuiz()                   // состояние + черновик в localStorage['dvk-quiz-v1']
export function formatPhone(raw)            // → '+7 (XXX) XXX-XX-XX' по мере ввода
export function isPhoneComplete(raw)        // 10 цифр после 7/8
export function validateContacts(values)    // → { field: 'текст ошибки' }
export const FILE_LIMIT = { maxBytes: 10 * 1024 * 1024, types: ['application/pdf','image/jpeg','image/png','.dwg'] }
export function validateFile(file)          // → null | 'текст ошибки'
export async function submitRequest(payload, { endpoint = import.meta.env.VITE_FORM_ENDPOINT, fetchImpl = fetch } = {})
  // → { ok: true, demo: true } без endpoint; { ok: true, demo: false } при 2xx; { ok: false, error } иначе
// payload = { variant, direction, objectType, objectNote, timing, name, phone, email, city, comment, consent, items: [{ id, name, qty, sourceUrl }], file|null }
```

UI квиза и страницы КП — `src/core/pages/RequestPage.jsx` и `src/core/request/Quiz.jsx` (T05), собраны на `ui` варианта и токенах.

### Скролл-видео — `src/core/scroll-video/` (T04)

```js
export function ScrollVideo({
  sources,            // { desktop: 'media/<id>/hero.mp4', mobile?: 'media/<id>/hero-mobile.mp4' }
  poster,             // { base|src, alt } — первый кадр / заглушка
  placeholderLabel = 'Здесь будет видео-интерьер',
  camera,             // для заглушки: { from: { x, y, scale }, to: { x, y, scale } } (x,y в %)
  lengthVh = 350, mobileLengthVh = 220,
  callouts = [],      // [{ id, from: 0..1, to: 0..1, x: 0..1, y: 0..1, title, text }]
  renderCallout,      // (callout, { active, local /* 0..1 внутри отрезка */ }) => JSX — внешний вид от варианта
  renderOverlay,      // (progress) => JSX — заголовок, CTA, крошки
  phases,             // [{ id, label, from, to }] — для индикаторов вроде крошек V1
  className,
})
export function useScrollVideo(ref)          // → { progress, mode: 'video'|'placeholder'|'static', seekTo(p) }
export function progressToTime(p, duration)  // чистая
export function calloutState(p, callout)     // → { active, local }
export function phaseAt(p, phases)
```

Режимы: `video` — файл загрузился; `placeholder` — файла нет или ошибка; `static` — `prefers-reduced-motion` (без закрепления; кадр + список пояснений). Пояснения всегда дублируются упорядоченным списком для скринридеров.

`heroConfig` варианта: `{ sources, poster, camera, callouts, phases, lengthVh, mobileLengthVh }`.

### Страницы ядра — `src/core/pages/` (T05)

Каждая страница берёт `ui` из `useVariant()`, данные из `src/core/catalog`, и оборачивает корень в `<main className="page page-<name>">`, чтобы вариант мог перекрыть стили по классу. Компоненты страниц, которые варианты переиспользуют: `QuickView`, `Filters`, `Breadcrumbs`, `Gallery`, `SpecTable`, `HowWeWork`, `Quiz`, `KpList`, `EmptyState`.

## Тестовые швы

- `src/core/catalog`: `parseCatalogParams`, `toSearchParams`, `queryProducts` (фильтры, поиск, пагинация, фасеты, мусорные параметры).
- `src/core/kp`: `kpReducer`.
- `src/core/request`: `formatPhone`, `isPhoneComplete`, `validateContacts`, `validateFile`, `quizReducer`, `submitRequest` (с подменённым `fetchImpl`).
- `src/core/scroll-video`: `progressToTime`, `calloutState`, `phaseAt`.
- `src/core/variants`: смена варианта сохраняет путь и query (чистая функция `swapVariantInPath(pathname, search, nextId)`).

Команда: `npm test` (Vitest, `--run`).

## Что построили законченные таски

(дописывается по ходу сборки)

### T01 — каркас (коммит готов)

- registry: `VARIANT_IDS`, `DEFAULT_VARIANT`, `VARIANTS[{id, number, name, description, load}]`, `getVariant(id)`, `isVariantId(id)`; описания — `src/variants/<id>/meta.js`.
- paths: `swapVariantInPath(pathname, search, nextId) → string`, `fallbackVariantPath(pathname, search) → string`, `PAGE_ROOTS` · keyboard: `variantForKey(event) → id|null` · storage: `LAST_VARIANT_KEY = 'dvk-variant'`, `readLastVariant(storage?)`, `saveLastVariant(id, storage?)`.
- `VariantProvider({ id, children })` приостанавливается через `use()` — нужен `Suspense`; в тестах `await act(async () => render(…))`. `useVariant() → { id, meta, module, ui }`, `useSwitchVariant() → (nextId) => void`, `loadVariantModule(id)`.
- `src/core/layout/nav.js`: `useNav()` / `buildNav(id)`; `directions: []` — заглушка, достраивает T04. Layout: `Shell`, `VariantSwitcher`, `ErrorBoundary`.
- `src/core/ui/base.jsx`: `Button`, `SectionHeading`, `PageHeader`, `ProductCard`, `ProductList`, `Reveal` (откат для `ui` варианта). `src/core/ui/stub-variant.jsx` (`createStubVariant({ id, css })`) и `src/core/pages/PageStub.jsx` — **временные**: T04 убирает PageStub, когда заменяет страницы; T05–T07 перестают использовать stub-variant (удаляет последний, кто от него отказался — T07 проверяет, что импортов не осталось).
- Страницы — `src/core/pages/<Name>.jsx`, default export.
- lib: `cn`, `asset` (внешние URL и `data:` — как есть), `srcSet(base)`, `imageSrc(base, 800|1600)`.
- CSS: `@theme inline` по всем токенам; доп. классы `rounded-base`, `shadow-base`, `duration-fast|base|slow`.
- Переключатель вариантов занимает левый нижний угол (≈480×50, на телефоне ≈75×46); поднять — `--vs-offset-bottom` на `:root`; **футерам вариантов нужен нижний отступ ≥ 72px**.
- Адрес без варианта (`/contacts`) получает вариант впереди (`/showroom/contacts`).
- react-router закреплён на v7. Основной чанк ~147 КБ gz (motion ~46 КБ): если Lighthouse Performance < 85 — перейти на `LazyMotion` + `m`.

### Правила по итогам ревью T01

- **Порталы** (быстрый просмотр, мега-меню, модалки, выпадашки) рендерятся внутрь корня варианта — элемента `[data-variant]`, а не в `document.body`, чтобы видеть токены варианта.
- **Фон и `color-scheme` страницы** вариант задаёт сам в своём CSS: `:root:has([data-variant="<id>"]) { background: …; color-scheme: dark|light; }` — так overscroll и скроллбар не остаются нейтральными.
- **Хуки ядра работают без провайдера**: `useKp`, `useCity`, `useQuiz` — модульный стор + `useSyncExternalStore` (или эквивалент), без обязательного `<Provider>` над деревом; иначе футеры/шапки вариантов уронят тесты вне своей зоны.

### T03 — ядро (коммит готов)

- **catalog** (`src/core/catalog`): `getDirections`, `getDirection`, `getSection(dirId|null, sec)`, `getCategory(id, sectionId?)`, `getIndustries`, `getIndustry`, `getProduct`, `getProductById`, `getSimilar(p, n=4)`, `getProjects`, `getProject`, `getCompany`; `parseCatalogParams(route, search) → CatalogQuery` (ids; мусор → null/''/1; родители достраиваются), `toSearchParams(q, { withPath = true })`, `queryProducts(q?) → { items, total, page, pages ≥ 1, facets }`; ещё `buildCatalogUrl(variant, q)`, `applyFilter`, `EMPTY_QUERY`, `PAGE_SIZE = 24`, `SORT_LABELS`, `LIGHT_LABELS`, `MATERIAL_LABELS`. `useCatalogQuery() → { query, result, setFilter(key, value), reset({ all }?) }` — direction/section/category живут в пути, reset держит путь. Фасет считается без собственного фильтра; выбранное значение остаётся при count 0.
- **kp**: `kpReducer(state[], action)`, `useKp() → { items[{ id, qty, product|null }], count /* позиций */, totalQty, add, remove, setQty, clear, has }`, `kpItemsToPayload`, `createKpStore`. Общий стор с localStorage — `src/core/kp/persisted-store.js` (им пользуются city и request).
- **city**: `useCity() → { city, setCity, contacts }`, `CITIES`, `createCityStore`. Все хуки ядра — без провайдера (модульный стор + `useSyncExternalStore`, синхронизация вкладок).
- **request**: `QUIZ_STEPS`, `quizReducer` (set{field, value|values} / next / back / submitStart / submitOk{demo} / submitFail{error} / reset), `useQuiz() → { step, stepId, steps, isFirst, isLast, values, errors /* текущего шага после попытки */, status, error, demo, set, next, back, reset, submit({ variant }) → result|null }` — submit сам берёт КП и город. Черновик `dvk-quiz-v1` без файла и согласия. `formatPhone`, `isPhoneComplete`, `validateContacts`, `validateStep`, `validateFile`, `FILE_LIMIT`, `submitRequest(payload, { endpoint, fetchImpl, timeoutMs = 20000 })`; файл уходит полем `attachment`, КП — текстом `items`.
- **scroll-video**: `ScrollVideo({ sources, poster, placeholderLabel, camera, lengthVh, mobileLengthVh, callouts, renderCallout(c, { active, local }), renderOverlay(progress, { seekTo, mode, phase, phaseIndex, phases }), phases, className, listLabel, forceMode })`; `useScrollVideo(ref, { stageRef, videoRef, videoState, forceMode, onFrame }) → { progress, mode, seekTo }`; `progressToTime` (на 1 останавливается за 0.05 с до конца), `calloutState` (конец отрезка исключён), `phaseAt → фаза|null`. Камера: x, y — сдвиг в % кадра, ограничен краем. Dev-демо: `/#/<variant>/__scroll-video`.

### T02 — данные (коммит готов)

Схема `interfaces.md` соблюдена, сверх неё:
- `categories`: значение `aliases` — id категории **или раздела**; `industries[].categoryIds`; у `pharmacy` — `series[{ name, slug, count, image, sourceUrl }]` и `equipmentTypes[{ name, text }]`; `facetLabels{ material, light }`; материалы: `metal|glass|ldsp|mdf|plywood|wood|plastic|concrete`.
- `products[].description` — текст описания с сайта. 35 товаров: ритейл 12, благоустройство 12, металл 11.
- `projects`: 9 проектов; галереи — из `/upload/medialibrary/` (тоже оригиналы).
- `company`: `facts[{ id, text, sourceUrl }]`, `representativeOffices`, `cities.*.sourceUrl` / `extraAddresses`, `letters[{ from, person, position, date, summary, image /* у всех null — сканов нет */, sourceUrl }]`, `certificates[{ title, kind, image, sourceUrl }]`, полные `requisites`, `sources`; `years` и `foundedYear` = null (на сайте расходится 20/25 лет); `cities.*.hours` = null; `heroPhotos[].base` — фото проектов (оригиналы 1000–1586 px по ширине, с водяным знаком).
- `company.todo` — 14 пунктов `[уточнить]` (также `docs/todo-utochnit.md`).
- Скрипты: `node scripts/collect/collect.mjs`, затем `npm run fetch-images`; повторный запуск идёт из кэша.

### T04 — страницы (коммит готов)

- `buildNav(id)` / `useNav() → { items:[{ id, label, to, children? }], directions:[{ id, name, to, summary, sections:[{ id, name, to, count }] }] }`.
- `ui` (base.jsx), состав тот же: `Button` (+ `size 'md'|'sm'`, `loading`, `disabled`), `PageHeader` (+ `children`), `ProductList` (+ `layout 'rail'|'grid'`), `ProductCard` с «В запрос КП».
- Новое в `src/core/ui/`: `AddToKp { product, mode 'card'|'full' }`, `Breadcrumbs { items }`, `QuantityStepper`, `form { Field, FieldError, fieldClass }`, `layout { Container }`, `format { plural, formatPrice, formatDimensions, toTel, materialLabel }`.
- `src/core/pages/parts/index.js`: `Breadcrumbs`, `EmptyState`, `Filters`, `Gallery { images, name, layout 'stage'|'stack' }`, `HowWeWork`, `Pagination`, `QuickView`, `useQuickView() → { openQuickView, quickView }`, `RequestCta { title, lead }`, `SpecTable`, `buildSpecRows`, `usePageTitle`. `src/core/request/`: `Quiz`, `KpList`, `goToQuiz()`.
- Хуки для вариантов: `main.page.page-<name>` (catalog, product, solution, projects, project, about, contacts, request, privacy, not-found); `data-direction` на каталоге/товаре/отрасли/проектах; CSS-переменные `--stage`, `--danger`, `--page-sticky-top`; стили страниц — `src/core/pages/pages.css`.
- Каталог на телефоне — вертикальный список; горизонтальный scroll-snap — у рядов (похожие, товары отрасли, серии, чипы разделов).
- Числа у разделов (408, 1133…) — товары на dvk-style.ru, в прототипе 35; на страницах разделов это сказано словами.
- `base: '/dvk-demo/'`, адрес Pages `https://witchrasl.github.io/dvk-demo/`.
- Lighthouse через `npx` в этой среде запрещён — не запускать.

## Итоги T05 «Шоурум» (0239be5) и T08 (ea6a4c1)

- `src/variants/showroom/index.jsx` → `{ id:'showroom', Header, Footer, Home, ui:{Button, ProductCard, SectionHeading, PageHeader, Reveal}, heroConfig }`. Токены на `[data-variant="showroom"]`, свет направлений на `[data-direction]`, фон страницы через `:root:has([data-variant="showroom"])`. Экраны главной — `home/{Hero,Bento,Cycle,Industries,Showcase,Projects,Trust,RequestScreen}.jsx`. `pages.css` — заготовка внутренних страниц, по G03 не развивается.
- Hero работает в режиме заглушки (ролика нет); раскадровка и промпт под Higgsfield — `docs/hero-video/showroom.md`, отрезки пояснений — `hero-config.js`.
- Детектор impeccable запускать через `sh`, не `node`. Полностраничный скриншот снимать после прокрутки страницы (иначе ленивые фото и появления не срабатывают).
- `stub-variant.jsx` вариантом не импортируется.
- T08: `docs/bitrix-integration.md` — три пути подключения каталога к 1С-Битрикс; рекомендован путь 2 (данные при сборке). Схема данных не менялась; предложены поля `externalId`, `oldprice` — на этап полного сайта.

## Итоги T07 «Чертёж»

- `src/variants/blueprint/index.jsx` → `{ id:'blueprint', Header, Footer, Home, ui:{Button, ProductCard, ProductList, SectionHeading, PageHeader, Reveal}, heroConfig }`. `ui.SectionHeading` принимает доп. `id`; `ui.ProductList` с `layout='grid'` — таблица-спецификация.
- `lib/drawing.js`: `designation(product)`, `drawingSpec(product)`, `SHEET_TYPES`, `materialsText`, `glassNote(product)`; `lib/hero.js`: `heroConfig`, `mapPhotoPoint(point, photo, view, camera, p)`.
- Главная — 8 листов (`home/sheets.js`, `Sheet.jsx`, `CornerStamp.jsx`); фишка «Режим чертёж» — `drawing/{ProductMedia,ProductBlueprint,Drawing}.jsx`.
- Раскадровка и промпт под Higgsfield — `docs/hero-video/blueprint.md`.

## Итоги T06 «Палитра RAL» (61bfcba)

- `src/variants/ral/index.jsx` → `{ id:'ral', Header, Footer, Home, ui:{Button, ProductCard, ProductList, SectionHeading, PageHeader, Reveal}, heroConfig }`.
- Поле сайта — `data-field` на шапке (остальное красится через `:has()`); свой цвет блока — `data-field-scope`. Выбор направления хранится в `localStorage['dvk-ral-field']` (`field-store.js`). Цвета — `palette.js` (экранные приближения RAL), бирки — `label.js`.
- Главная — 8 экранов: `home/{Hero,FanSection,Showcase,Cycle,Solutions,Projects,Proof,RequestSection}.jsx`; фишка «Веер направлений» — `Fan.jsx` (круг clip-path от точки нажатия → каталог направления; на телефоне scroll-snap; reduced-motion — мгновенно).
- Ролик ожидается в `public/media/ral/hero.mp4` и `hero-mobile.mp4`; раскадровка и промпт под Higgsfield — `docs/hero-video/ral.md`.

## Итоги F1 — ремонт ветки (общее для трёх вариантов; дублировать в варианте нельзя)

- **Скролл-видео, контракт для вариантов** (`src/core/scroll-video/contract.js`, экспорт из `index.js`): `SCROLL_VIDEO_CLASSES = { root: 'scroll-video', stage: '…__stage', poster: '…__poster', video: '…__video', callouts: '…__callouts', callout: '…__callout', label: '…__label', overlay: '…__overlay', list: '…__list' }`, `SCROLL_VIDEO_MODE_ATTRIBUTE = 'data-mode'`, `findScrollVideoStage(el)`, `findScrollVideoRoot(el)`. Варианту разрешено стилизовать эти элементы и ставить CSS-переменные на root и stage; классы вне контракта — нельзя (тест ядра сканирует варианты).
- **Медиазапросы** (`src/core/hooks/media.js`): `matchesMedia(query)`, `useMediaQuery(query)`, `usePrefersReducedMotion()`, `useFinePointer()`, `prefersReducedMotion()`, `hasFinePointer()`. В вариантах нет своих `matchMedia` и `useReducedMotion` из motion. Отключение движения в CSS — одно правило `src/core/ui/reduced-motion.css` (подключено в `index.jsx` каждого варианта); в варианте под `reduce` задаются только конечные состояния.
- **Шапка и табы** (`src/core/hooks/`): `useHeaderMenu({ containerRef, keepOnOutsidePress? }) → { open, isOpen(name), show(name), toggle(name), close(), panelId(name), triggerProps(name) }`; `useTabs({ count, initial?, orientation? }) → { selected, select(index, { focus? }), listProps, tabProps(index), panelProps }`; `useFocusTrap(ref, { active?, include?, initialFocus? })`, `focusableIn(container)`. `src/core/ui/CitySwitch.jsx`: `CitySwitch({ className, buttonClassName, labels, label = 'Город' })`.
- **Слова и подписи**: `src/core/ui/format.js` — `UNKNOWN` («[уточнить]»), `WORD_FORMS{position,product,series,section,project}`, `wordFor(count, word)`, `countText(count, word)`, `materialLabel`, `lightLabel`. `src/core/catalog` — `MATERIAL_LABELS`, `LIGHT_LABELS` (единственный источник — `labels.js`), `getDirectionTotal(direction|id)`, `getFactText(id) → текст|'[уточнить]'`, `getCycleStep(id)`. Поле `facetLabels` из `categories.json` и сборщика удалено (строка о нём в итогах T02 выше устарела).
- `src/variants/conventions.test.js` следит: в CSS вариантов переходы только по transform/opacity/clip-path; нет копий форм слов, суммы позиций и маркера; нет своих matchMedia. `ral/field-store.js`: `cancelRepaint()`. `src/core/ui/stub-variant.jsx` удалён.

## Итоги T10 — «Палитра RAL», ролик и полировка

- `ral/hero.js`: `heroSceneFor(direction) → scene` (`heroConfig` — сцена ролика; у сцены `id, media, focus, caption{lead,text,short}`), `framePoint([u,v], media, view, focus?) → {x,y}`, `placeCallouts(scene, view) → callouts[{…, x, y, dx, dy}]`, `paintedLetters(progress, phase, letters)`, `PAINT_SPAN`. Ролик — для поля грунта и ритейла; в полях благоустройства и металла — фото проекта направления и три пояснения уровня фаз.
- `DirectionSwatch` ставит `aria-current="true"` текущему полю; `FIELDS[dir].short` — короткое имя для лопасти на телефоне.
- Файлы ролика: `public/media/ral/{hero.mp4,hero-mobile.mp4,hero-poster.jpg}`; подпись кадра — «Доработанное фото проекта ДВК: …».

## Итоги T11 — «Чертёж», ролик и полировка

- `blueprint/lib/hero.js`: `calloutPoint(callout, p) → {x, y}` (точка едет за деталью; у выноски есть `end: {x, y}`), `heroSource`, `heroCaption()`; `heroConfig.poster = { src, alt, w, h }` (поля `base` больше нет).
- `blueprint/lib/drawing.js`: `drawingSpec()` дополнен `schematic`, `parts {pedestal, screen, levels}`, шаблонами `'carousel'` и `'bench-arc'`; `SCHEMATIC_LABEL` («Габаритная схема»).
- Переключатель вариантов (`src/core/layout/variant-switcher.css`) сворачивается в пилюлю ниже 900 px — во всех вариантах.
- Файлы ролика: `public/media/blueprint/{hero.mp4,hero-mobile.mp4,hero-poster.jpg}`.

## Итоги T09 — «Шоурум», ролик и полировка

- `showroom/hero-config.js`: `HERO_FRAME {width,height}`, `HERO_FOCUS`, `frameToStage(point, stage, focus?) → {x,y,visible}`, `HERO_POSTERS {first, lit}`, `HERO_CREDIT {text,to}`, `HERO_PROJECT`; у пояснений `side`/`grow`, `x`/`y` — доли кадра ролика; `heroConfig.poster = { src, alt }`. `HERO_LAMPS` работают, только если ролик не загрузился.
- `showroom/media-kind.js`: `photoKind(product) → 'photo'|'product'`, `displayName(name)` (ёлочки).
- Файлы ролика: `public/media/showroom/{hero.mp4,hero-mobile.mp4,hero-poster.jpg,hero-lit.jpg}`.
