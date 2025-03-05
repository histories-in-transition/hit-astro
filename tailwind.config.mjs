/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";
export default {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		extend: {
			colors: {
				brand: {
					50: "#f9f6f1", // Lightest Ivory
					100: "#f6f0e6", // light beige
					300: "#e9dfcd", // beige
					800: "#6d2b02", // Darker Red
				},
				neutral: {
					50: "#f9f6f1", // Background
				},
			},
		},
	},
	plugins: [typography],
};
