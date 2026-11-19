// Вариант 1 «Шоурум»: ночной шоурум ДВК, где свет витрин и есть интерфейс.
// Шрифты и CSS импортируются здесь — грузятся только вместе с этим вариантом (ленивый чанк).
// Только нужные начертания: Tenor Sans 400, PT Serif Italic 400 (слово-акцент), Golos Text 400/500 — кириллица + латиница.
import '@fontsource/tenor-sans/cyrillic-400.css';
import '@fontsource/tenor-sans/latin-400.css';
import '@fontsource/pt-serif/cyrillic-400-italic.css';
import '@fontsource/pt-serif/latin-400-italic.css';
import '@fontsource/golos-text/cyrillic-400.css';
import '@fontsource/golos-text/latin-400.css';
import '@fontsource/golos-text/cyrillic-500.css';
import '@fontsource/golos-text/latin-500.css';
import '../../core/ui/reduced-motion.css';
import './showroom.css';
import './home.css';
import './pages.css';
import './tweaks/tweaks.css';
import { Footer } from './Footer.jsx';
import { Header } from './Header.jsx';
import { heroConfig } from './hero-config.js';
import { Home } from './Home.jsx';
import { Button, PageHeader, ProductCard, Reveal, SectionHeading } from './ui.jsx';

export default {
  id: 'showroom',
  Header,
  Footer,
  Home,
  ui: { Button, ProductCard, SectionHeading, PageHeader, Reveal },
  heroConfig,
};
