import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Clean workspace palette for the default product theme.
        lab: {
          bg: '#F7F8FA',
          surface: '#FFFFFF',
          surface2: '#F0F3F7',
          border: '#DCE3EC',
          text: '#182033',
          muted: '#667085',
        },
        pitch: {
          DEFAULT: '#14B8A6',
          dim: '#0F766E',
        },
        pan: {
          DEFAULT: '#E11D48',
          dim: '#9F1239',
        },
        // High-contrast accessibility theme: pure black / yellow.
        hc: {
          bg: '#000000',
          surface: '#0A0A0A',
          text: '#FFEB3B',
          border: '#FFEB3B',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(94,234,212,0.25), 0 0 24px rgba(94,234,212,0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
