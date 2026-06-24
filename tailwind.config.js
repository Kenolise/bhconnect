/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0b',
          900: '#0f0f11',
          850: '#141417',
          800: '#1a1a1e',
          700: '#242429',
          600: '#2e2e35',
          500: '#3a3a42',
          400: '#52525b',
        },
        gold: {
          50: '#fbf7ee',
          100: '#f6edd4',
          200: '#ecdba8',
          300: '#e0c576',
          400: '#d4af37',
          500: '#c39a1f',
          600: '#a37d16',
          700: '#7e6012',
          800: '#5a440e',
          900: '#3d2d08',
        },
        teal: {
          50: '#edfaf6',
          100: '#d2f4e8',
          200: '#a8e8d2',
          300: '#6dd5b6',
          400: '#34b896',
          500: '#1a9e7e',
          600: '#137f65',
          700: '#126652',
          800: '#125143',
          900: '#114338',
          950: '#082922',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
