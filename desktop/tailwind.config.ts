import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0b0d10', subtle: '#11151a', card: '#141a20' },
        border: { DEFAULT: '#1f2630', muted: '#19202a' },
        fg: { DEFAULT: '#e6edf3', muted: '#8b95a4', subtle: '#576372' },
        accent: { DEFAULT: '#5eead4', hover: '#2dd4bf' },
        danger: '#f87171',
        warn: '#fbbf24',
        ok: '#34d399',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
