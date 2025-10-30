/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./presentation/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#137FEC",
        bgGray: "#EAEEF3",
        textGray: "#465C79",
      },

      fontFamily: {
        "Inter-Regular": ["Inter_18pt-Regular", "sans-serif"],
        "Inter-Bold": ["Inter_18pt-Bold", "sans-serif"],
        "Inter-Medium": ["Inter_18pt-Medium", "sans-serif"],
      },
    },
  },
  plugins: [],
};
