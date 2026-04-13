import { writable } from "svelte/store";

export const selectedHitId = writable(null);

export const filters = writable({
	authors: [],
	works: [],
	query: "",
});

export const filteredIds = writable(new Set());

export const dataWorksGraph = writable({
	nodes: [],
	links: [],
});
