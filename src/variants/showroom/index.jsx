// Рабочая заглушка варианта «Шоурум» (каркас). Таск варианта заменяет этот файл целиком.
import '@fontsource/tenor-sans/cyrillic-400.css';
import '@fontsource/tenor-sans/latin-400.css';
import '@fontsource/golos-text/cyrillic-400.css';
import '@fontsource/golos-text/latin-400.css';
import { createStubVariant } from '../../core/ui/stub-variant.jsx';

const css = `
[data-variant="showroom"] {
  --bg: #15120f; --surface: #1d1915; --surface-2: #29231d;
  --fg: #f2ece3; --fg-muted: #b5ab9c; --line: rgb(242 236 227 / 0.16);
  --accent: #c9a35b; --accent-fg: #15120f; --action: #d4ad63; --action-fg: #15120f; --focus: #f0c977;
  --font-display: 'Tenor Sans', 'Times New Roman', serif;
  --font-body: 'Golos Text', system-ui, sans-serif;
  --font-mono: ui-monospace, Consolas, monospace;
  --radius: 2px; --radius-lg: 6px; --shadow: 0 24px 48px rgb(0 0 0 / 0.5);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1); --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 180ms; --dur-base: 400ms; --dur-slow: 800ms;
  color-scheme: dark;
}`;

export default createStubVariant({ id: 'showroom', css });
