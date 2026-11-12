/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        urcare: {
          bg: "#FFFFFF",
          subtle: "#FAF8F8",
          sidebar: "#FFFFFF",
          pink: "#F4C7D3",
          accent: "#E88770",
          "accent-hover": "#D97660",
          "nav-active": "#FCEEF1",
          "nav-hover": "#F7F0F1",
          text: "#202124",
          muted: "#6B7280",
          border: "#EAE3E5",
          success: "#27805B",
          warning: "#B7791F",
          error: "#C04444",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
