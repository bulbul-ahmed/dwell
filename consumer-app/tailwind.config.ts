import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        accent: '#1E3A5C',
        'accent-dark': '#15243B',
        green: { verified: '#2E7D55', light: '#EAF1ED' },
        gold: '#C9A24B',
        border: '#E7EAEE',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'Plus Jakarta Sans', 'sans-serif'],
        serif: ['var(--font-instrument-serif)', 'Instrument Serif', 'serif'],
      },
      keyframes: {
        bvfade: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        bvpop: {
          from: { opacity: '0', transform: 'scale(.96)' },
          to: { opacity: '1', transform: 'none' },
        },
        bvrise: {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
      },
      animation: {
        bvfade: 'bvfade .3s ease both',
        bvpop: 'bvpop .4s ease both',
        bvrise: 'bvrise .7s cubic-bezier(.22,1,.36,1) both',
      },
      maxWidth: { content: '1240px' },
    },
  },
  plugins: [],
};

export default config;
