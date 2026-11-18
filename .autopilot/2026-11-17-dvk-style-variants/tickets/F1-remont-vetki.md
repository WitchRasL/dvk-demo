# F1 — Ремонт ветки: находки код-ревью

**Требования:** R56, R57, R61, G03
**Зависит от:** —
**Зона:** `src/core/ui/` · `src/core/catalog/` · `src/core/pages/CatalogPage.jsx` · `src/core/pages/parts/Filters.jsx` · `src/core/scroll-video/` · `src/core/hooks/` · `src/variants/` · `docs/variants/` · `scripts/collect/` · `src/data/categories.json`
**Волна:** 5
**Ревью:** да — ремонт ветки
**Модель:** сильная

## Что должно заработать

Сайт выглядит и ведёт себя как до правки (три главные страницы — без видимых изменений), но то, что три варианта решали тремя разными способами, решено один раз в ядре; найденные дыры доступности закрыты; мёртвый код убран. Объём не расширяется: новых экранов, страниц и оформления не добавлять (G03).

## Из брифа, дословно

> «анимируются только transform, opacity и clip-path»
> «семантичная разметка, стили фокуса, alt-тексты из названий товаров»
> ««Фишка» выбранного концепта работает полноценно. У неё есть упрощённая мобильная версия и вариант для `prefers-reduced-motion`.»
> «Полностью пока сайт не создавай, нужны главные страницы, чтобы можно было выбрать и показать заказчику»

## Разделы спецификации

«Решения по реализации»; `interfaces.md` → «Модуль варианта», «Токены», «Скролл-видео», запреты, итоги T03–T07.

## Критерии приёмки — находки ревью, дословно

Ядро:

- [ ] **K1.** `src/core/ui/stub-variant.jsx:104` — временная заглушка варианта (`createStubVariant`) не импортируется нигде. Условие: файла нет, `grep -rn "stub-variant\|createStubVariant" src tests scripts` пуст, `npx vitest run` и `npx vite build` зелёные.
- [ ] **K2.** `src/core/catalog/query.js:13` + `src/core/ui/format.js:39` + `src/data/categories.json:1291` — подписи материалов живут в трёх таблицах; `facetLabels` в данных (пишет `scripts/collect/collect.mjs:272`) не читает никто; в `MATERIAL_LABELS` нет mdf/plywood/concrete, хотя concrete и plywood есть в `products.json` — `queryProducts().facets.material[].label` отдаёт сырые `concrete`/`plywood` и по ним же сортирует; вызывающие латают поверх: `src/core/pages/parts/Filters.jsx:194`, `src/core/pages/CatalogPage.jsx:76`. Условие: подписи материалов берутся из одного источника; для каждого материала, встречающегося в `products.json`, фасет возвращает русскую подпись (тест на это есть); `Filters.jsx` и `CatalogPage.jsx` подпись фасета не подменяют; `materialLabel` для вариантов остаётся, но читает тот же источник. То же расхождение у подсветки (`LIGHT_LABELS` «Тёплый свет» против `facetLabels.light` «Тёплая подсветка») — закрыть той же правкой.

Варианты:

- [ ] **V1.** `src/variants/showroom/home/Hero.jsx:142`, `src/variants/ral/home/Hero.jsx:107`, `src/variants/blueprint/home/Hero.jsx:27-28` (+ CSS: `showroom/home.css:2004`, `ral/home/home.css`, `blueprint/blueprint.css` — правила на `.scroll-video__list/__stage/__label/__poster/__callouts`) — все три hero достают сцену ядра через `closest('.scroll-video__stage')` и стилизуют внутренние классы ядра; в `interfaces.md` этих классов нет (blueprint ещё и пишет CSS-переменные на элемент ядра). Должно быть: классы `.scroll-video__*`, которыми пользуются варианты, названы как контракт (верни их списком в `INTERFACES` — в `interfaces.md` их впишет оркестратор) и закреплены тестом ядра, либо сцена отдаётся варианту через api `renderOverlay`.
- [ ] **V2.** reduced-motion решён тремя способами. CSS: `showroom/showroom.css:1439` (глобально `*`, 1ms), `blueprint/blueprint.css:3581` (глобально `*`, 0ms), `ral/ral.css:1110` + `ral/home/home.css:1276` (ручные списки селекторов — новая анимация вне списка останется подвижной). JS: свои копии проверки при готовых `usePrefersReducedMotion`/`useMediaQuery` ядра — `ral/Fan.jsx:61`, `ral/field-store.js:74`, `ral/entrance.js:5` и `:41`, `blueprint/home/CornerStamp.jsx:54`, `blueprint/layout/Header.jsx:50`, `blueprint/drawing/ProductBlueprint.jsx:37`, `showroom/light.js:6` рядом с `useReducedMotion` из motion в `showroom/ui.jsx:6`. Должно быть: один источник проверки медиазапросов в `src/variants` (хуки ядра) и одно правило отключения движения в CSS, одинаковое у трёх вариантов.
- [ ] **V3.** Дубли. `POSITION_FORMS`: `showroom/Header.jsx:15`, `showroom/home/Bento.jsx:16`, `showroom/home/Hero.jsx:18`, `ral/Fan.jsx:14`, `ral/Header.jsx:21`, `blueprint/home/Hero.jsx:21`; `PRODUCT_FORMS/SERIES_FORMS`: `showroom/home/Industries.jsx:12`, `ral/home/Solutions.jsx:13`, `blueprint/home/SheetIndustries.jsx:16`; сумма позиций направления через `sections.reduce`: `ral/Fan.jsx:20`, `blueprint/home/Hero.jsx:87`, `blueprint/home/SheetDirections.jsx:30` и в showroom Hero/Bento; `UNKNOWN = '[уточнить]'` и хелперы `fact/step`: `showroom/hero-config.js:6-11`, `ral/hero.js:6-10`, `ral/label.js:5`, `blueprint/lib/drawing.js:4`. Должно быть: формы слов, итог позиций направления и маркер «[уточнить]» определены один раз (`core/ui/format` или `core/catalog`) и импортируются.
- [ ] **V4.** Поведение шапки и табов написано трижды и расходится: закрытие по Esc / клику вне / смене страницы — `showroom/Header.jsx:293-302`, `ral/Header.jsx:214-223`, `blueprint/layout/Header.jsx:181-208`; `CitySwitch` — `showroom/Header.jsx:42`, `ral/Header.jsx:32`, `blueprint/layout/Header.jsx:19`; клавиатура табов отраслей — `showroom/home/Industries.jsx:57`, `ral/home/Solutions.jsx:40`, `blueprint/home/SheetIndustries.jsx:67`. Меню телефона — три разные модели: нативный `<dialog>.showModal()` (`showroom/Header.jsx:149`), `role="dialog" aria-modal="true"` без ловушки фокуса — Tab уходит на страницу под меню (`ral/Header.jsx:155`), немодальный блок `hidden` (`blueprint/layout/Header.jsx:272`). Должно быть: одна общая реализация состояния меню и клавиатуры табов для трёх вариантов (логика — в ядре, разметка и вид остаются у варианта); меню, объявленное `aria-modal`, удерживает фокус внутри (или не объявляет себя модальным).
- [ ] **V5.** `src/variants/showroom/home.css:319`, `:1103`, `:1237` — `transition: color`; `docs/variants/showroom.md:22` при этом утверждает «анимируются только transform, opacity, clip-path». Должно быть: в CSS вариантов нет переходов по свойствам, кроме transform/opacity/clip-path.
- [ ] **V6.** `src/variants/blueprint/home/CornerStamp.jsx:56` + `blueprint/blueprint.css:3122-3142` — после выбора листа в «Содержании комплекта» фокус теряется: `h2.focus()` не срабатывает (у заголовка нет tabindex), а список с нажатой кнопкой уже `hidden`; на первом листе штамп скрыт только `opacity: 0; pointer-events: none` и остаётся в порядке Tab с невидимым фокусом. Должно быть: после выбора фокус на заголовке листа (`tabindex="-1"`) или на кнопке штампа; скрытый штамп недоступен с клавиатуры (visibility/inert).
- [ ] **V7.** `docs/variants/blueprint.md:42-43` — «на телефоне — модальное меню с аккордеоном каталога»; в коде немодальный лист без аккордеона (`blueprint/layout/Header.jsx:272-313`). Должно быть: описание меню совпадает с тем, что открывается на телефоне.
- [ ] **V8.** `src/variants/ral/Fan.jsx:107-109` + `ral/field-store.js:53` — если переключить вариант, пока идёт заливка «Веера» (около 1,5 с), запрос перекраски остаётся в модуле: при возврате в «Палитру RAL» заливка проиграется снова и уведёт на старый адрес. Условие: размонтирование слоя сбрасывает незавершённую перекраску.

Общее:

- [ ] Внешний вид трёх главных на 1440 и 390 не изменился (кроме перечисленного); горизонтального скролла нет на 360/768/1024/1440.
- [ ] `npm run check` зелёный; тестов не меньше 369; на новые общие функции ядра (формы слов и итог позиций, подписи материалов, состояние меню, клавиатура табов) есть тесты на шве.
- [ ] Детектор `impeccable detect --json src/variants/<id>` по каждому варианту — без новых находок (запускать через `sh`).
- [ ] Lighthouse и `npx lighthouse` не запускать.
