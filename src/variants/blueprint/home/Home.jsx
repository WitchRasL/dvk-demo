// Главная «Чертежа» — комплект из восьми листов. Порядок и анимации — docs/variants/blueprint.md.
import '../../../core/pages/pages.css';
import { usePageTitle } from '../../../core/pages/parts/usePageTitle.js';
import { CornerStamp } from './CornerStamp.jsx';
import { Hero } from './Hero.jsx';
import { SheetClients } from './SheetClients.jsx';
import { SheetCycle } from './SheetCycle.jsx';
import { SheetDirections } from './SheetDirections.jsx';
import { SheetIndustries } from './SheetIndustries.jsx';
import { SheetProjects } from './SheetProjects.jsx';
import { SheetRequest } from './SheetRequest.jsx';
import { SheetShowcase } from './SheetShowcase.jsx';

export function Home() {
  usePageTitle(null);
  return (
    <main className="page page-home bp-home">
      <Hero />
      <SheetDirections />
      <SheetCycle />
      <SheetIndustries />
      <SheetShowcase />
      <SheetProjects />
      <SheetClients />
      <SheetRequest />
      <CornerStamp />
    </main>
  );
}
