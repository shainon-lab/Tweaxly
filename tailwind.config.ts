import type { Config } from "tailwindcss";

// Theme-able color tokens are sourced from CSS variables defined in
// globals.css. Each variable holds an "R G B" channel triplet so Tailwind's
// `<alpha-value>` placeholder works with opacity modifiers like
// `bg-ink-900/80`. Brand colors stay as fixed hex — they don't theme.
const themed = (varName: string) => `rgb(var(${varName}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-able surface colors. Values flip when the html element has
        // data-theme="light".
        ink: {
          950: themed("--c-ink-950"),
          900: themed("--c-ink-900"),
          800: themed("--c-ink-800"),
          700: themed("--c-ink-700"),
        },
        line: themed("--c-line"),

        // Fixed brand colors — same in both themes.
        "brand-navy": "#0a1428",
        "brand-purple": "#A78BFA",
        "brand-purple-deep": "#7C5CFA",
        "brand-teal": "#22D3EE",
        "brand-teal-deep": "#06B6D4",
        accent: { DEFAULT: "#A78BFA", soft: themed("--c-accent-soft") },
        good: "#3ecf8e",
        bad: "#ef5b5b",
        warn: "#f1b04a",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(180deg, #A78BFA 0%, #22D3EE 100%)",
        "brand-gradient-h":
          "linear-gradient(90deg, #A78BFA 0%, #22D3EE 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
