import { log } from "@acdh-oeaw/lib";
import { readFileSync } from "fs";
import { createTypesenseAdminClient } from "../scripts/create-typesense-admin-client.js";
const collectionName = "hit__msitems";

async function generate() {
	// instantiate typesense client using helpers function
	const client = createTypesenseAdminClient();

	// check if the collection exist if so delete and write anew

	try {
		// Check if the collection exists
		const collections = await client.collections().retrieve();
		const collectionExists = collections.some((collection) => collection.name === collectionName);

		if (collectionExists) {
			// If the collection exists, delete it
			await client.collections(collectionName).delete();
			log.success(`Deleted the existing collection: ${collectionName}`);
		}
	} catch (error) {
		log.error("Error while checking or deleting collection:\n", String(error));
	}

	// create collection
	const schema = {
		name: collectionName,
		enable_nested_fields: true,
		fields: [
			{ name: "sort_id", type: "int32", sort: true },
			{ name: "hit_id", type: "string", sort: true },
			{ name: "view_label", type: "string", sort: true },
			{ name: "title", type: "string", sort: true },
			{ name: "title_note", type: "string", sort: true },
			{ name: "manuscript", type: "object[]", facet: true, optional: true },
			{ name: "library", type: "object[]", facet: true, optional: true },
			{ name: "library_place", type: "object[]", facet: true, optional: true },
			{ name: "work", type: "object[]", facet: true, optional: true },
			{ name: "decoration", type: "object[]", facet: true, optional: true },
			{ name: "orig_date", type: "object[]", facet: true, optional: true },
			{ name: "orig_place", type: "object[]", facet: true, optional: true },
			{ name: "provenance", type: "object[]", facet: true, optional: true },
			{ name: "hands", type: "object[]", facet: true, optional: true },
		],
		default_sorting_field: "sort_id",
	};

	await client.collections().create(schema);
	log.success("Created new collection");
	// import data into typesense collection

	//  get data from folder data
	const data = JSON.parse(readFileSync("./src/content/data/ms_items.json", "utf8"));

	// transform data so it conforms to the typesense collection shape
	const records = [];
	Object.values(data).forEach((value) => {
		const item = {
			sort_id: value?.id,
			hit_id: value?.hit_id,
			view_label: value?.view_label,
			title: value?.title_work?.[0]?.title || "Untitled",
			title_note: value?.title_note || "",
			manuscript: value?.manuscript || [],
			library: value?.library || [],
			library_place: value?.library_place || [],
			work: value?.title_work || [],
			decoration: value?.decoration || [],
			orig_date: value?.orig_date || [],
			orig_place: value?.orig_place || [],
			provenance: value?.provenance || [],
			hands: value?.hands || [],
		};
		records.push(item);
	});
	// - import data into typesense collection

	try {
		const results = await client.collections(collectionName).documents().import(records);
		console.log("Import results:", records.length);
	} catch (error) {
		console.error("Import error details:", JSON.stringify(error.importResults, null, 2));
	}
}

generate()
	.then(() => {
		log.success("All good.");
	})
	.catch((error) => {
		log.error("Oh no!\n", String(error));
		process.exitCode = 1;
	});
