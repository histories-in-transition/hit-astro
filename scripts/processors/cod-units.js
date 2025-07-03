import { addPrevNextToMsItems, enrichPlaces, enrichBibl, enrichDates } from "../utils.js";

// ===== COD UNITS PROCESSOR =====

/**
 * Process cod units data by cleaning and standardizing the structure
 * @param {Array} cod_units - Raw cod units data
 * @param {Object} deps - All dependencies
 * @param {Array} deps.cod_unitsprov - Cod unit provenance data
 * @param {Array} deps.msItemsPlus - Processed manuscript items
 * @param {Array} deps.places - Places data
 * @param {Array} deps.dates - Dates data
 * @param {Array} deps.bibliography - Bibliography data
 * @returns {Array} Processed cod units with prev/next navigation
 */
export function processCodUnits(cod_units, deps) {
	if (!Array.isArray(cod_units)) {
		throw new Error("processCodUnits expects an array of cod units");
	}

	const { cod_unitsprov, msItemsPlus, places, dates, bibliography } = deps;

	const processedCodUnits = cod_units.map((unit) =>
		transformCodUnit(unit, cod_unitsprov, msItemsPlus, places, dates, bibliography),
	);

	return addPrevNextToMsItems(processedCodUnits);
}

/**
 * Transform a single cod unit
 * @param {Object} unit - Raw cod unit data
 * @param {Array} cod_unitsprov - Cod unit provenance data
 * @param {Array} msItemsPlus - Processed manuscript items
 * @param {Array} places - Places data
 * @param {Array} dates - Dates data
 * @param {Array} bibliography - Bibliography data
 * @returns {Object} Transformed cod unit
 */
function transformCodUnit(unit, cod_unitsprov, msItemsPlus, places, dates, bibliography) {
	// Get provenance places for this cod unit
	const prov_place = getCodUnitProvenance(unit, cod_unitsprov, places, dates, bibliography);

	// Get relevant ms items for this cod unit
	const relevantMsItems = getCodUnitContent(unit, msItemsPlus);

	return {
		id: unit.id,
		hit_id: unit.hit_id,
		value: unit.label[0]?.value || "Unknown Unit",
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
		prov_place: prov_place,
		content: relevantMsItems,
		// Add manuscript reference for easy lookup
		manuscript: unit.manuscript?.map(({ order, ...rest }) => rest) ?? [],
	};
}

/**
 * Get provenance information for a cod unit
 */
function getCodUnitProvenance(unit, cod_unitsprov, places, dates, bibliography) {
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

/**
 * Get content (ms items) for a cod unit
 */
function getCodUnitContent(unit, msItemsPlus) {
	return msItemsPlus
		.filter((item) => item.cod_unit?.some((u) => u.id === unit.id))
		.map(cleanMsItemForCodUnit);
}

/**
 * Clean ms item data for cod unit display
 */
function cleanMsItemForCodUnit(item) {
	const {
		manuscript,
		cod_unit,
		hands,
		view_label,
		library,
		library_place,
		author_entry,
		prev,
		next,
		...rest
	} = item;
	return rest;
}

// ===== UTILITY FUNCTIONS FOR MANUSCRIPT PROCESSOR =====

/**
 * Get cod units for a specific manuscript from processed cod units
 * @param {Object} manuscript - Manuscript object
 * @param {Array} processedCodUnits - Already processed cod units
 * @returns {Array} Cod units belonging to this manuscript
 */
export function getCodUnitsForManuscript(manuscript, processedCodUnits) {
	return processedCodUnits.filter((unit) => unit.manuscript.some((ms) => ms.id === manuscript.id));
}
