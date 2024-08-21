/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brandIvory: "#FFF0EE",
        brandRose: "#EDD4C2",
        brandRed: "#8A4C55",
        brandYellow: "#FFAC1D",
      },
    },
  },
  plugins: [typography],
};
