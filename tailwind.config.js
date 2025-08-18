/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#667eea",
        secondary: "#764ba2",
        accent: "#f59e0b",
        success: "#28a745",
        warning: "#fbbf24",
        error: "#dc2626",
        info: "#3b82f6",
        surface: "#ffffff",
        background: "#f8fafc"
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}