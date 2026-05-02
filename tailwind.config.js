/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#0F3C66',
          'navy-dark': '#0a2a4b',
          'navy-mid': '#154b8a',
          accent: '#EE964C',
          'accent-hover': '#d97d36',
          panel: '#154b8a',
        },
      },
      boxShadow: {
        card: '0 4px 6px -1px rgb(15 23 42 / 0.06), 0 12px 24px -4px rgb(15 23 42 / 0.08)',
        'card-lg': '0 8px 16px -4px rgb(15 23 42 / 0.08), 0 24px 48px -12px rgb(15 23 42 / 0.12)',
      },
    },
  },
  plugins: [],
};
