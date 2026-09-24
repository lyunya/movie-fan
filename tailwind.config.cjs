/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        heading: [`var(--font-overPass)`, 'system-ui', 'sans-serif'],
        display: [`var(--font-display)`, 'Georgia', 'serif'],
      },
      colors: {
        // After Hours Film Club palette. Pink (Tailwind's scale) is the
        // action/selection color; gold is reserved for *your* ratings.
        ink: {
          DEFAULT: '#111013',
          deep: '#0b0a0c',
          raised: '#1b191e',
          line: '#2c2931',
        },
        cream: '#f5f2ef',
        gold: '#f5c451',
        brand: {
          pink: '#f472b6',
          red: '#dc2626',
        },
        surface: {
          DEFAULT: '#18181b',
          light: '#27272a',
          border: '#3f3f46',
        },
      },
      animation: {
        bulbs: 'bulbs 1.2s steps(1) infinite',
        drift: 'drift 40s ease-in-out infinite alternate',
        'rise-in': 'rise-in 500ms cubic-bezier(.2,.7,.2,1) both',
      },
      keyframes: {
        bulbs: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        drift: {
          from: { transform: 'scale(1.02) translate3d(0,0,0)' },
          to: { transform: 'scale(1.1) translate3d(-1.5%,-1%,0)' },
        },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
    },
  },
  plugins: [],
}
