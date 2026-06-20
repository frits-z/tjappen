/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./layouts/**/*.html",
    "./content/**/*.md",
    "./assets/js/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        black: '#1a1a1a', 
        white: '#fff3e8',
        primary: '#fe5a11',
        gray: {
          100: '#faebd8',
          200: '#edd8c3',
          300: '#d8bda2',
          400: '#bd9d7f',
          500: '#9e7f62',
          600: '#7d6148',
          700: '#5c4632',
          800: '#403022',
          900: '#291e14',
        }
      }
    },
  },
  plugins: [],
}
