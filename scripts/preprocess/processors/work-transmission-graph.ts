import type { Work } from "@/types/index.ts";
export function workGraph(works: Work[]) {
	const graph = {
		nodes: [] as { id: string; name: string; msItems: string[]; value: number; genre: string }[],
		edges: [] as {
			source: string;
			target: string;
			mss: { id: number; shelfmark: string; date: string; place: string }[];
			value: number;
			msitems: string[];
		}[],
	};
	// collect nodes from the works

	works
		.filter((work) => work.ms_transmission.length > 0) // get rid of works with no mss
		.forEach((work) => {
			const mss = new Set<string>();
			work.ms_transmission.forEach((msItem) => {
				msItem.manuscript.forEach((ms) => {
					mss.add(ms.value);
				});
			});
			const title =
				work.author.length > 0
					? `${work.author.map((a) => a.name).join(", ")}: ${work.title}`
					: work.title;
			// get genre, if Historiographie take the sub genre, otherwise only main genre to keep number low for cathegories
			const genre =
				work.genre.length > 0
					? work.genre[0].main_genre !== "Historiographie"
						? work.genre[0].main_genre
						: work.genre[0].sub_genre
							? work.genre[0].sub_genre
							: work.genre[0].main_genre
					: "unbekannt";
			const msItems = work.ms_transmission.map((msItem) => msItem.hit_id);
			graph.nodes.push({
				id: work.hit_id,
				name: title,
				msItems: msItems,
				value: Array.from(mss).length, // number of unique manuscripts to remove works with more than one msitem in the same ms
				genre: genre,
			});
		});

	// create mss to works mapping
	const msToWorks: Record<
		string,
		Array<{
			workId: string;
			msMeta: { id: number; shelfmark: string; date: string; place: string };
			msitems: string;
		}>
	> = {};
	works.forEach((work) => {
		const uniqueMsTransmissions = new Map<string, any>();
		work.ms_transmission.forEach((msItem) => {
			const key = msItem.manuscript[0]?.value || "unbekannt";
			if (!uniqueMsTransmissions.has(key)) {
				uniqueMsTransmissions.set(key, msItem);
			}
		});
		// sometimes one work is transmitted / copied more than once in the same manuscript,
		// hence we need only unique
		uniqueMsTransmissions.forEach((msItem) => {
			const ms = msItem.manuscript[0];
			const shelfmark = ms.value;
			const date = msItem.orig_date?.[0]?.date?.[0]?.value || "unbekannt";
			const place = msItem.orig_place?.[0]?.place?.[0]?.value || "unbekannt";
			const msitems = msItem.hit_id;

			if (!msToWorks[shelfmark]) {
				msToWorks[shelfmark] = [];
			}
			msToWorks[shelfmark].push({
				workId: work.hit_id,
				msMeta: {
					id: ms.id,
					shelfmark,
					date,
					place,
				},
				msitems: msitems,
			});
		});
	});

	// create edges based on shared manuscripts
	const edgeMap: Record<string, any> = {};

	Object.values(msToWorks).forEach((entries) => {
		for (let i = 0; i < entries.length; i++) {
			for (let j = i + 1; j < entries.length; j++) {
				const source = entries[i].workId;
				const target = entries[j].workId;

				const key = [source, target].sort().join("--");

				if (!edgeMap[key]) {
					edgeMap[key] = {
						source: source,
						target: target,
						mss: [],
						value: 0,
						msitems: new Set<string>(),
					};
				}

				edgeMap[key].mss.push(entries[i].msMeta);
				edgeMap[key].value += 1;

				// collect ALL msitems from both sides
				edgeMap[key].msitems.add(entries[i].msitems);
				edgeMap[key].msitems.add(entries[j].msitems);
			}
		}
	});

	graph.edges = Object.values(edgeMap).map((edge) => ({
		...edge,
		msitems: Array.from(edge.msitems),
	}));

	return graph;
}
