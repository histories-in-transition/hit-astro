import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

export default defineConfig({
	server: {
		port: 3000,
		open: "hit-astro", // Automatically open at the correct base path
	},
	integrations: [icon()],
	site: "https://histories-in-transition.github.io",
	base: "/hit-astro", //  GitHub repo name

	build: {
		format: "directory",
		cleanUrls: true,
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
