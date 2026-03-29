/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101418",
        sand: "#f5efe3",
        ember: "#ff6b35",
        moss: "#718355",
        gold: "#c08a2b",
        slate: "#44505c"
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["DM Sans", "sans-serif"]
      },
      boxShadow: {
        panel: "0 24px 80px rgba(16, 20, 24, 0.12)"
      }
    }
  },
  plugins: []
};
