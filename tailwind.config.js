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
          navy: '#1e3a5f',
          'navy-dark': '#152a44',
          'navy-mid': '#1a3050',
          accent: '#e67e22',
          'accent-hover': '#d35400',
          panel: '#1d3557',
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
