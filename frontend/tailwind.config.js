/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Paleta neutra como base (gris azulado) + un único acento sobrio.
        ink: {
          DEFAULT: '#1a1d23',
          muted: '#5b6270',
          soft: '#8a909c',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f7f8fa',
          sunken: '#f1f3f6',
        },
        line: '#e4e7ec',
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#4f5bd5',
          600: '#3f49b8',
          700: '#343c98',
        },
      },
      borderRadius: {
        md: '0.5rem',
        lg: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
};
