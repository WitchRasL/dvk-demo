# 01 — Каркас прототипа и переключатель вариантов

**Требования:** R01, R02, R04, R20, R24, R28, R38, R39, R40, R41, R42, R43, R60, R62, R63, R64, R65, R66, R68, R70i
**Зависит от:** —
**Зона:** `package.json` · `package-lock.json` · `vite.config.js` · `vitest.config.js` · `index.html` · `.env.example` · `README.md` · `.github/` · `public/robots.txt` · `scripts/screenshot.mjs` · `src/main.jsx` · `src/App.jsx` · `src/styles/` · `src/lib/` · `src/components/ui/` · `src/core/variants/` · `src/core/layout/` · `src/core/ui/` · `src/core/pages/` (только заглушки маршрутов) · `src/variants/*/index.jsx` и `src/variants/*/meta.js` (только рабочие заглушки и описания) · `src/data/*.json` (только скелет)
**Волна:** 1
**Ревью:** да — фундамент
**Модель:** сильная

## Что должно заработать

Проект на React + Vite запускается и собирается. По адресу `/#/showroom`, `/#/ral`, `/#/blueprint` открываются три варианта-заглушки (у каждой свой `data-variant`, свои токены-заглушки и свой цвет фона, чтобы смена была видна), со всеми маршрутами из `interfaces.md` (страницы — пока заглушки с заголовком). Плавающий переключатель вариантов есть на каждой странице: меняет вариант, оставляя путь и query; клавиши 1/2/3; панель «О вариантах» с описанием всех трёх рядом. Готовы `cn()`, `asset()`, `srcSet()`, базовый набор UI, токены → `@theme`, noindex, robots, Pages-деплой и скриншоты.

Переключатель — «рамка концепта», а не часть дизайна вариантов: одинаковый во всех трёх, нейтральный, компактный, не перекрывает CTA и не мешает скроллу; на мобильном — маленькая кнопка, панель раскрывается снизу.

## Из брифа, дословно

> «Нам необходимо сделать несколько вариантов этого сайта с возможностью переключения этих вариантов между собой.»
> «Варианты должны быть принципиально разные для того, чтобы можно было потом выбрать лучшую из версий.»
> «заведи `src/lib/utils.js` с функцией `cn()` (clsx + tailwind-merge)»
> «Основа React + Vite» · «Tailwind CSS v4 (`@tailwindcss/vite`), токены … в `@theme`» · «Motion — … пакет `motion`, импорт из `motion/react`» · «Иконки Lucide React» · «React Router (HashRouter)» · «Шрифты локально через `@fontsource` … (с кириллицей)»
> «Пути к картинкам — через `import.meta.env.BASE_URL`, иначе на GitHub Pages они сломаются.»
> «в футере стоит пометка «Концепт редизайна dvk-style.ru»; в `<head>` стоит `<meta name="robots" content="noindex, nofollow">`; в `robots.txt` стоит `Disallow: /`.»
> «В `vite.config.js` пропиши `base: '/dvk-style-redesign/'`.» · «Добавь `.github/workflows/deploy.yml` для сборки и деплоя на Pages»
> «Описание — не больше 5 строк: название и визуальная метафора; палитра …, шрифтовая пара, настроение; главная «фишка» и 2–3 паттерна …; как уживаются три направления — одной строкой; вайрфрейм главной: 6–8 блоков в одну строку через `→`.»

## Разделы спецификации

Истории 1–8, 28–29, 44–49, 72, 74–76, 80; «Три варианта» (для текстов описаний); Решения по реализации; `interfaces.md` целиком (структура файлов, реестр, модуль варианта, токены, контекст, маршруты, навигация-заглушка).

## Что поставить (единственный таск, который ставит зависимости)

react, react-dom, react-router (v7, HashRouter из `react-router`), motion, lucide-react, clsx, tailwind-merge; dev: vite, @vitejs/plugin-react, tailwindcss@4, @tailwindcss/vite, vitest, jsdom, @testing-library/react, sharp, cheerio, puppeteer-core; шрифты: @fontsource/tenor-sans, @fontsource/pt-serif, @fontsource/golos-text, @fontsource/unbounded, @fontsource/onest, @fontsource/jetbrains-mono, @fontsource/fira-sans-condensed, @fontsource/fira-sans, @fontsource/pt-mono. Скрипты в package.json: dev, build, preview, test, check, fetch-images (указывает на `scripts/fetch-images.mjs`, сам файл пишет T02), shot.

## Критерии приёмки

- [ ] `npm run check` проходит (Vitest + сборка); `npm run dev` и `npm run preview` открывают сайт по адресу с `/dvk-style-redesign/`
- [ ] `/#/showroom`, `/#/ral`, `/#/blueprint` открывают три разных варианта-заглушки; каждый лениво грузит свой модуль (`import()`), в сборке — отдельные чанки
- [ ] Переключатель на каждой странице: смена варианта сохраняет путь и query (`/#/ral/catalog/metal?q=шкаф` → `/#/blueprint/catalog/metal?q=шкаф`); тест на `swapVariantInPath`
- [ ] Клавиши `1`/`2`/`3` переключают вариант вне полей ввода; переключатель доступен с клавиатуры, видимый фокус, `aria-pressed`
- [ ] `/` открывает последний выбранный вариант (localStorage, с try/catch), по умолчанию `showroom`; неизвестный вариант → `showroom` с тем же путём
- [ ] Панель «О вариантах» показывает все три описания рядом (метафора; палитра, шрифты, настроение; фишка и паттерны; как уживаются направления; вайрфрейм главной 6–8 блоков через `→`) и пометку «Концепт редизайна dvk-style.ru»
- [ ] Все маршруты из `interfaces.md` отвечают страницей-заглушкой; несуществующий путь → 404-страница со ссылкой на главную
- [ ] `src/lib/utils.js` экспортирует `cn()` (clsx + tailwind-merge); `src/components/ui/README.md` объясняет, куда класть компоненты 21st.dev
- [ ] `asset()` строит пути от `import.meta.env.BASE_URL`; в коде нет абсолютных `/images/…`
- [ ] Токены варианта (полный список из `interfaces.md`) отображены в `@theme`; классы `bg-bg text-fg font-display` работают и меняются со сменой варианта
- [ ] `index.html`: `lang="ru"`, `<meta name="robots" content="noindex, nofollow">`; `public/robots.txt` — `Disallow: /`; футер-заглушка каждого варианта содержит «Концепт редизайна dvk-style.ru»
- [ ] `vite.config.js` с `base: '/dvk-style-redesign/'`; `.github/workflows/deploy.yml` по шаблону из `promt.md` (Node 22, `npm ci`, `npm run build`, upload `dist`, deploy-pages)
- [ ] `.env.example` с пустым `VITE_FORM_ENDPOINT=`; README: команды, как переключать варианты, как подставить hero-ролик (ссылка на `docs/hero-video/README.md`), как публиковать
- [ ] `npm run shot -- <url> <file> --width 390` делает скриншот через установленный Chrome
- [ ] `src/data/*.json` — скелет по схеме `interfaces.md`: три направления, разделы с числом товаров из брифа, пустые массивы товаров и проектов, `company.json` с контактами из брифа; ничего выдуманного
