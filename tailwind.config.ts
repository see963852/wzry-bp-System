import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/store/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'blue-team': '#1a6cf6',
        'red-team': '#e53e3e',
        'app-bg': '#0f1117',
        surface: '#1a1d27',
        success: '#38a169',
        t0: '#f6c90e',
        t1: '#a8b2c1',
      },
    },
  },
};

export default config;
