import type { Work } from "@/types/index.ts";
// export function processWorkGenreData(works: Work[]) {
// 	// take only historiography works
// 	const historiographyWorks = works
// 		.filter((work) => work.genre.some((g) => g.main_genre === "Historiographie"))
// 		.map((work) => {
// 			const aut = work.author.length > 0 ? work.author.map((a) => a.name).join(", ") : "";
// 			const title = aut ? `${aut}: ${work.title}` : work.title;
// 			// filter any possible non-hist genres
// 			const histGenre = work.genre.filter((g) => g.main_genre === "Historiographie");
// 			// check if narrow sub-genre exists, if not use "Historiographie allgemein" as fallback
// 			const genres = histGenre.map((g) =>
// 				g.sub_genre ? g.sub_genre : "Historiographie allgemein",
// 			);
// 			// create a Map <place,  Map<century, count>>

// 			const orig_place_map = new Map<string, Map<string, number>>();
// 			work.ms_transmission.forEach((msitem) => {
// 				const places = msitem.orig_place
// 					? msitem.orig_place.flatMap((p) => p.place ?? []).map((pl) => pl.value)
// 					: ["Unbekannt"];
// 				const centuriesRaw = msitem.orig_date
// 					? msitem.orig_date.flatMap((dat) =>
// 							dat.date ? dat.date.flatMap((date) => date.century ?? []) : [],
// 						)
// 					: [];

// 				// make a Set to get unique centuries from the multiple datings from multiple authority in msitems
// 				const centuries = centuriesRaw.length > 0 ? [...new Set(centuriesRaw)] : ["Undatiert"];
// 				places.forEach((place) => {
// 					if (!orig_place_map.has(place)) {
// 						orig_place_map.set(place, new Map());
// 					}
// 					const centuryMap = orig_place_map.get(place)!;
// 					centuries.forEach((century) => {
// 						const current = centuryMap.get(century) ?? 0;
// 						centuryMap.set(century, current + 1);
// 					});
// 				});
// 			});
// 			const transmission_map = Object.fromEntries(
// 				Array.from(orig_place_map.entries()).map(([place, centuryMap]) => [
// 					place,
// 					Object.fromEntries(centuryMap),
// 				]),
// 			);
// 			return {
// 				hit_id: work.hit_id,
// 				title: title,
// 				genres: genres,
// 				ms_transmission: transmission_map,
// 			};
// 		});
// 	return historiographyWorks;
// }

export function makeWorkGenreChartsData(works: Work[]) {
	type GenreData = {
		count: number;
		works: Set<string>;
	};
	const placeMap = new Map<
		string, // place
		Map<
			string, // century
			Map<
				string, // genre
				GenreData
			>
		>
	>();
	// need to store coordinates for map chart
	const placeCoords = new Map<string, { lat: number; lng: number }>();
	// take only historiography works
	works
		.filter((work) => work.genre.some((g) => g.main_genre === "Historiographie"))
		.forEach((work) => {
			const workTitle =
				work.author.length > 0
					? `${work.author.map((a) => a.name).join(", ")}: ${work.title}`
					: work.title;

			const genres = work.genre
				.filter((g) => g.main_genre === "Historiographie")
				.map((g) => (g.sub_genre ? g.sub_genre : "Historiographie allgemein"));

			work.ms_transmission.forEach((msitem) => {
				// collect places
				const placesRaw = msitem.orig_place
					? msitem.orig_place.flatMap((p) =>
							(p.place ?? []).map((pl) => {
								// store coords once
								if (!placeCoords.has(pl.value)) {
									placeCoords.set(pl.value, {
										lat: Number(pl.lat),
										lng: Number(pl.long),
									});
								}
								return pl.value;
							}),
						)
					: [];
				// deduplicate (multipleplacements cause of multiple authorities)
				const places = placesRaw.length > 0 ? [...new Set(placesRaw)] : ["Unbekannt"];

				// centuries collect
				const centuriesRaw = msitem.orig_date
					? msitem.orig_date.flatMap((dat) =>
							dat.date ? dat.date.flatMap((date) => date.century ?? []) : [],
						)
					: [];
				// deduplicate cause of same problem as by bplaces
				const centuries = centuriesRaw.length > 0 ? [...new Set(centuriesRaw)] : ["Undatiert"];

				// populate Map with place -> century -> genre -> count + works
				places.forEach((place) => {
					if (!placeMap.has(place)) {
						placeMap.set(place, new Map());
					}

					const centuryMap = placeMap.get(place)!;

					centuries.forEach((century) => {
						if (!centuryMap.has(century)) {
							centuryMap.set(century, new Map());
						}

						const genreMap = centuryMap.get(century)!;

						genres.forEach((genre) => {
							if (!genreMap.has(genre)) {
								genreMap.set(genre, {
									count: 0,
									works: new Set(),
								});
							}

							const entry = genreMap.get(genre)!;

							entry.count += 1;
							entry.works.add(workTitle);
						});
					});
				});
			});
		});
	const flatData = [];

	for (const [place, centuryMap] of placeMap) {
		for (const [century, genreMap] of centuryMap) {
			for (const [genre, val] of genreMap) {
				const coords = placeCoords.get(place);

				flatData.push({
					place,
					lat: coords?.lat ?? null,
					lng: coords?.lng ?? null,
					century,
					genre,
					count: val.count,
					works: [...val.works],
				});
			}
		}
	}
	return flatData;
}
