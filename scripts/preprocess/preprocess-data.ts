import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { loadAllData } from "./data-loader.ts";
import { processPlaces } from "./processors/places.js";
import { processLibraries } from "./processors/libraries.js";
import { processMsItems } from "./processors/msitems.js";
import { processHands, enrichHandsWithScribes } from "./processors/hands.js";
import { processScribes } from "./processors/scribes.js";
import { processCodUnits } from "./processors/cod-units.js";
import { processStrata } from "./processors/strata.js";
import { processWorks } from "./processors/works.js";
import { processManuscripts } from "./processors/manuscripts.js";

// Set up output folder
const outputFolder = join(process.cwd(), "src", "content", "data");
mkdirSync(outputFolder, { recursive: true });

/**
 * Simple function to save JSON data to file
 */
function saveJSON(filename: string, data: unknown): void {
	const filePath = join(outputFolder, filename);
	writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: "utf-8" });
	console.log(`💾 Saved ${filename}`);
}

/**
 * Main processing pipeline
 */
async function processAllData(): Promise<{
	places: unknown[];
	libraries: unknown[];
	msItems: unknown[];
	hands: unknown[];
	scribes: unknown[];
	codUnits: unknown[];
	strata: unknown[];
	works: unknown[];
	manuscripts: unknown[];
}> {
	try {
		console.log("Starting data preprocessing...");

		// Load all raw data
		const rawData = loadAllData();
		console.log(`Loaded ${Object.keys(rawData).length} data files`);

		// 1. Process independent data first
		console.log("Processing independent data...");

		const processedPlaces = processPlaces(rawData.places);
		console.log(`Processed ${processedPlaces.length} places`);

		const processedLibraries = processLibraries(rawData.libraries, processedPlaces);
		console.log(`Processed ${processedLibraries.length} libraries`);

		// 2. Process msItems (depends on places, libraries, and raw data.)
		console.log("Processing manuscript items...");
		const processedMsItems = processMsItems(rawData.msitems, {
			manuscripts: rawData.manuscripts,
			places: processedPlaces,
			librariesPlus: processedLibraries,
			works: rawData.works,
			people: rawData.people,
			genres: rawData.genres,
			hands: rawData.hands,
			handsdated: rawData.handsdated,
			handsplaced: rawData.handsplaced,
			handsrole: rawData.handsrole,
			cod_unitsprov: rawData.cod_unitsprov,
			bibliography: rawData.bibliography,
			dates: rawData.dates,
		});
		console.log(`Processed ${processedMsItems.length} manuscript items`);

		// 3. Process hands (first pass - without scribe data)
		console.log("Processing hands (first pass)...");
		const handsFirstPass = processHands(rawData.hands, {
			handsdated: rawData.handsdated,
			handsplaced: rawData.handsplaced,
			handsrole: rawData.handsrole,
			msItemsPlus: processedMsItems,
			places: processedPlaces,
			bibliography: rawData.bibliography,
			dates: rawData.dates,
		});
		console.log(`Processed ${handsFirstPass.length} hands (first pass)`);
		// 4. Process scribes (depends on hands first pass)
		console.log("Processing scribes...");
		const processedScribes = processScribes(rawData.scribes, handsFirstPass);
		console.log(`Processed ${processedScribes.length} scribes`);

		// 5. Process hands again (second pass - with scribe data)
		console.log("Processing hands (second pass with scribes)...");
		const handsWithScribes = enrichHandsWithScribes(handsFirstPass, processedScribes);
		console.log(`Processed ${handsWithScribes.length} hands (second pass)`);

		// 6. Process cod units (reusable!)
		console.log("Processing cod units...");
		const processedCodUnits = processCodUnits(rawData.cod_units, {
			cod_unitsprov: rawData.cod_unitsprov,
			msItemsPlus: processedMsItems,
			places: processedPlaces,
			dates: rawData.dates,
			bibliography: rawData.bibliography,
		});
		console.log(`Processed ${processedCodUnits.length} cod units`);

		// 7. Process strata (reusable!)
		console.log("Processing strata...");

		type RawStratum = {
			id: string | number;
			hit_id: string;
			number?: string;
			label?: { value: string }[];
			character?: { value: string }[];
			note?: string;
			locus?: string;
			manuscript: { id: string | number; hit_id: string; value?: string }[];
			hand_role: { id: string | number }[];
		};
		const processedStrata = processStrata(Object.values(rawData.strataa) as RawStratum[], {
			handsrole: rawData.handsrole,
			hands: rawData.hands,
			handsdated: rawData.handsdated,
			handsplaced: rawData.handsplaced,
			msItemsPlus: processedMsItems,
			places: processedPlaces,
			dates: rawData.dates,
			bibliography: rawData.bibliography,
			strata_filiations: rawData.strata_filiations,
			strataa: rawData.strataa,
			filiated_strata: rawData.filiated_strata,
			works: rawData.works,
		});
		console.log(`Processed ${processedStrata.length} strata`);

		// 8. Process works (depends on processed msItems)
		console.log("Processing works...");
		const processedWorks = processWorks(rawData.works, {
			people: rawData.people,
			genres: rawData.genres,
			msItemsPlus: processedMsItems,
			bibliography: rawData.bibliography,
		});
		console.log(`Processed ${processedWorks.length} works`);

		// 9. Process manuscripts (depends on almost everything)
		console.log("Processing manuscripts...");
		const processedManuscripts = processManuscripts(rawData.manuscripts, {
			manuscripts_dated: rawData.manuscripts_dated,
			processedCodUnits: processedCodUnits,
			processedStrata: processedStrata,
			libraries: rawData.libraries,
			librariesPlus: processedLibraries,
			handsWithScribe: handsWithScribes,
			msItemsPlus: processedMsItems,
			places: processedPlaces,
			dates: rawData.dates,
			bibliography: rawData.bibliography,
			// Still need these for TBD strata
			handsrole: rawData.handsrole,
			hands: rawData.hands,
			handsdated: rawData.handsdated,
			handsplaced: rawData.handsplaced,
		});
		console.log(`Processed ${processedManuscripts.length} manuscripts`);

		console.log("All data processed successfully!");

		return {
			places: processedPlaces,
			libraries: processedLibraries,
			msItems: processedMsItems,
			hands: handsWithScribes,
			scribes: processedScribes,
			codUnits: processedCodUnits,
			strata: processedStrata,
			works: processedWorks,
			manuscripts: processedManuscripts,
		};
	} catch (error: unknown) {
		console.error("Processing failed:", error);
		throw error;
	}
}

/**
 * Save all processed data to files
 */
async function saveAllProcessedData(processedData: {
	places: unknown[];
	libraries: unknown[];
	msItems: unknown[];
	hands: unknown[];
	scribes: unknown[];
	codUnits: unknown[];
	strata: unknown[];
	works: unknown[];
	manuscripts: unknown[];
}): Promise<void> {
	console.log("Saving processed data...");

	// Save each file - simple and straightforward
	saveJSON("places.json", processedData.places);
	saveJSON("libraries.json", processedData.libraries);
	saveJSON("ms_items.json", processedData.msItems);
	saveJSON("hands.json", processedData.hands);
	saveJSON("scribes.json", processedData.scribes);
	saveJSON("cod_units.json", processedData.codUnits);
	saveJSON("strata.json", processedData.strata);
	saveJSON("works.json", processedData.works);
	saveJSON("manuscripts.json", processedData.manuscripts);

	console.log("All files saved successfully!");
}

/**
 * Main execution
 */
async function main() {
	try {
		// Process all data
		const processedData = await processAllData();

		// Save all processed data
		await saveAllProcessedData(processedData);

		console.log("Data preprocessing completed successfully!");
	} catch (error: unknown) {
		console.error("Main process failed:", error);
		process.exit(1);
	}
}

// Run the script
main();
