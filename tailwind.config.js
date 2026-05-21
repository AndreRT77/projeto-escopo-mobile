/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        fundo: '#FAFAFA',

        base: '#552BA9',
        dark: '#42257C',
        variant: '#7645D787',

        verde: '#19AD70',
        vermelho: '#EF4444',
        alert: '#FF3434',

        cinza: {
          100: '#F8F9FA',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
        },

        roxo: {
          light: '#F3E8FF',
          dark: '#7E22CE',
        },
      },

      fontFamily: {
        inter: ['Inter-Regular'],
        'inter-bold': ['Inter-Bold'],
        'inter-medium': ['Inter-Medium'],
        'inter-semibold': ['Inter-SemiBold'],
      },

      boxShadow: {
        external: '0px 0px 8px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
