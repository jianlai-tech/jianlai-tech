/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EFE6D2',
        sheet: '#F8F2E3',
        sheet2: '#F1E8D3',
        sel: '#E8DABB',
        ink: '#1C1A17',
        ink2: '#54503F',
        ink3: '#625C4C',
        rail: '#2B372C',
        railhi: '#394838',
        cinnabar: '#A8322A',
        cinnabarwash: '#F0D6CC',
        jade: '#3F5B3F',
        jadewash: '#DDE5D0',
        ochre: '#7A5A12',
        ochrewash: '#EEDDAE',
      },
      fontFamily: {
        ui: [
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Noto Sans SC"',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"Noto Serif SC"', '"Songti SC"', 'STSong', 'serif'],
        kai: ['"LXGW WenKai"', '"Kaiti SC"', 'STKaiti', 'serif'],
      },
      borderRadius: {
        sm: '2px',
      },
    },
  },
  plugins: [],
}
