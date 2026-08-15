/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Deep navy — primary brand color (nav, headings, structure)
        brand: {
          50: "#EEF2F6",
          100: "#D7DFEA",
          200: "#B0C0D6",
          300: "#869EBE",
          400: "#5D7DA3",
          500: "#3D5F86",
          600: "#2C4A6B",
          700: "#213A54",
          800: "#172A3D",
          900: "#0F1D2A",
        },
        // Warm amber/gold — accent for primary actions and highlights
        accent: {
          50: "#FDF6E7",
          100: "#FAEAC5",
          200: "#F3D488",
          300: "#EABD54",
          400: "#DFA430",
          500: "#C98B1E",
          600: "#A66F16",
          700: "#7D5411",
          800: "#573A0C",
          900: "#362408",
        },
        // Muted sage — reserved for semantic success/active states
        sage: {
          50: "#F1F6F0",
          100: "#DCEEDC",
          400: "#6FA96C",
          600: "#4A7C48",
          700: "#3A6138",
        },
        surface: "#F5F6F8",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
