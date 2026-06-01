import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)", 
        foreground: "var(--foreground)",
        surface: "var(--secondary)", 
        border: "var(--border)", 
        "text-primary": "var(--foreground)", 
        "text-secondary": "var(--muted-foreground)", 
        primary: {
          DEFAULT: "var(--primary)", 
          foreground: "var(--primary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)", 
          foreground: "var(--accent-foreground)",
        },
      },
      fontFamily: {
        display: ["var(--font-audiowide)", "var(--font-space-grotesk)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        audiowide: ["var(--font-audiowide)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
        'premium-hover': '0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(79, 140, 255, 0.15)', // Blue glow
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glow': '0 0 15px rgba(79, 140, 255, 0.3)',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.22, 1, 0.36, 1)', // Smooth ease-out
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      backgroundImage: {
        'metallic-gradient': 'linear-gradient(145deg, #22262E 0%, #171A20 100%)',
        'metallic-surface': 'linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
        'shine-sweep': 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
        'blob-gradient': 'radial-gradient(circle at center, rgba(79, 140, 255, 0.15) 0%, transparent 70%)',
      },
      keyframes: {
        blobBounce: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        'blob': 'blobBounce 10s infinite cubic-bezier(0.4, 0, 0.2, 1)',
        'float': 'float 6s infinite ease-in-out',
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
export default config;
