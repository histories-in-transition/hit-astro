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
			// deduplicate places per manuscript since there are several identical orig_place place
			const placeSet = new Map<string, any>();

			for (const op of ms.orig_place ?? []) {
				for (const p of op.place ?? []) {
					if (!p.lat || !p.long) continue;
					placeSet.set(p.hit_id, p);
				}
			}

			// 2️⃣ Now count once per place
			for (const p of placeSet.values()) {
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
	return { places, genres };
}

// build dataset source for the line chart, with header and rows
export function buildDatasetSource(data: Map<string, Map<number, number>>) {
	const centuries = collectCenturies(data);

	const header = ["sub_genre", ...centuries.map((c) => `${c}. Jh.`)];
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
			.map((g) => g.sub_genre?.trim() || "Historiographie allgemein") ?? []
	);
}

function getCenturiesFromTransmission(ms: any): number[] {
	const centurySet = new Set<number>();

	for (const od of ms.orig_date ?? []) {
		for (const d of od.date ?? []) {
			// compute midpoint century
			if (d.not_before && d.not_after) {
				const start = Number(d.not_before);
				const end = Number(d.not_after);

				if (!isNaN(start) && !isNaN(end)) {
					const mid = Math.floor((start + end) / 2);
					const century = Math.ceil(mid / 100);
					centurySet.add(century);
				}
			}
		}
	}

	return Array.from(centurySet);
}

// count sub-genres by century from ms_transmission data for GenrePieChart
export function countSubGenres(works: Work[], selectedPlace) {
	const result = new Map<string, Map<number, number>>();
	// filter for historiographie sub-genres
	for (const work of works) {
		const subGenres = getHistoriographieSubGenres(work);
		if (!subGenres.length) continue;
		// get centuries from ms_transmission
		for (const ms of work.ms_transmission ?? []) {
			// make sure the ms_transmission is only for the selected place
			if (!msHasOrigPlace(ms, selectedPlace)) continue;
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
// helper to check if the ms should be counted in the piechart for this specific place
function msHasOrigPlace(ms: any, placeHitId: string) {
	return ms.orig_place?.some((op) => op.place?.some((p) => p.hit_id === placeHitId));
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

export function extractHistoriographyGenres(works: Work[]): string[] {
	const set = new Set<string>();

	for (const work of works) {
		const histGenres = (work.genre ?? []).filter((g) => g.main_genre === "Historiographie");

		if (!histGenres.length) continue;

		const subGenres = histGenres.map((g) => g.sub_genre).filter(Boolean) as string[];

		if (subGenres.length) {
			subGenres.forEach((sg) => set.add(sg));
		} else {
			set.add("Historiographie allgemein");
		}
	}

	return Array.from(set).sort((a, b) => a.localeCompare(b));
}

const PALETTE = [
	"#E74D1E", // orange
	"#FF9F1C", // amber
	"#2E658C", // baltic blue
	"#1D0200", // dark brown
	"#6FA008", // lime green
	"#221627", // violet
	"#651B52", // deep purple
	"#FFF12F", // bright lemon
];
export function buildGenreColorMap(genres: string[]) {
	const map = new Map<string, string>();

	genres.forEach((genre, i) => {
		map.set(genre, PALETTE[i % PALETTE.length]);
	});

	return map;
}
