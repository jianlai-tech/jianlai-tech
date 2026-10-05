/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EDDEC4',
        ink: '#1C1A17',
        cinnabar: '#A8322A',
        slate: '#394838',
        moss: '#43462F',
      },
      fontFamily: {
        body: ['"Noto Serif SC"', 'Songti SC', 'STSong', 'serif'],
      },
    },
  },
  plugins: [],
}
