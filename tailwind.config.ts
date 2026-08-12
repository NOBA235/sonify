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
        // "Night lab / sonar" palette — the default theme
        lab: {
          bg: '#0B1220',
          surface: '#111B2E',
          surface2: '#16223A',
          border: '#22314D',
          text: '#E7ECF5',
          muted: '#8493AD',
        },
        // Y-axis / pitch accent (cool)
        pitch: {
          DEFAULT: '#5EEAD4',
          dim: '#2C7A6E',
        },
        // X-axis / pan accent (warm)
        pan: {
          DEFAULT: '#FB7185',
          dim: '#8A3B44',
        },
        // High-contrast accessibility theme — pure black / yellow
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
