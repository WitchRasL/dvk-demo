<!-- autopilot:start -->
# ДВК Стиль — концепт редизайна dvk-style.ru

Прототип редизайна сайта производителя торгового оборудования, металлической мебели и детских площадок: три принципиально разных варианта («Шоурум», «Палитра RAL», «Чертёж») с переключением между ними, без бэкенда. Заказчик — ООО «ДВК Стиль»; продуктовый контекст — `PRODUCT.md`. Деплой — GitHub Pages (`.github/workflows/deploy.yml`, пуш в `main` → `npm run build`).

## Команды

Пути в кавычках: путь проекта с кириллицей и пробелом. Все команды — из корня.
- Установка: `npm ci` (чистый клон, `.env` не нужен).
- Dev-сервер: `npm run dev` (адрес `http://localhost:5173/dvk-demo/`).
- Проверка (vitest + сборка): `npm run check` — 35 файлов, 472 теста; предупреждение о чанке `index` 630 кБ — известное.
- Один файл или папка тестов: `npx vitest run src/core/catalog/catalog.test.js`.
- Сборка и просмотр: `npx vite build && npx vite preview --port 4319 --strictPort` → `http://localhost:4319/dvk-demo/#/<showroom|ral|blueprint>/…`.
- Снимок: `npm run shot -- <url> <out.png> [--width 1440] [--height N] [--full] [--wait 600] [--reduced-motion]` (puppeteer-core + Chrome, путь — `CHROME_PATH` или стандартный). `--full` не прокручивает страницу: появления по скроллу и ленивые фото не сработают.
- Ролик: команда ffmpeg из `docs/hero-video/README.md` (все кадры ключевые, `-g 1`).
- Детектор дизайна: `sh .claude/skills/impeccable/scripts/impeccable detect --json src/variants/<id>` — через `sh`, не `node`.
- `npm run fetch-images` — качает фото с dvk-style.ru в `public/images/` (сеть); данные собирает `node scripts/collect/collect.mjs` (кэш — `scripts/collect/.cache/`, в git не идёт).

## Где что

- `src/core/` — общее ядро: каталог, КП, город, квиз, скролл-видео, страницы, шапка/переключатель; `src/variants/<id>/` — «кожа» варианта.
- `src/core/variants/registry.js` — реестр вариантов; `src/App.jsx` — маршруты (HashRouter, первый сегмент — вариант).
- `src/data/{categories,products,projects,company}.json` — факты о компании; читать только через `src/core/catalog`.
- `src/variants/<id>/index.jsx` + `meta.js` + CSS с токенами; главная — `home/`; `public/media/<id>/` — ролик и постеры.
- `src/core/pages/` — внутренние страницы (общие, в базовом виде); `src/core/ui/base.jsx` — откат для `ui` варианта.
- `docs/variants/<id>.md`, `docs/hero-video/<id>.md` — описание варианта и раскадровка ролика; `docs/todo-utochnit.md` — недостающие факты.

## Подводные камни

- Git Bash подменяет аргумент Node с ведущим `/` на путь внутри `C:/Program Files/Git/`: маршруты передавать без ведущего слэша.
- `base` сайта — `/dvk-demo/` (`vite.config.js`); пути к файлам — только через `asset()` из `src/lib/base-url.js`, никаких `/images/...`.
- Токены (`--bg`, `--accent`…) живут только внутри `[data-variant="<id>"]`; порталы рендерить внутрь корня варианта, не в `document.body`.
- Анимировать можно только `transform`, `opacity`, `clip-path`; reduced-motion — одно правило `src/core/ui/reduced-motion.css`.
- `src/variants/conventions.test.js` сторожит соглашения вариантов (переходы, `matchMedia`, копии форм слов, классы скролл-видео); падение — чинить вариант, а не тест.
- Нет факта — видимая строка `[уточнить]` (`UNKNOWN` в `src/core/ui/format.js`), не правдоподобная выдумка.
- Ролики `public/media/<id>/hero*.mp4` — 10–12 МБ на вариант; не пересжимать без причины.
- `npx lighthouse` в среде агента запрещён — Lighthouse не измерен; `gh` не установлен.
- Вариант пишет только в свою папку; ядро не импортирует `src/variants/` напрямую — только через реестр.

## Окружение

- `VITE_FORM_ENDPOINT` — адрес формы (Formspree/Web3Forms) для заявки; пусто — демо-режим, ничего не уходит (`.env.example`).
- `CHROME_PATH` — путь к Chrome для `npm run shot`.
- `BITRIX_WEBHOOK_URL`, `BITRIX_STAGING_URL` — будущие, только в `docs/bitrix-integration.md`.

## Указатели

- Архитектура и соглашения — `docs/architecture.md`.
- Почему так — `docs/adr/`; словарь — `CONTEXT.md`.
- Дизайн-система и продукт — `DESIGN.md`, `PRODUCT.md`.

## Как здесь работает Autopilot

Сборка ведётся навыком `/autopilot`. Требования, спецификация и таски — в `.autopilot/`.
Прогресс — `.autopilot/dashboard.html`. Требование из `manifest.md` может снять
только пользователь. Прерванную сборку продолжает «продолжи автопилот».

### Правка без автопилота

Мелкий баг или доводка после сборки — обычная сессия, без прогона.

Сначала прочитай:
1. `.autopilot/PROGRESS.md` — что не доделано, известные баги, о чём договорились с пользователем.
2. Что правили после последней сборки — первая строка таблицы в «История git».
3. Только если правка их касается: почему сделано так — `docs/adr/`; что значат слова — `CONTEXT.md`;
   что именно просили — `manifest.md` в папке сборки (указана в начале `PROGRESS.md`).

После правки:
- коммит — по правилам из «История git»;
- строка в «Правки без автопилота» в `PROGRESS.md`: дата — что — почему;
- починенный пункт из «Не доделано» или «Известные баги» — удали;
- договорились с пользователем о том, что следующая сборка не должна пересматривать, —
  строка в «Договорились», его словами.

### История git

Целиком не читай — бери срез под вопрос:

| Вопрос | Команда |
|---|---|
| что правили после последней сборки | `git log --oneline "$(git log -1 --format=%h --grep='^Autopilot: сборка сдана')"..HEAD -- . ':(exclude).autopilot'` |
| всё, что делали ради требования | `git log --oneline --grep="R02"` |
| история файла | `git log --oneline -10 -- <файл>` |
| когда появился или исчез код | `git log --oneline -S "<фрагмент>"` |
| почему строка такая | `git blame -L <с>,<по> <файл>`, затем `git show <sha>` |
| что внутри коммита | `git show --stat <sha>` |

Срез длиннее ~30 коммитов — отдай его субагенту и возьми выжимку в десять строк.

Коммит: заголовок — что (`fix: даты в одном формате`), тело — почему, трейлер
`--trailer "Requirements: R02"`, если правка касается требования из `manifest.md`.
Заголовок `Autopilot: сборка сдана` пишет только автопилот — по нему находят последнюю сборку.
<!-- autopilot:end -->
