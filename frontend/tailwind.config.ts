import type { Config } from 'tailwindcss';

// Palette chosen for an engineering control surface: cool neutrals with a single
// teal brand accent and semantic status colors. Deliberately not the cream/serif
// look — data reads in mono, state reads in color.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F141B',
        paper: '#F5F6F8',
        surface: '#FFFFFF',
        line: '#E4E7EC',
        muted: '#667085',
        brand: { DEFAULT: '#0E7C86', ink: '#0A5A62' },
        on: '#17835A',
        off: '#8A94A6',
        warn: '#B54708',
        danger: '#B42318',
        info: '#175CD3',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        pop: '0 8px 24px rgba(16,24,40,0.12)',
      },
      borderRadius: { xl: '12px' },
    },
  },
  plugins: [],
};
export default config;
