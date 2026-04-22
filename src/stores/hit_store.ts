import { writable } from "svelte/store";
import type { GraphData } from "@/types/graph";

export const selectedHitId = writable(null);

export const filters = writable({
	authors: [],
	works: [],
	genres: [],
	centuries: [],
	places: [],
	query: "",
});

export const filteredIds = writable(new Set<string>());

export const dataWorksGraph = writable<GraphData>({ nodes: [], edges: [] });
