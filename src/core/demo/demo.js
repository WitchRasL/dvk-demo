// Режим показа «только главная»: сборка для ссылки заказчику. В ней открыта одна страница — главная выбранного
// варианта; остальные адреса возвращают на неё, переходы по ссылкам внутрь сайта не срабатывают.
// Включается переменной сборки VITE_DEMO=home (стоит в .github/workflows/deploy.yml); локально сайт полный.

/** Вариант, чья главная показывается в режиме показа. */
export const DEMO_VARIANT = 'showroom';
/** id блока заявки на главной: ссылки «Заявка» в режиме показа прокручивают к нему, а не ведут на страницу заявки. */
export const DEMO_REQUEST_ID = 'demo-request';

export function isHomeOnlyDemo() {
  return import.meta.env.VITE_DEMO === 'home';
}

/** Адрес ссылки внутри сайта → путь маршрута ('#/showroom/catalog?x=1' → '/showroom/catalog'); внешняя ссылка → null. */
export function internalPath(href) {
  const value = String(href ?? '').replace(/^#/, '');
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
}

/** Путь маршрута — главная режима показа? */
export function isDemoHome(path) {
  return path === '/' || path === `/${DEMO_VARIANT}`;
}

/** Путь ведёт на страницу заявки (её в режиме показа заменяет блок заявки на главной)? */
export function isRequestPath(path) {
  return /^\/[^/]+\/request$/.test(String(path));
}
