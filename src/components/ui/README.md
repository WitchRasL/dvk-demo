# Компоненты 21st.dev

Сюда кладутся компоненты, скопированные с https://21st.dev/ (bento-сетки, Spotlight-карточки,
магнитные кнопки, reveal, табы, кинетическая типографика).

Как встроить компонент:

1. Скопируйте файл компонента в эту папку: `src/components/ui/<name>.jsx`. TypeScript-типы уберите —
   проект на JavaScript.
2. Импорт `cn` замените на `import { cn } from '../../lib/utils.js'` (в оригинале обычно `@/lib/utils`).
3. Анимации — из `motion/react` (пакет `motion`), иконки — из `lucide-react`. Других зависимостей
   компоненты не тянут: нужна новая — сначала согласовать.
4. Цвета, шрифты, радиусы — только токенами варианта: `bg-bg`, `bg-surface`, `text-fg`,
   `text-fg-muted`, `border-line`, `bg-accent`, `bg-action text-action-fg`, `font-display`,
   `font-body`, `font-mono`, `rounded-base`, `rounded-lg`, `shadow-base`, `ease-out`,
   `duration-fast|base|slow`. Тогда компонент сам перекрашивается при смене варианта.
   Жёсткие `zinc-900`, `#7c3aed` и т. п. заменить на токены.
5. Анимировать только `transform`, `opacity`, `clip-path`; для `prefers-reduced-motion: reduce`
   нужен вариант без движения (`useReducedMotion()` из `motion/react`).

Компонент, который нужен только одному варианту, кладите в папку варианта `src/variants/<id>/`.
