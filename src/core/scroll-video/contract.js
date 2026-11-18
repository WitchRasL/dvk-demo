// Контракт разметки ScrollVideo для вариантов. Hero варианта рисует оверлей и пояснения внутри сцены ядра,
// поэтому ему разрешено: находить сцену и корень через closest() по этим классам, стилизовать эти элементы
// в своём CSS и ставить на корень и сцену свои CSS-переменные. Остальные классы движка — внутренние.
// Состав закреплён тестом contract.test.jsx.
export const SCROLL_VIDEO_CLASSES = Object.freeze({
  /** Корень (трек прокрутки): на нём стоит data-mode и --scroll-video-length. */
  root: 'scroll-video',
  /** Закреплённая сцена: прямой родитель кадра, слоя пояснений, пометки и оверлея. */
  stage: 'scroll-video__stage',
  /** Опорный кадр: <img> или пустой блок, если постера нет. */
  poster: 'scroll-video__poster',
  /** <video> поверх постера (режим video). */
  video: 'scroll-video__video',
  /** Слой пояснений в сцене (нет в режиме static). */
  callouts: 'scroll-video__callouts',
  /** Обёртка одного пояснения: стоит в точке кадра, несёт data-callout и data-active. */
  callout: 'scroll-video__callout',
  /** Пометка заглушки «Здесь будет видео-интерьер». */
  label: 'scroll-video__label',
  /** Оверлей варианта — то, что вернул renderOverlay. */
  overlay: 'scroll-video__overlay',
  /** Видимый список пояснений в режиме static, рядом со сценой. */
  list: 'scroll-video__list',
});

/** Атрибут корня с режимом: 'video' | 'placeholder' | 'static'. */
export const SCROLL_VIDEO_MODE_ATTRIBUTE = 'data-mode';

/** Сцена, внутри которой лежит элемент варианта (оверлей, пояснение), или null. */
export function findScrollVideoStage(element) {
  return element?.closest?.(`.${SCROLL_VIDEO_CLASSES.stage}`) ?? null;
}

/** Корень ScrollVideo, внутри которого лежит элемент варианта, или null. */
export function findScrollVideoRoot(element) {
  return element?.closest?.(`.${SCROLL_VIDEO_CLASSES.root}`) ?? null;
}
