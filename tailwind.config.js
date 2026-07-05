/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#13111c',
        card: '#1e1a2e',
        sidebar: '#18181b',
        border: '#2d2840',
      },
    },
  },
  plugins: [],
}

