/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4F46E5',
          dark: '#4338CA',
          light: '#818CF8',
        },
      },
    },
  },
  plugins: [],
};
