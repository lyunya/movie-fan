/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: [`var(--font-overPass)`],
        body: [`var(--font-kronaOne)`],
      },
      future: {
        hoverOnlyWhenSupported: true,
      },
      backgroundImage: {
        divider: "url('/divider.svg')",
      },
      color: {
        transparent: 'transparent',
        current: 'currentColor',
      },
      animation: {
        border: 'border 4s ease infinite',
      },
      keyframes: {
        border: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
}
