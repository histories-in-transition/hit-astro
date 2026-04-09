import { addPrevNextToMsItems, enrichPlaces, enrichBibl, enrichDates } from "./utils.ts";

import type {
	HitCodunits,
	HitCodPlaced,
	HitDates,
	HitBibliography,
} from "@/types/zod/zod-types.ts";

import type { Place, MsItem, Codunit } from "@/types/index.ts";

// ===== TYPES =====

type CodUnitDeps = {
	cod_unitsprov: HitCodPlaced[];
	msItemsPlus: MsItem[];
	places: Place[];
	dates: HitDates[];
	bibliography: HitBibliography[];
};

// ===== COD UNITS PROCESSOR =====

export function processCodUnits(cod_units: HitCodunits[], deps: CodUnitDeps): Codunit[] {
	if (!Array.isArray(cod_units)) {
		throw new Error("processCodUnits expects an array of cod units");
	}

	const { cod_unitsprov, msItemsPlus, places, dates, bibliography } = deps;

	const processedCodUnits = cod_units.map((unit) =>
		transformCodUnit(unit, cod_unitsprov, msItemsPlus, places, dates, bibliography),
	);

	return addPrevNextToMsItems(processedCodUnits);
}

// ===== TRANSFORM =====

function transformCodUnit(
	unit: HitCodunits,
	cod_unitsprov: HitCodPlaced[],
	msItemsPlus: MsItem[],
	places: Place[],
	dates: HitDates[],
	bibliography: HitBibliography[],
): Codunit {
	const prov_place = getCodUnitProvenance(unit, cod_unitsprov, places, dates, bibliography);

	const relevantMsItems = getCodUnitContent(unit, msItemsPlus);

	return {
		id: unit.id,
		hit_id: unit.hit_id,
		value: unit.label?.[0]?.value ?? "Unknown Unit",
		number: unit.number,
		notes: unit.notes ?? "",
		locus: unit.locus,
		material: unit.material?.value ?? "",
		material_spec: unit.material_spec ?? "",
		catchwords: unit.catchwords ?? "",
		quiremarks: unit.quiremarks ?? "",
		heigth: unit.heigth ?? "",
		width: unit.width ?? "",
		written_height: unit.written_height ?? "",
		written_width: unit.written_width ?? "",
		columns: unit.columns?.map((c) => c.value) ?? [],
		lines_number: unit.lines_number ?? "",
		ruling: unit.ruling ?? "",
		decoration: unit.decorations ?? "",
		basic_structure: unit.basic_structure?.map((str) => str.value) ?? [],
		prov_place,
		content: relevantMsItems,
		manuscript: unit.manuscript?.map(({ order, ...rest }) => rest) ?? [],
	};
}

// ===== HELPERS =====

function getCodUnitProvenance(
	unit: HitCodunits,
	cod_unitsprov: HitCodPlaced[],
	places: Place[],
	dates: HitDates[],
	bibliography: HitBibliography[],
) {
	return cod_unitsprov
		.filter((prov) => prov.cod_unit.some((c) => c.id === unit.id))
		.map((prov) => ({
			hit_id: prov.hit_id,
			places: enrichPlaces(prov.place, places),
			from: enrichDates(prov.from, dates),
			till: enrichDates(prov.till, dates),
			uncertain_from: prov.uncertain_from,
			uncertain_till: prov.uncertain_till,
			type: prov.type.value,
			authority: enrichBibl(prov.authority, bibliography),
			page: prov.page ?? "",
		}));
}

function getCodUnitContent(unit: HitCodunits, msItemsPlus: MsItem[]) {
	return msItemsPlus
		.filter((item) => item.cod_unit?.some((u) => u.id === unit.id))
		.map(cleanMsItemForCodUnit);
}

function cleanMsItemForCodUnit(item: MsItem) {
	const {
		manuscript,
		cod_unit,
		hands,
		view_label,
		library,
		library_place,
		author_entry,
		joined_transmission,
		project,
		prev,
		next,
		...rest
	} = item;

	return rest;
}

// ===== REUSE HELPERS =====

export function getCodUnitsForManuscript(
	manuscript: { id: string | number },
	processedCodUnits: Codunit[],
) {
	return processedCodUnits.filter((unit) => unit.manuscript.some((ms) => ms.id === manuscript.id));
}
