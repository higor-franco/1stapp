/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b9cdff',
          300: '#86a8ff',
          400: '#4d7bff',
          500: '#1a4fff',
          600: '#0033e0',
          700: '#0028b5',
          800: '#002290',
          900: '#001d75',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
