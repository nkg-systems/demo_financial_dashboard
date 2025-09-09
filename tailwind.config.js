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
        // Dark theme colors for financial dashboard
        'dark-bg': '#0a0a0f',
        'dark-surface': '#1a1a23',
        'dark-card': '#252530',
        'dark-border': '#3a3a4a',
        'dark-text': '#e5e5e7',
        'dark-text-secondary': '#a5a5a7',
        // Financial colors
        'profit-green': '#22c55e',
        'loss-red': '#ef4444',
        'neutral-blue': '#3b82f6',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
