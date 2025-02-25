import type { CodUnit, Hand, Manuscript, MSItem, Stratum, Work } from "@/lib/data";
import { request } from "@acdh-oeaw/lib";

const baseUrl =
	"https://raw.githubusercontent.com/histories-in-transition/hit-baserow-dump/refs/heads/main/json_dumps/";

//////////////////////////////
////// EXPORT FUNCTIONS //////
//////////////////////////////

export function getPeople() {
	return request(new URL("people.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "people.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}
export function getHands() {
	return request(new URL("hands.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "hands.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}
export function getHandsDated() {
	return request(new URL("hands_dated.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "hands_dated.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}
export function getHandsPlaced() {
	return request(new URL("hands_placed.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "hands_placed.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}
export function getHandsRole() {
	return request(new URL("hands_role.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "hands_role.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}

export function getCodUnitPlaced() {
	return request(new URL("cod_unit_placed.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "cod_unit_placed.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}

export function getGenres() {
	return request(new URL("genres.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "genres.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}

export function getPlaces() {
	return request(new URL("places.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "places.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}

export function getDates() {
	return request(new URL("dates.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "dates.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}

export function getFiliated_strata() {
	return request(new URL("filiated_strata.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "filiated_strata.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}

export function getstrataFiliations() {
	return request(new URL("strata_filiations.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "strata_filiations.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}

export function getLibraries() {
	return request(new URL("libraries_organisations.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "libraries_organisations.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}

export function getBibliography() {
	return request(new URL("bibliography.json", baseUrl), {
		responseType: "json",
		// wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
	}).then((data) => ({ fileName: "bibliography.json", data })) as Promise<{
		fileName: string;
		data: Array<Hand>;
	}>;
}
//

export function getManuscripts() {
	return request(new URL("manuscripts.json", baseUrl), {
		responseType: "json",
	}).then((data) => ({ fileName: "manuscripts.json", data })) as Promise<{
		fileName: string;
		data: Array<Manuscript>;
	}>;
}

export function getManuscriptsDated() {
	return request(new URL("manuscripts_dated.json", baseUrl), {
		responseType: "json",
	}).then((data) => ({ fileName: "manuscripts_dated.json", data })) as Promise<{
		fileName: string;
		data: Array<Manuscript>;
	}>;
}

export function getWorks() {
	return request(new URL("works.json", baseUrl), {
		responseType: "json",
	}).then((data) => ({ fileName: "works.json", data })) as Promise<{
		fileName: string;
		data: Array<Work>;
	}>;
}

export function getMsItems() {
	return request(new URL("ms_items.json", baseUrl), {
		responseType: "json",
	}).then((data) => ({ fileName: "ms_items.json", data })) as Promise<{
		fileName: string;
		data: Array<MSItem>;
	}>;
}

export function getScribes() {
	return request(new URL("scribes.json", baseUrl), {
		responseType: "json",
	}).then((data) => ({ fileName: "scribes.json", data })) as Promise<{
		fileName: string;
		data: Array<MSItem>;
	}>;
}

export function getStrata() {
	return request(new URL("strata.json", baseUrl), {
		responseType: "json",
	}).then((data) => ({ fileName: "strata.json", data })) as Promise<{
		fileName: string;
		data: Array<Stratum>;
	}>;
}

export function getCodUnits() {
	return request(new URL("cod_units.json", baseUrl), {
		responseType: "json",
	}).then((data) => ({ fileName: "cod_units.json", data })) as Promise<{
		fileName: string;
		data: Array<CodUnit>;
	}>;
}
