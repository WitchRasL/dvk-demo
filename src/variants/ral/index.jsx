// Вариант 2 «Палитра RAL»: сайт как веер образцов краски RAL. Цвет направления — целым полем,
// сигнальный оранжевый — только у заявки. Шрифты и стили грузятся только с этим вариантом.
import '@fontsource/unbounded/cyrillic-600.css';
import '@fontsource/unbounded/latin-600.css';
import '@fontsource/onest/cyrillic-400.css';
import '@fontsource/onest/latin-400.css';
import '@fontsource/onest/cyrillic-600.css';
import '@fontsource/onest/latin-600.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '../../core/ui/reduced-motion.css';
import './ral.css';
import { Footer } from './Footer.jsx';
import { Header } from './Header.jsx';
import { Home } from './Home.jsx';
import { heroConfig } from './hero.js';
import { Button, PageHeader, ProductCard, ProductList, Reveal, SectionHeading } from './ui.jsx';

export default {
  id: 'ral',
  Header,
  Footer,
  Home,
  ui: { Button, ProductCard, ProductList, SectionHeading, PageHeader, Reveal },
  heroConfig,
};
