import { log } from "@acdh-oeaw/lib";
import { readFileSync } from "fs";
import { createTypesenseAdminClient } from "./create-typesense-admin-client.js";
const collectionName = "hit__strata";

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
			{ name: "label", type: "string", sort: true },
			{ name: "manuscript", type: "string[]", facet: true, optional: true },
			{ name: "work", type: "string[]", facet: true, optional: true },
			{ name: "author", type: "string[]", facet: true, optional: true },
			{ name: "character", type: "string[]", facet: true, optional: true },
			{ name: "orig_date", type: "string[]", facet: true, optional: true },
			{ name: "orig_century", type: "string[]", facet: true, optional: true },
			{ name: "orig_place", type: "string[]", facet: true, optional: true },
			// get dates as separate numbers for filtering 'from -to' in the frontend
			{ name: "terminus_post_quem", type: "int32", facet: true, optional: true },
			{ name: "terminus_ante_quem", type: "int32", facet: true, optional: true },
			{ name: "form", type: "string[]", facet: true, optional: true },
			{ name: "role", type: "string[]", facet: true, optional: true },
			{ name: "scribe_type", type: "string[]", facet: true, optional: true },
			{ name: "function", type: "string[]", facet: true, optional: true },
			{ name: "locus_layout", type: "string[]", facet: true, optional: true },
			{ name: "text_modifications", type: "string[]", facet: true, optional: true },
			{ name: "interpolations", type: "string[]", facet: true, optional: true },
			{ name: "language", type: "string[]", facet: true, optional: true },
			{ name: "project", type: "string[]", facet: true, optional: true },
		],
		metadata: {
			owners: ["Ivana Dobcheva"],
			description: "index for the HIT project, indexing all strata",
			service_ids: [23143],
		},
		default_sorting_field: "sort_id",
	};

	await client.collections().create(schema);
	log.success("Created new strata collection");
	// import data into typesense collection

	//  get data from folder data
	const data = JSON.parse(readFileSync("./src/content/data/strata.json", "utf8"));

	// transform data so it conforms to the typesense collection shape
	const records = [];
	Object.values(data).forEach((value) => {
		const origDates = value?.date || [];
		const terminus_post_quem = [];
		const terminus_ante_quem = [];

		origDates.forEach((d) => {
			if (d.not_before !== undefined) {
				terminus_post_quem.push(d.not_before);
			}
			if (d.not_after !== undefined) {
				terminus_ante_quem.push(d.not_after);
			}
		});

		// Get the earliest not_before and latest not_after
		const minNotBefore =
			terminus_post_quem.length > 0 ? Math.min(...terminus_post_quem) : undefined;
		const maxNotAfter = terminus_ante_quem.length > 0 ? Math.max(...terminus_ante_quem) : undefined;
		const clean = (arr) => (arr ?? []).filter((v) => v !== undefined && v !== null && v !== "");

		const item = {
			sort_id: value?.id,
			hit_id: value?.hit_id,
			label: value?.label,
			manuscript: clean(value?.manuscript?.map((ms) => ms.value)),

			work: clean(value?.msitems?.flatMap((item) => item.work?.map((w) => w.title))),
			author: clean(value?.msitems.flatMap((item) => item.author?.map((a) => a.name) ?? [])),
			character: value?.character || [],
			orig_date: clean(value?.date?.map((d) => d.value) ?? []),
			orig_century: clean(value?.date?.flatMap((d) => d.century) ?? []),
			orig_place: clean(value?.place?.map((p) => p.value) ?? []),
			terminus_post_quem: minNotBefore !== undefined ? minNotBefore : null,
			terminus_ante_quem: maxNotAfter !== undefined ? maxNotAfter : null,
			role: value.hand_roles.flatMap((hrole) => hrole.role || []),
			scribe_type: value.hand_roles.flatMap((hrole) => hrole.scribe_type || []),
			function: value.hand_roles.flatMap((hrole) => hrole.function || []),
			locus_layout: value.hand_roles.flatMap((hrole) => hrole.locus_layout || []),
			form: value.msitems.flatMap((item) => item.form.map((f) => f.value) || []),
			text_modifications: value.msitems.flatMap((item) => item.text_modification || []),
			interpolations: value.msitems.flatMap(
				(item) => item.interpolations.map((i) => i.title) || [],
			),
			language: value.msitems.flatMap((item) => item.language) || [],
			project: value.manuscript[0].project || [],
		};
		records.push(item);
	});

	// - import data into typesense collection
	try {
		await client.collections(collectionName).documents().import(records, { action: "create" });
		log.success("All msitems data imported for indexing");
	} catch (error) {
		// typesense-js attaches one result per document to the thrown ImportError
		const results = error.importResults ?? [];

		// results are in the same order as `records`, so the index tells us which item failed
		const failed = results
			.map((r, index) => ({ ...r, record: records[index] }))
			.filter((r) => !r.success);

		if (failed.length > 0) {
			// Count how often each error message occurs
			const errorCounts = {};
			failed.forEach((f) => {
				errorCounts[f.error] = (errorCounts[f.error] || 0) + 1;
			});
			log.error("Error counts:\n", JSON.stringify(errorCounts, null, 2));

			// Show the first 5 failed documents
			failed.slice(0, 5).forEach((f) => {
				log.error(`Failed: ${f.error}\nhit_id: ${f.record?.hit_id}`);
			});
		} else {
			// Not an import-result problem (e.g. connection or auth), so show everything
			log.error("Import failed:\n", error.stack ?? String(error));
		}

		throw error; // still reaches your outer .catch() and sets the exit code
	}
}

generate()
	.then(() => {
		log.success("Strata index generated successfully.");
	})
	.catch((error) => {
		log.error("Oh no! Problem with strata index\n", String(error));
		process.exitCode = 1;
	});
