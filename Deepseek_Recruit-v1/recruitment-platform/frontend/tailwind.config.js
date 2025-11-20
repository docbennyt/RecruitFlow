/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0df280",
        "background-light": "#FFFFFF",
        "background-dark": "#102219",
        "wireframe-text": "#000000",
        "wireframe-secondary-text": "#333333",
        "wireframe-border": "#CCCCCC",
        "wireframe-bg": "#FFFFFF",
        "wireframe-bg-alt": "#f0f0f0",
        "wireframe-hover": "#e0e0e0"
      },
      fontFamily: {
        display: ["Inter", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}