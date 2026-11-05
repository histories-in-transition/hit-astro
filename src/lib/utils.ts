export function makeSuperScript(text: string): string {
	if (!text) return text;
	// Regex to find text between *asterisks*
	const regex = /\*\*(.*?)\*\*/g;
	// Replace the matched text with <sup> tags
	return text.replace(regex, "<sup>$1</sup>");
}

export const parseLocus = (locus) =>
	locus.split("-").map((part) => {
		const match = part.match(/^(\d+)([rv]?)$/);
		if (!match) return [Infinity, "z"];
		return [parseInt(match[1], 10), match[2] || ""];
	});

export const sortByLocus = (a, b) => {
	const [startA, endA = startA] = parseLocus(a.locus);
	const [startB, endB = startB] = parseLocus(b.locus);

	return (
		startA[0] - startB[0] ||
		startA[1].localeCompare(startB[1]) ||
		endA[0] - endB[0] ||
		endA[1].localeCompare(endB[1])
	);
};

export const palette = [
	"#1f77b4",
	"#ff7f0e",
	"#2ca02c",
	"#d62728",
	"#9467bd",
	"#c7523a",
	"#e377c2",
	"#7f7f7f",
	"#bcbd22",
	"#17becf",
	"#393b79",
	"#637939",
	"#8c6d31",
	"#843c39",
	"#7b4173",
	"#3182bd",
	"#e6550d",
	"#31a354",
	"#756bb1",
	"#636363",
];
export function getStratumColor(stratum: string | number) {
	return palette[Number(stratum) % palette.length];
}

// navigation function
// dropdown menu in navbar

function initDropdowns() {
	const dropdowns = document.querySelectorAll<HTMLElement>("[data-dropdown]");

	function closeDropdown(dropdown: HTMLElement) {
		const button = dropdown.querySelector<HTMLButtonElement>("[data-dropdown-button]");
		const menu = dropdown.querySelector<HTMLElement>("[data-dropdown-menu]");
		const icon = dropdown.querySelector<HTMLElement>("[data-dropdown-icon]");

		if (!button || !menu) return;

		button.setAttribute("aria-expanded", "false");
		menu.classList.add("hidden");
		icon?.classList.remove("rotate-180");
	}

	function openDropdown(dropdown: HTMLElement) {
		const button = dropdown.querySelector<HTMLButtonElement>("[data-dropdown-button]");
		const menu = dropdown.querySelector<HTMLElement>("[data-dropdown-menu]");
		const icon = dropdown.querySelector<HTMLElement>("[data-dropdown-icon]");

		if (!button || !menu) return;

		dropdowns.forEach((other) => {
			if (other !== dropdown) {
				closeDropdown(other);
			}
		});

		button.setAttribute("aria-expanded", "true");
		menu.classList.remove("hidden");
		icon?.classList.add("rotate-180");
	}

	dropdowns.forEach((dropdown) => {
		const button = dropdown.querySelector<HTMLButtonElement>("[data-dropdown-button]");

		if (!button) return;

		button.addEventListener("click", () => {
			const isOpen = button.getAttribute("aria-expanded") === "true";

			if (isOpen) {
				closeDropdown(dropdown);
			} else {
				openDropdown(dropdown);
			}
		});

		button.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				closeDropdown(dropdown);
				button.focus();
			}
		});

		dropdown.addEventListener("focusout", (event) => {
			const nextFocusedElement = event.relatedTarget;

			if (nextFocusedElement instanceof Node && dropdown.contains(nextFocusedElement)) {
				return;
			}

			closeDropdown(dropdown);
		});
	});

	document.addEventListener("click", (event) => {
		const target = event.target;

		if (!(target instanceof Node)) return;

		dropdowns.forEach((dropdown) => {
			if (!dropdown.contains(target)) {
				closeDropdown(dropdown);
			}
		});
	});
}

export { initDropdowns };

import { withBasePath } from "./withBasePath.ts";

function startSearch() {
	const searchInput = document.querySelector<HTMLInputElement>("#searchInput");
	const searchForm = document.querySelector<HTMLFormElement>("#searchForm");
	searchForm.addEventListener("submit", (event: SubmitEvent) => {
		event.preventDefault();
		const searchValue = searchInput.value.trim();
		if (searchValue) {
			window.location.href = withBasePath(`/search/?hit__msitems[query]=${searchValue}`);
		} else {
			window.location.href = withBasePath(`/search/`);
		}
	});
}
export { startSearch };
