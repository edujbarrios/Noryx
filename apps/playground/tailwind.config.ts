import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101418",
        paper: "#f7f4ee",
        line: "#d8d1c4",
        moss: "#6f7f4f",
        clay: "#b35f4b"
      }
    }
  },
  plugins: []
};

export default config;
