# Архитектура

Одностраничное приложение (React 19, Vite, Tailwind 4, react-router 7 в `HashRouter`) без бэкенда. Три варианта сайта делят одно ядро и отличаются «кожей».

## Поток данных

`src/data/*.json` (categories, products, projects, company) → единственный читатель `src/core/catalog` (`getProduct`, `queryProducts`, `getCompany`…) → страницы ядра `src/core/pages/` и компоненты вариантов. Прямых `import` JSON вне `catalog` нет. Состояние пользователя — хуки без провайдера (модульный стор + `useSyncExternalStore`, `src/core/kp/persisted-store.js`): `useKp` (`dvk-kp-v1`), `useCity` (`dvk-city`), `useQuiz` (`dvk-quiz-v1`), последний вариант — `dvk-variant`. localStorage всегда в try/catch, без него работает в памяти. Фильтры каталога живут в URL (`useCatalogQuery`, `parseCatalogParams`/`toSearchParams`).

## Ядро и кожи

- Ядро `src/core/` не знает вариантов: оно берёт модуль варианта через реестр `src/core/variants/registry.js` (`VARIANTS`, `getVariant`) и `useVariant()` → `{ id, meta, module, ui }`. `meta.js` варианта (имя и описание) грузится статически, сам модуль — лениво (`load()`), шрифты — вместе с ним.
- Кожа `src/variants/<id>/index.jsx` экспортирует `{ id, Header, Footer, Home, ui, heroConfig }`; `ui` — `Button`, `ProductCard`, `SectionHeading`, `PageHeader`, необязательно `ProductList`, `Reveal`; чего нет — откат на `src/core/ui/base.jsx`.
- Маршруты: `/:variant/…` (`catalog`, `product/:slug`, `solutions/:industry`, `projects`, `about`, `contacts`, `request`, `privacy`); неизвестный вариант и адрес без варианта перенаправляются (`swapVariantInPath`, `fallbackVariantPath` в `src/core/variants/`). Страницы ленивые, корень каждой — `main.page.page-<name>`.
- Внутренние страницы одни на всех: вариант перекрывает их токенами и классами `page-<name>`, а не своей вёрсткой.

## Токены

Вариант задаёт CSS-переменные (`--bg --fg --accent --action --font-* --radius --ease-* --dur-*` и др.) только на `[data-variant="<id>"]`; направления (`retail|landscape|metal`) переопределяют их на `[data-direction]`. `src/styles/index.css` отображает токены в Tailwind `@theme inline`. Фон и `color-scheme` страницы вариант ставит через `:root:has([data-variant="<id>"])`. Порталы — внутрь корня варианта.

## Скролл-видео

`src/core/scroll-video/`: `ScrollVideo` + `useScrollVideo` двигают кадр ролика по прогрессу скролла. Режимы `video` / `placeholder` (нет файла) / `static` (reduced-motion). Один файл на вариант: `public/media/<id>/hero.mp4` (+ `hero-mobile.mp4`, постер). Контракт классов — `contract.js` (`SCROLL_VIDEO_CLASSES`, атрибут `data-mode`): вариант стилизует только эти классы, тест ядра сканирует варианты. Пояснения (`callouts`) и фазы (`phases`) — данные `heroConfig`.

## КП и квиз без бэкенда

КП — список в localStorage (`useKp`, `kpReducer`). Квиз (`src/core/request/`, 4 шага) собирает заявку; `submitRequest` шлёт её на `VITE_FORM_ENDPOINT`, без него возвращает `{ ok: true, demo: true }` и ничего не отправляет. Файл уходит полем `attachment`, КП — текстом `items`. Подключение каталога и заявок к 1С-Битрикс — `docs/bitrix-integration.md`.

## Соглашения

- Только `transform`, `opacity`, `clip-path` в анимациях; движение выключает одно правило `src/core/ui/reduced-motion.css`, подключённое в каждом варианте; в `reduce` задаются конечные состояния.
- Медиазапросы — через `src/core/hooks/media.js` (`useMediaQuery`, `usePrefersReducedMotion`, `useFinePointer`); своих `matchMedia` и `useReducedMotion` из motion в вариантах нет.
- Меню, табы, ловушка фокуса — хуки ядра `useHeaderMenu`, `useTabs`, `useFocusTrap`; `CitySwitch` — общий.
- Слова и подписи — `src/core/ui/format.js` (`wordFor`, `countText`, `UNKNOWN`) и `src/core/catalog/labels.js`; копий в вариантах нет.
- Пути к ассетам — `asset()`; изображения — `srcSet(base)` / `imageSrc` из `src/lib/images.js`.
- Иконки — `lucide-react` или свои SVG; язык интерфейса — русский; факты — только из `src/data/*.json`.
- Вариант пишет только в `src/variants/<id>/`, `public/media/<id>/`, `docs/variants/<id>.md`, `docs/hero-video/<id>.md`; футер содержит «Концепт редизайна dvk-style.ru».
- Переключатель вариантов занимает левый нижний угол (пилюля ниже 900 px): футерам вариантов нужен нижний отступ не меньше 72 px.
- Тесты лежат рядом с кодом (`*.test.js[x]`); вариантные соглашения сторожит `src/variants/conventions.test.js`.
