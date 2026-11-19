// Сторож режима показа: ссылки внутрь сайта не уводят с главной. Нажатие перехватывается на корне варианта
// раньше, чем его увидит маршрутизатор; «Заявка» прокручивает к блоку заявки, остальное — короткая пометка.
import { useEffect, useState } from 'react';
import { DEMO_REQUEST_ID, internalPath, isDemoHome, isRequestPath } from './demo.js';
import './demo.css';

const NOTICE_MS = 2600;
/** Сколько раз и с каким шагом доводить прокрутку до блока: пока она идёт, выше догружаются фото и страница растёт. */
const SETTLE = { tries: 5, stepMs: 220, tolerancePx: 96 };

function scrollToBlock(target, attempt = 1) {
  target.scrollIntoView({ block: 'start' });
  if (attempt >= SETTLE.tries) return;
  setTimeout(() => {
    if (!target.isConnected) return;
    if (Math.abs(target.getBoundingClientRect().top) > SETTLE.tolerancePx) scrollToBlock(target, attempt + 1);
  }, SETTLE.stepMs);
}

/** @param {{ rootRef: { current: HTMLElement | null } }} props корень варианта: пометка рисуется внутри него */
export function DemoGuard({ rootRef }) {
  const [shown, setShown] = useState(0); // растёт с каждым перехваченным нажатием: пометка показывается заново

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const onClick = (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || !root.contains(link)) return;
      const path = internalPath(link.getAttribute('href'));
      if (path === null || isDemoHome(path)) return; // телефон, почта, внешний сайт, сама главная
      event.preventDefault();
      event.stopPropagation();
      const request = isRequestPath(path) ? document.getElementById(DEMO_REQUEST_ID) : null;
      if (request) scrollToBlock(request);
      else setShown((count) => count + 1);
    };
    root.addEventListener('click', onClick, true);
    return () => root.removeEventListener('click', onClick, true);
  }, [rootRef]);

  useEffect(() => {
    if (!shown) return undefined;
    const timer = setTimeout(() => setShown(0), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [shown]);

  return (
    <p className="demo-notice" role="status" data-shown={shown ? '' : undefined}>
      {shown ? 'Это демонстрация главной страницы — разделы сайта откроются на следующем этапе' : ''}
    </p>
  );
}
