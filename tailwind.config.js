import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
    './src/content/**/*.{json,md}'
  ],
  theme: {
    extend: {
      fontFamily: {
        // Matches the --pv2-font-* tokens in portfolio-v2.css, so case-study
        // content written with Tailwind sets the same two faces as the rest
        // of the site instead of falling back to the browser default.
        sans: ['Atkinson Hyperlegible Next', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif']
      },
      colors: {
        // The sienna pulled from the oil backdrops. The case-study components
        // were built against a sky-blue ramp, which sat badly in a warm
        // palette; `brand` is now that sienna and the components point here.
        brand: {
          50: '#fbf2ee',
          100: '#f4dfd6',
          200: '#e7bfae',
          300: '#d69a82',
          400: '#c0714f',
          500: '#a44d2a',
          600: '#8c3a1f',
          700: '#73301a',
          800: '#5a2614',
          900: '#3f1b0e'
        }
      },
      boxShadow: {
        elevated: '0 20px 45px -25px rgba(90, 38, 20, 0.45)'
      }
    }
  },
  plugins: [forms]
};
