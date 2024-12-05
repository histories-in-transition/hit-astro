/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brandIvory: "#fff8f7",
        brandRose: "#fcf1e8",
        brandRed: "#9c3e03",
        brandRoseDark: "#fae9db"
      },
    },
  },
  plugins: [typography],
};
