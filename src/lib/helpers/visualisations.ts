import type { Work } from "@/types/work";

// one type for both GenrePieChart and GenreMap
type AggregatedData = {
	places: Map<
		string,
		{
			name: string;
			lat: number;
			lng: number;
			centuries: Map<number, Map<string, number>>;
		}
	>;
	genres: Map<string, Map<number, number>>;
};

export function aggregateWorks(works: Work[]): AggregatedData {
	const places = new Map();
	const genres = new Map();

	for (const work of works) {
		const subGenres = getHistoriographieSubGenres(work);
		if (!subGenres.length) continue;

		for (const ms of work.ms_transmission ?? []) {
			const centuries = getCenturiesFromTransmission(ms);
			if (!centuries.length) continue;

			// --- genre aggregation ---
			for (const sg of subGenres) {
				if (!genres.has(sg)) genres.set(sg, new Map());
				const centuryMap = genres.get(sg)!;

				for (const c of centuries) {
					centuryMap.set(c, (centuryMap.get(c) ?? 0) + 1);
				}
			}

			// --- place aggregation ---
			for (const op of ms.orig_place ?? []) {
				for (const p of op.place ?? []) {
					if (!p.lat || !p.long) continue;

					if (!places.has(p.hit_id)) {
						places.set(p.hit_id, {
							name: p.value,
							lat: Number(p.lat),
							lng: Number(p.long),
							centuries: new Map(),
						});
					}

					const placeEntry = places.get(p.hit_id)!;

					for (const c of centuries) {
						if (!placeEntry.centuries.has(c)) {
							placeEntry.centuries.set(c, new Map());
						}

						const genreMap = placeEntry.centuries.get(c)!;

						for (const sg of subGenres) {
							genreMap.set(sg, (genreMap.get(sg) ?? 0) + 1);
						}
					}
				}
			}
		}
	}

	return { places, genres };
}

// build dataset source for the line chart, with header and rows
export function buildDatasetSource(data: Map<string, Map<number, number>>) {
	const centuries = collectCenturies(data);

	const header = ["sub_genre", ...centuries.map((c) => `${c}th`)];
	const rows = [];

	for (const [subGenre, centuryMap] of data.entries()) {
		rows.push([subGenre, ...centuries.map((c) => centuryMap.get(c) ?? 0)]);
	}

	return [header, ...rows];
}

// interest only in historiography sub-genres
function getHistoriographieSubGenres(work: Work): string[] {
	return (
		work.genre
			?.filter((g) => g.main_genre === "Historiographie")
			.map((g) => g.sub_genre?.trim() || "Unspecified") ?? []
	);
}

function normalizeCentury(raw: string): number | null {
	const match = raw.match(/\d+/);
	return match ? Number(match[0]) : null;
}

function getCenturiesFromTransmission(ms: any): number[] {
	const centuries = [];

	for (const od of ms.orig_date ?? []) {
		for (const d of od.date ?? []) {
			for (const c of d.century ?? []) {
				const norm = normalizeCentury(c);
				if (norm) centuries.push(norm);
			}
		}
	}

	return centuries;
}
// count sub-genres by century from ms_transmission data for GenrePieChart
export function countSubGenres(works: Work[]) {
	const result = new Map<string, Map<number, number>>();
	// filter for historiographie sub-genres
	for (const work of works) {
		const subGenres = getHistoriographieSubGenres(work);
		if (!subGenres.length) continue;
		// get centuries from ms_transmission
		for (const ms of work.ms_transmission ?? []) {
			const centuries = getCenturiesFromTransmission(ms);
			if (!centuries.length) continue;

			for (const sg of subGenres) {
				if (!result.has(sg)) {
					result.set(sg, new Map());
				}
				const centuryMap = result.get(sg)!;

				for (const c of centuries) {
					centuryMap.set(c, (centuryMap.get(c) ?? 0) + 1);
				}
			}
		}
	}

	return result;
}

// centuries for the line chart
function collectCenturies(data: Map<string, Map<number, number>>): number[] {
	const set = new Set<number>();

	for (const centuryMap of data.values()) {
		for (const c of centuryMap.keys()) {
			set.add(c);
		}
	}

	return [...set].sort((a, b) => a - b);
}
