// Рабочая заглушка варианта «Палитра RAL» (каркас). Таск варианта заменяет этот файл целиком.
import '@fontsource/unbounded/cyrillic-600.css';
import '@fontsource/unbounded/latin-600.css';
import '@fontsource/onest/cyrillic-400.css';
import '@fontsource/onest/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import { createStubVariant } from '../../core/ui/stub-variant.jsx';

const css = `
[data-variant="ral"] {
  --bg: #c9cdc8; --surface: #d9dcd7; --surface-2: #b9beb8;
  --fg: #1c1f21; --fg-muted: #474c4f; --line: rgb(28 31 33 / 0.22);
  --accent: #1c1f21; --accent-fg: #ffffff; --action: #c2410c; --action-fg: #ffffff; --focus: #1c1f21;
  --font-display: 'Unbounded', system-ui, sans-serif;
  --font-body: 'Onest', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --radius: 0px; --radius-lg: 0px; --shadow: none;
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1); --ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);
  --dur-fast: 140ms; --dur-base: 320ms; --dur-slow: 640ms;
  color-scheme: light;
}`;

export default createStubVariant({ id: 'ral', css });
