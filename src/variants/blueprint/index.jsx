// Рабочая заглушка варианта «Чертёж» (каркас). Таск варианта заменяет этот файл целиком.
import '@fontsource/fira-sans-condensed/cyrillic-500-italic.css';
import '@fontsource/fira-sans-condensed/latin-500-italic.css';
import '@fontsource/fira-sans/cyrillic-400.css';
import '@fontsource/fira-sans/latin-400.css';
import '@fontsource/pt-mono/cyrillic-400.css';
import '@fontsource/pt-mono/latin-400.css';
import { createStubVariant } from '../../core/ui/stub-variant.jsx';

const css = `
[data-variant="blueprint"] {
  --bg: #fbfbf9; --surface: #ffffff; --surface-2: #eeeeeb;
  --fg: #111111; --fg-muted: #555555; --line: #111111;
  --accent: #111111; --accent-fg: #ffffff; --action: #d43d1a; --action-fg: #ffffff; --focus: #d43d1a;
  --font-display: 'Fira Sans Condensed', 'Arial Narrow', sans-serif;
  --font-body: 'Fira Sans', system-ui, sans-serif;
  --font-mono: 'PT Mono', ui-monospace, monospace;
  --radius: 0px; --radius-lg: 0px; --shadow: none;
  --ease-out: cubic-bezier(0.25, 1, 0.5, 1); --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
  --dur-fast: 120ms; --dur-base: 280ms; --dur-slow: 600ms;
  color-scheme: light;
}
[data-variant="blueprint"] .font-display { font-style: italic; }`;

export default createStubVariant({ id: 'blueprint', css });
