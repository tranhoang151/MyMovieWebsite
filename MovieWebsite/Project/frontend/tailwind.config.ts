import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        // Netflix Design System Colors
        "netflix-red": "#E50914",
        "netflix-red-hover": "#F40612",
        "netflix-dark": "#141414",
        "netflix-card": "#1f1f1f",
        "netflix-hover": "#2d2d2d",
        "netflix-green": "#46D369",
        "netflix-text-primary": "#FFFFFF",
        "netflix-text-secondary": "#B3B3B3",
        "netflix-text-muted": "#6b7280",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Outfit", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      aspectRatio: {
        "movie-poster": "2 / 3",
        "movie-thumb": "16 / 9",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/line-clamp"),
  ],
};
export default config;