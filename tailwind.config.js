/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        reaprovecha: {
          green: '#4E7C27',
          'green-light': '#689F38',
          'green-dark': '#385A1A',
          'green-soft': '#EBF3E7',
          red: '#D32F2F',
          'red-dark': '#9A0007',
          'red-soft': '#FDE8E8',
          orange: '#E67E22',
          'orange-light': '#F39C12',
          'orange-soft': '#FDF2E9',
          brown: '#2D1F18',
          'brown-light': '#5A3E31',
          bg: '#F8FAF6',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
