// Вариант 3 «Чертёж»: сайт как комплект рабочей документации по ЕСКД. Шрифты и CSS грузятся только с ним.
import '@fontsource/fira-sans-condensed/cyrillic-500-italic.css';
import '@fontsource/fira-sans-condensed/latin-500-italic.css';
import '@fontsource/fira-sans/cyrillic-400.css';
import '@fontsource/fira-sans/latin-400.css';
import '@fontsource/fira-sans/cyrillic-500.css';
import '@fontsource/fira-sans/latin-500.css';
import '@fontsource/pt-mono/cyrillic-400.css';
import '@fontsource/pt-mono/latin-400.css';
import './blueprint.css';
import { Home } from './home/Home.jsx';
import { Footer } from './layout/Footer.jsx';
import { Header } from './layout/Header.jsx';
import { heroConfig } from './lib/hero.js';
import { Button } from './ui/Button.jsx';
import { PageHeader, SectionHeading } from './ui/headings.jsx';
import { ProductCard } from './ui/ProductCard.jsx';
import { ProductList } from './ui/ProductList.jsx';
import { Reveal } from './ui/Reveal.jsx';

export default {
  id: 'blueprint',
  Header,
  Footer,
  Home,
  ui: { Button, ProductCard, ProductList, SectionHeading, PageHeader, Reveal },
  heroConfig,
};
