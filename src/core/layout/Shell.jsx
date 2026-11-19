import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { DemoGuard } from '../demo/DemoGuard.jsx';
import { isHomeOnlyDemo } from '../demo/demo.js';
import { useVariant } from '../variants/VariantContext.jsx';
import { VariantSwitcher } from './VariantSwitcher.jsx';

function PageFallback() {
  return <div className="min-h-[60vh]" aria-busy="true" />;
}

/**
 * Оболочка варианта: data-variant на корне (токены варианта), его шапка и футер,
 * страница в <Outlet/>. Переключатель — снаружи корня варианта, чтобы стили
 * варианта его не задевали. В режиме показа («только главная») переключателя нет,
 * а ссылки внутрь сайта перехватывает сторож.
 */
export function Shell() {
  const { id, module } = useVariant();
  const { Header, Footer } = module;
  const { pathname } = useLocation();
  const pagePath = pathname.replace(/^\/[^/]*/, ''); // путь без варианта
  const rootRef = useRef(null);
  const demo = isHomeOnlyDemo();

  // Новая страница — к началу; смена варианта на той же странице позицию не сбрасывает.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pagePath]);

  return (
    <>
      <div ref={rootRef} data-variant={id} className="variant-root flex min-h-dvh flex-col bg-bg font-body text-fg">
        {Header ? <Header /> : null}
        <div className="flex-1">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </div>
        {Footer ? <Footer /> : null}
        {demo ? <DemoGuard rootRef={rootRef} /> : null}
      </div>
      {demo ? null : <VariantSwitcher />}
    </>
  );
}
