import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge знает только стандартные шкалы Tailwind. Утилиты токенов варианта
// (src/styles/index.css) добавлены в свои группы, иначе `rounded-xl rounded-base` остались бы оба.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['base'], // rounded-base → var(--radius); rounded-lg уже в шкале
      shadow: ['base'], // shadow-base → var(--shadow)
    },
    classGroups: {
      duration: [{ duration: ['fast', 'base', 'slow'] }], // @utility duration-* → var(--dur-*)
    },
  },
});

/** Склейка классов для компонентов (в том числе 21st.dev): clsx + tailwind-merge с токенами проекта. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
