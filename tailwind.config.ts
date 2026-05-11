import type { Config } from "tailwindcss";

export default {
  content: ["./frontend/index.html", "./frontend/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff", 100: "#e0effe", 200: "#bae0fd", 300: "#7cc8fb",
          400: "#36aaf5", 500: "#0c8ee7", 600: "#0070c4", 700: "#01599f",
          800: "#064c83", 900: "#0b406d", 950: "#072849",
        },
        surface: {
          50: "#f8f9fa", 100: "#f1f3f5", 200: "#e9ecef", 300: "#dee2e6",
          400: "#ced4da", 500: "#adb5bd", 600: "#868e96", 700: "#495057",
          800: "#343a40", 900: "#212529",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
