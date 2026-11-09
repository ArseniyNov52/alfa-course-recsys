/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        alfa: {
          red: '#EF3124',
          darkRed: '#CC190D',
          lightRed: '#FEECEB',
          black: '#1F2229',
          gray: '#8B94A0',
          lightGray: '#F3F4F6',
          border: '#E5E7EB',
          bg: '#FAFAFA'
        }
      }
    },
  },
  plugins: [],
}
