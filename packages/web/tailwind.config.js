/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'prop-gray': '#7f7f7f',
        'prop-blue': '#10a0de',
        'prop-green': '#7bcc3a',
        'prop-yellow': '#FFD162',
        'prop-orange': '#ff8a00',
        'prop-red': '#F74B4B',
      },
    },
  },
  plugins: [],
};
