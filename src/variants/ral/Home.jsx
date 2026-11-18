// Главная «Палитры RAL»: восемь экранов (порядок и анимации — docs/variants/ral.md).
// Поле hero и экранов без своей краски — цвет текущего направления (грунт, пока направление не выбрано).
import { usePageTitle } from '../../core/pages/parts/usePageTitle.js';
import { useCurrentDirection } from './field-store.js';
import { Cycle } from './home/Cycle.jsx';
import { FanSection } from './home/FanSection.jsx';
import { Hero } from './home/Hero.jsx';
import { Projects } from './home/Projects.jsx';
import { Proof } from './home/Proof.jsx';
import { RequestSection } from './home/RequestSection.jsx';
import { Showcase } from './home/Showcase.jsx';
import { Solutions } from './home/Solutions.jsx';
import './home/home.css';

export function Home() {
  const direction = useCurrentDirection();
  usePageTitle('');
  return (
    <main className="page page-home ral-home">
      <Hero direction={direction} />
      <FanSection />
      <Showcase />
      <Cycle />
      <Solutions />
      <Projects />
      <Proof />
      <RequestSection />
    </main>
  );
}
