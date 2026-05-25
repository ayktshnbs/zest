import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#b80035",
          container: "#e11d48",
        },
        secondary: {
          DEFAULT: "#795900",
          container: "#ffc329",
        },
        surface: {
          DEFAULT: "#fdf9e9",
          dim: "#dedacb",
          bright: "#fdf9e9",
          container: "#f2eede",
        },
        "stone-dark": "#1c1c13",
      },
      fontFamily: {
        display: ["var(--font-plus-jakarta)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      borderRadius: {
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
        "4xl": "3.5rem",
      },
      spacing: {
        "margin-desktop": "64px",
        "margin-mobile": "20px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
export default config;
