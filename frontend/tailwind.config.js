/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        card: '#1E293B',
        primary: '#7C3AED',
        accent: '#22D3EE',
        text: '#F8FAFC',
      }
    },
  },
  plugins: [],
}
