/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6757e5', // Primary brand color
          700: '#5b47db',
          800: '#4c3bb3',
          900: '#3c2e8c',
        },
      },
      boxShadow: {
        none: 'none',
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        sm: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        DEFAULT: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
        md: '0 4px 10px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -2px rgba(15, 23, 42, 0.03)',
        lg: '0 10px 25px -4px rgba(15, 23, 42, 0.06), 0 4px 10px -4px rgba(15, 23, 42, 0.03)',
        xl: '0 20px 30px -6px rgba(15, 23, 42, 0.07), 0 8px 12px -6px rgba(15, 23, 42, 0.03)',
        '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.12)',
        inner: 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.05)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};
