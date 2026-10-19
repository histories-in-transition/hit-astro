<script lang="ts">
	import { onMount } from "svelte";
	import type { Manuscript } from "@/types";
	import { prepareDataForStrataGraph } from "@/lib/stratigraphy-visualisation/prepareData";
	import { renderManuscriptStratigraphy } from "@/lib/stratigraphy-visualisation/render";

	let { manuscript }: { manuscript: Manuscript } = $props();

	let container: HTMLDivElement;

	const data = prepareDataForStrataGraph(manuscript);

	onMount(() => {
		renderManuscriptStratigraphy(container, data);
	});
</script>

<div bind:this={container} class="w-full mx-auto"></div>