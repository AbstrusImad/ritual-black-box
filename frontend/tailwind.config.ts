import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    'text-ritual-green',
    'text-ritual-gold',
    'text-ritual-red',
    'text-ritual-lime',
    'text-ritual-pink',
    'bg-ritual-green',
    'bg-ritual-gold',
    'bg-ritual-red',
    'bg-ritual-lime',
    'bg-ritual-pink',
    'shadow-glow-green',
    'shadow-glow-pink',
    'shadow-glow-gold',
    'shadow-glow-red',
  ],
  theme: {
    extend: {
      colors: {
        ritual: {
          black: '#000000',
          elevated: '#111827',
          surface: '#1F2937',
          green: '#f97316',
          lime: '#BFFF00',
          pink: '#FF1DCE',
          gold: '#FACC15',
          red: '#EF4444',
        },
        // Lift the faint grays so small/secondary text stays readable on black.
        gray: {
          500: '#9ca6b6',
          600: '#8b94a4',
        },
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        body: ['Barlow', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 30px -5px rgba(249, 115, 22, 0.35)',
        'glow-pink': '0 0 30px -5px rgba(255, 29, 206, 0.3)',
        'glow-gold': '0 0 30px -5px rgba(250, 204, 21, 0.3)',
        'glow-red': '0 0 30px -5px rgba(239, 68, 68, 0.35)',
        card: '0 4px 40px -12px rgba(0, 0, 0, 0.7)',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(249,115,22,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(249,115,22,0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        spinSlow: {
          to: { transform: 'rotate(360deg)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '41%': { opacity: '1' },
          '42%': { opacity: '0.5' },
          '43%': { opacity: '1' },
          '88%': { opacity: '1' },
          '89%': { opacity: '0.6' },
          '90%': { opacity: '1' },
        },
        drift: {
          '0%': { transform: 'translate3d(0,0,0)' },
          '100%': { transform: 'translate3d(-40px,-30px,0)' },
        },
      },
      animation: {
        'pulse-green': 'pulse-green 2.5s infinite',
        scanline: 'scanline 3s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spinSlow 18s linear infinite',
        flicker: 'flicker 4s linear infinite',
        drift: 'drift 20s linear infinite alternate',
      },
    },
  },
  plugins: [],
};

export default config;
