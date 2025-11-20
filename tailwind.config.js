/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
    './src/content/**/*.{json,md}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#e6f4f3',
          100: '#c8e7e4',
          200: '#a2d5d1',
          300: '#7ac2bd',
          400: '#52afa8',
          500: '#2e9189',
          600: '#1f766f',
          700: '#175c57',
          800: '#11433f',
          900: '#0a2d2a'
        }
      },
      boxShadow: {
        elevated: '0 20px 45px -25px rgba(31, 118, 111, 0.55)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
