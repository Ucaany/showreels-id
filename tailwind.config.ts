import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        cream: "#FBFAF4",
        creamStrong: "#F8F3E7",
        surface: "#FFFFFF",
        muted: "#F7F8FA",
        text: {
          primary: "#0A0D14",
          secondary: "#4B5563",
          muted: "#71717A",
        },
        border: "#E5E7EB",
        borderSoft: "#EEF0F3",
        accent: {
          DEFAULT: "#CFF45A",
          soft: "#EFFBC7",
          muted: "#F5FADB",
        },
        star: "#FFB800",
        success: "#23C55E",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 50px rgba(15, 23, 42, 0.06)",
        soft: "0 10px 30px rgba(15, 23, 42, 0.05)",
        phone: "0 16px 40px rgba(15, 23, 42, 0.12)",
        button: "0 8px 18px rgba(0, 0, 0, 0.16)",
      },
      borderRadius: {
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "40px",
      },
    },
  },
  plugins: [],
};
export default config;
