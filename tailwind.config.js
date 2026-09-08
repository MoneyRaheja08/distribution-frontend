/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,.04), 0 10px 26px -14px rgba(15,23,42,.16)',
        lift: '0 14px 36px -16px rgba(15,23,42,.28)',
        glow: '0 8px 26px -10px rgba(14,124,102,.55)',
      },
      colors: {
        brand: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#12a184', 600: '#0e7c66', 700: '#0b6353',
          800: '#0a4f43', 900: '#083f37',
        },
      },
    },
  },
  plugins: [],
}
