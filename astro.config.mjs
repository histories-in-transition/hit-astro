import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  server: {
    port: 3000,
    open: 'hit-astro', // Automatically open at the correct base path
  },
  integrations: [tailwind(), icon()],
  site: "https://histories-in-transition.github.io",
  base: "/hit-astro", //  GitHub repo name
  
  build: {
    format: 'directory',
    cleanUrls: true
  }
});
