import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { loadAllData } from "./data-loader.js";
import { processPlaces } from "./processors/places.js";
import { processLibraries } from "./processors/libraries.js";
import { processMsItems } from "./processors/msitems.js";
import { processHands, enrichHandsWithScribes } from "./processors/hands.js";
import { processScribes } from "./processors/scribes.js";
import { processCodUnits } from "./processors/cod-units.js";
import { processStrata } from "./processors/strata.js";
import { processWorks } from "./processors/works.js";
import { processManuscripts } from "./processors/manuscripts.js";
import { ProcessingLogger } from "./utils/logger.js";

// Set up output folder
const outputFolder = join(process.cwd(), "src", "content", "data");
mkdirSync(outputFolder, { recursive: true });

/**
 * Simple function to save JSON data to file
 */
function saveJSON(filename, data) {
	const filePath = join(outputFolder, filename);
	writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: "utf-8" });
	ProcessingLogger.info(`💾 Saved ${filename}`);
}

/**
 * Main processing pipeline
 */
async function processAllData() {
	try {
		ProcessingLogger.info("Starting data preprocessing...");

		// Load all raw data
		const rawData = loadAllData();
		ProcessingLogger.info(`Loaded ${Object.keys(rawData).length} data files`);

		// 1. Process independent data first
		ProcessingLogger.info("Processing independent data...");

		const processedPlaces = processPlaces(rawData.places);
		ProcessingLogger.logStep("places", processedPlaces.length);

		const processedLibraries = processLibraries(rawData.libraries, processedPlaces);
		ProcessingLogger.logStep("libraries", processedLibraries.length);

		// 2. Process msItems (depends on places, libraries, etc.)
		ProcessingLogger.info("Processing manuscript items...");
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
		ProcessingLogger.logStep("manuscript items", processedMsItems.length);

		// 3. Process hands (first pass - without scribe data)
		ProcessingLogger.info("Processing hands (first pass)...");
		const handsFirstPass = processHands(rawData.hands, {
			handsdated: rawData.handsdated,
			handsplaced: rawData.handsplaced,
			handsrole: rawData.handsrole,
			msItemsPlus: processedMsItems,
			places: processedPlaces,
			bibliography: rawData.bibliography,
			dates: rawData.dates,
		});
		ProcessingLogger.logStep("hands (first pass)", handsFirstPass.length);

		// 4. Process scribes (depends on hands first pass)
		ProcessingLogger.info("Processing scribes...");
		const processedScribes = processScribes(rawData.scribes, handsFirstPass);
		ProcessingLogger.logStep("scribes", processedScribes.length);

		// 5. Process hands again (second pass - with scribe data)
		ProcessingLogger.info("Processing hands (second pass with scribes)...");
		const handsWithScribes = enrichHandsWithScribes(handsFirstPass, processedScribes);
		ProcessingLogger.logStep("hands (with scribes)", handsWithScribes.length);

		// 6. Process cod units (reusable!)
		ProcessingLogger.info("Processing cod units...");
		const processedCodUnits = processCodUnits(rawData.cod_units, {
			cod_unitsprov: rawData.cod_unitsprov,
			msItemsPlus: processedMsItems,
			places: processedPlaces,
			dates: rawData.dates,
			bibliography: rawData.bibliography,
		});
		ProcessingLogger.logStep("cod units", processedCodUnits.length);

		// 7. Process strata (reusable!)
		ProcessingLogger.info("Processing strata...");
		const processedStrata = processStrata(rawData.strataa, {
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
		ProcessingLogger.logStep("strata", processedStrata.length);

		// 8. Process works (depends on msItems)
		ProcessingLogger.info("Processing works...");
		const processedWorks = processWorks(rawData.works, {
			people: rawData.people,
			genres: rawData.genres,
			msItemsPlus: processedMsItems,
			bibliography: rawData.bibliography,
		});
		ProcessingLogger.logStep("works", processedWorks.length);

		// 9. Process manuscripts (depends on almost everything)
		ProcessingLogger.info("Processing manuscripts...");
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
		ProcessingLogger.logStep("manuscripts", processedManuscripts.length);

		ProcessingLogger.success("All data processed successfully!");

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
	} catch (error) {
		ProcessingLogger.error("Processing failed:", error);
		throw error;
	}
}

/**
 * Save all processed data to files
 */
async function saveAllProcessedData(processedData) {
	ProcessingLogger.info("Saving processed data...");

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

	ProcessingLogger.success("All files saved successfully!");
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

		ProcessingLogger.success("Data preprocessing completed successfully!");
	} catch (error) {
		ProcessingLogger.error("Main process failed:", error);
		process.exit(1);
	}
}

// Run the script
main();
