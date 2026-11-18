import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { ErrorBoundary } from './core/layout/ErrorBoundary.jsx';
import { Shell } from './core/layout/Shell.jsx';
import { fallbackVariantPath } from './core/variants/paths.js';
import { isVariantId } from './core/variants/registry.js';
import { readLastVariant } from './core/variants/storage.js';
import { useVariant, VariantProvider } from './core/variants/VariantContext.jsx';

// Страницы ядра — ленивые: каждая в своём чанке.
const CatalogPage = lazy(() => import('./core/pages/CatalogPage.jsx'));
const ProductPage = lazy(() => import('./core/pages/ProductPage.jsx'));
const SolutionPage = lazy(() => import('./core/pages/SolutionPage.jsx'));
const ProjectsPage = lazy(() => import('./core/pages/ProjectsPage.jsx'));
const ProjectPage = lazy(() => import('./core/pages/ProjectPage.jsx'));
const AboutPage = lazy(() => import('./core/pages/AboutPage.jsx'));
const ContactsPage = lazy(() => import('./core/pages/ContactsPage.jsx'));
const RequestPage = lazy(() => import('./core/pages/RequestPage.jsx'));
const PrivacyPage = lazy(() => import('./core/pages/PrivacyPage.jsx'));
const NotFoundPage = lazy(() => import('./core/pages/NotFoundPage.jsx'));

/** `/` → последний выбранный вариант или showroom. */
function RootRedirect() {
  const { search } = useLocation();
  return <Navigate replace to={`/${readLastVariant()}${search}`} />;
}

function VariantLoading() {
  return <div className="min-h-dvh bg-bg" aria-busy="true" />;
}

/** Проверяет первый сегмент, грузит модуль варианта и рисует оболочку. */
function VariantGate() {
  const { variant } = useParams();
  const { pathname, search } = useLocation();
  if (!isVariantId(variant)) return <Navigate replace to={fallbackVariantPath(pathname, search)} />;
  return (
    <Suspense fallback={<VariantLoading />}>
      <VariantProvider id={variant}>
        <Shell />
      </VariantProvider>
    </Suspense>
  );
}

function VariantHome() {
  const { module } = useVariant();
  const Home = module.Home;
  return <Home />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path=":variant" element={<VariantGate />}>
          <Route index element={<VariantHome />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/:direction/:section?/:category?" element={<CatalogPage />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="solutions/:industry" element={<SolutionPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:slug" element={<ProjectPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="request" element={<RequestPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          {import.meta.env.DEV && <Route path="__scroll-video" Component={lazy(() => import('./core/scroll-video/ScrollVideoDemo.jsx'))} />}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
