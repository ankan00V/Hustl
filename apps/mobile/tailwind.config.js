/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        alt: "#9D4EDD",
      },
      fontFamily: {
        display: ["SpaceMono_700Bold", "sans-serif"],
        sans: ["SpaceMono_400Regular", "sans-serif"],
        mono: ["SpaceMono_400Regular", "monospace"],
        italic: ["SpaceMono_400Regular_Italic", "sans-serif"],
        bolditalic: ["SpaceMono_700Bold_Italic", "sans-serif"],
      },
    },
  },
  plugins: [],
}
