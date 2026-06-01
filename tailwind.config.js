/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        term: {
          bg: "#000000",
          panel: "#0a0a0a",
          panel2: "#111111",
          border: "#2a2a2a",
          borderlit: "#3a3a3a",
          amber: "#F59E0B",
          green: "#22c55e",
          yellow: "#eab308",
          red: "#ef4444",
          cyan: "#06b6d4",
          dim: "#6b7280",
          text: "#d4d4d4",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Roboto Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
