/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"PP Neue Montreal"', 'sans-serif'],
        serif: ['"PP Mondwest"', 'serif'],
        mono: ['"Space Mono"', 'monospace'],
        pixel: ['"Geist Pixel"', 'monospace'],
      },
      colors: {
        navy: {
          900: '#051A24',
        },
        accent: {
          DEFAULT: '#C8F33A',
        }
      },
      animation: {
        marquee: 'marquee 20s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
