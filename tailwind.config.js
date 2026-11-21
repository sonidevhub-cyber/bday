/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Pacifico', 'cursive'],
        rounded: ['Fredoka', 'sans-serif'],
      },
      colors: {
        cocoa: '#5C3A21',
        coral: '#D9534F',
      },
    },
  },
  plugins: [],
}
