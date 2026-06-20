import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1E3A5C',
          dark: '#15243B',
          deep: '#16273F',
          deeper: '#0E1A2C',
        },
        slate: {
          muted: '#8893A4',
          faint: '#AEB8C6',
          line: '#E6E9EE',
          card: '#ECEEF1',
          row: '#F2F4F7',
        },
        canvas: '#F4F6F9',
        green: { DEFAULT: '#2E7D55', light: '#E7F1EC' },
        red: { provider: '#B4402B', light: '#F8E8E3' },
        gold: { DEFAULT: '#C9A24B', light: '#F7EFDD' },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      keyframes: {
        bvfade: {
          from: { opacity: '0', transform: 'translateY(10px)' },
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
        bvriseX: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        bvskel: {
          '0%': { backgroundPosition: '-340px 0' },
          '100%': { backgroundPosition: '340px 0' },
        },
        bvtoast: {
          from: { opacity: '0', transform: 'translateY(16px) scale(.98)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        bvfade: 'bvfade .5s cubic-bezier(.22,1,.36,1) both',
        bvpop: 'bvpop .4s ease both',
        bvrise: 'bvrise .7s cubic-bezier(.22,1,.36,1) both',
        bvriseX: 'bvriseX .7s cubic-bezier(.22,1,.36,1) both',
        bvskel: 'bvskel 1.3s infinite linear',
        bvtoast: 'bvtoast .35s cubic-bezier(.34,1.56,.64,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
