/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Merriweather", "Georgia", "serif"], // ✅ Custom elegant font for quotes
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        "god-pulse": "god-pulse 3s infinite ease-in-out",
        "breathing": "breathing 4s infinite ease-in-out",
        "slowBreathe": "slowBreathe 3s infinite ease-in-out", // ✅ Slower, elegant cursor breathing
        "colorPulse": "colorPulse 3s infinite ease-in-out", // ✅ Color change for idle cursor
        "cursor-blink": "cursor-blink 1s infinite",
        "blink": "blink 0.7s infinite",
      },
      keyframes: {
        "god-pulse": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.1)", opacity: "0.9" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "breathing": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.7" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slowBreathe": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(2)", opacity: "0.8" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "colorPulse": {
          "0%": { color: "#ffffff" }, // White
          "33%": { color: "#60a5fa" }, // Blue-400
          "66%": { color: "#4ade80" }, // Green-400
          "100%": { color: "#ffffff" }, // Back to white
        },
        "cursor-blink": {
          "0%": { opacity: "1" },
          "50%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "blink": {
          "0%": { opacity: "1" },
          "50%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [
    // ✅ Custom plugin for modern scrollbar
    function ({ addUtilities }) {
      const scrollbarStyles = {
        ".scrollbar-modern": {
          /* Firefox */
          "scrollbar-width": "thin",
          "scrollbar-color": "#a0a0a0 #2d2d2d",
          /* Webkit (Chrome, Safari) */
          "&::-webkit-scrollbar": {
            width: "12px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(45, 45, 45, 0.8)",
            "border-radius": "12px",
            "box-shadow": "inset 0 0 4px rgba(0, 0, 0, 0.3)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "linear-gradient(135deg, #a0a0a0, #606060)",
            "border-radius": "12px",
            border: "2px solid #2d2d2d",
            transition: "background 0.2s ease",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
          },
        },
      };
      addUtilities(scrollbarStyles, ["responsive"]);
    },
  ],
};