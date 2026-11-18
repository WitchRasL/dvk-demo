// Контейнер страниц ядра: одна ширина и одни поля на всех страницах и во всех вариантах.
import { cn } from '../../lib/utils.js';

export function Container({ as: Tag = 'div', className, ...rest }) {
  return <Tag className={cn('mx-auto w-full max-w-7xl px-4 md:px-6', className)} {...rest} />;
}

/** Заголовок блока страницы (h2), единый по размеру; текст — через `ui.SectionHeading` там, где нужен lead. */
export function sectionTitleClass(className) {
  return cn('font-display text-2xl leading-tight text-balance md:text-3xl', className);
}
