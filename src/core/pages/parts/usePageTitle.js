import { useEffect } from 'react';

/** Заголовок вкладки: «<страница> — ДВК Стиль». На уходе со страницы возвращает прежний. */
export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — ДВК Стиль` : 'ДВК Стиль';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
