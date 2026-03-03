/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeInSlow: {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0px)" },
        },
      },
      animation: {
        "fade-in-slow": "fadeInSlow 0.8s ease-out forwards",
      },
      boxShadow: {
        custom: "2px 3px 5.2px 0px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
};
