/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pos: {
          bg: '#2c3e50',
          panel: '#34495e',
          text: '#ecf0f1',
          muted: '#95a5a6',
          border: '#4a6278',
          accent: '#22c55e'
        }
      }
    }
  },
  plugins: []
};
