// Главная «Шоурума»: ночной шоурум ДВК, где свет витрин и есть интерфейс.
// Восемь экранов: hero-ролик → bento направлений → полный цикл → решения по отраслям → каталог-витрина →
// проекты → клиенты, письма, госзаказ → заявка. Порядок и анимации — docs/variants/showroom.md.
import '../../core/pages/pages.css';
import { usePageTitle } from '../../core/pages/parts/usePageTitle.js';
import { Bento } from './home/Bento.jsx';
import { Cycle } from './home/Cycle.jsx';
import { Hero } from './home/Hero.jsx';
import { Industries } from './home/Industries.jsx';
import { Projects } from './home/Projects.jsx';
import { RequestScreen } from './home/RequestScreen.jsx';
import { Showcase } from './home/Showcase.jsx';
import { Trust } from './home/Trust.jsx';
import { TweaksProvider } from './tweaks/store.jsx';
import { TweaksPanel } from './tweaks/TweaksPanel.jsx';

export function Home() {
  usePageTitle('Проектируем, производим и монтируем');
  return (
    // Твики — инструмент отбора фото на этапе согласования: какой кадр стоит в hero, плитке и отраслях.
    <TweaksProvider>
      <main className="page page-home sr-home">
        <Hero />
        <Bento />
        <Cycle />
        <Industries />
        <Showcase />
        <Projects />
        <Trust />
        <RequestScreen />
      </main>
      <TweaksPanel />
    </TweaksProvider>
  );
}
