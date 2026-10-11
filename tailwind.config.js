/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFDF7',
          100: '#FFFBEB',
          200: '#FEF3C7',
          DEFAULT: '#FFFDF5',
        },
        jebew: {
          red: '#DC2626',
          'red-dark': '#991B1B',
          orange: '#EA580C',
          yellow: '#FACC15',
          black: '#111111',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#128C7E',
        },
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-md': '5px 5px 0px 0px #000000',
        'brutal-lg': '7px 7px 0px 0px #000000',
        'brutal-xl': '9px 9px 0px 0px #000000',
        'brutal-white': '4px 4px 0px 0px #FFFFFF',
        'brutal-red': '4px 4px 0px 0px #DC2626',
        'brutal-yellow': '4px 4px 0px 0px #CA8A04',
        'brutal-press': '1px 1px 0px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '5': '5px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        marquee: 'marquee 18s linear infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
