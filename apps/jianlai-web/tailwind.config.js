/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F3E6C9',
        ink: '#111111',
        mark: '#F5D84A',
        blush: '#EE7BA0',
        lake: '#2BB3B1',
        tape: '#F4E08A',
      },
      fontFamily: {
        mark: ['"Ma Shan Zheng"', 'cursive'],
        doodle: ['"ZCOOL KuaiLe"', 'cursive'],
        body: ['"Noto Serif SC"', 'Songti SC', 'STSong', 'serif'],
      },
      boxShadow: {
        taped: '3px 8px 18px rgba(17, 17, 17, 0.12)',
      },
    },
  },
  plugins: [],
}
