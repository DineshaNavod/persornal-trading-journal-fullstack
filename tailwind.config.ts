import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#7C5CFC",
          dark: "#5B3DF0",
          deep: "#4A2BD6",
          light: "#EFE9FF",
        },
        profit: {
          DEFAULT: "#17A56B",
          soft: "#E3F8EE",
          dark: "#0F8956",
        },
        loss: {
          DEFAULT: "#E0473F",
          soft: "#FCEAE9",
          dark: "#C53A33",
        },
        neutral: {
          50: "#FAFAFC",
          100: "#F4F4F9",
          150: "#EEEEF5",
          200: "#E6E6F0",
          300: "#D4D4E2",
          400: "#A6A6BC",
          500: "#7C7C94",
          600: "#5C5C72",
          700: "#43435A",
          800: "#2B2B40",
          900: "#16161F",
          950: "#0D0D14",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1.1rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(22,22,31,0.04), 0 8px 24px -8px rgba(22,22,31,0.08)",
        softer: "0 1px 2px rgba(22,22,31,0.03), 0 4px 14px -6px rgba(22,22,31,0.06)",
        glow: "0 0 0 4px rgba(124,92,252,0.12)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "scale-in": "scale-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
