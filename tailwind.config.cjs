/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'heading': [`var(--font-rubik)`],
        'body': [`var(--font-kronaOne)`],
      },
    },
  },
  plugins: [],
};
