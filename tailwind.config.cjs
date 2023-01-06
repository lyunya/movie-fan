/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'heading': [`var(--font-overPass)`],
        'body': [`var(--font-kronaOne)`],
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};
