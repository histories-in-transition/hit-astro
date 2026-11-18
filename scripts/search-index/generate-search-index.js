import { log } from "@acdh-oeaw/lib";
import { readFileSync } from "fs";
import { createTypesenseAdminClient } from "./create-typesense-admin-client.js";
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
			{ name: "authors", type: "string", facet: true, optional: true },
			{ name: "title_note", type: "string", sort: true },
			{ name: "manuscript", type: "string[]", facet: true, optional: true },
			{ name: "library", type: "string[]", facet: true, optional: true },
			{ name: "library_place", type: "string[]", facet: true, optional: true },
			{ name: "work", type: "string[]", facet: true, optional: true },
			{ name: "author", type: "string[]", facet: true, optional: true },
			{ name: "decoration", type: "string[]", facet: true, optional: true },
			{ name: "orig_date", type: "string[]", facet: true, optional: true },
			{ name: "orig_century", type: "string[]", facet: true, optional: true },
			{ name: "orig_place", type: "string[]", facet: true, optional: true },
			{ name: "provenance", type: "string[]", facet: true, optional: true },
			{ name: "hands_role_context", type: "string[]", facet: true, optional: true },
			{ name: "hands_role", type: "string[]", facet: true, optional: true },
			{ name: "hands_function", type: "string[]", facet: true, optional: true },
			{ name: "sub_genre", type: "string[]", facet: true, optional: true },
			{ name: "main_genre", type: "string[]", facet: true, optional: true },
			// get dates as separate numbers for filtering 'from -to' in the frontend
			{ name: "terminus_post_quem", type: "int32", facet: true, optional: true },
			{ name: "terminus_ante_quem", type: "int32", facet: true, optional: true },
			{ name: "form", type: "string[]", facet: true, optional: true },
			{ name: "modifications", type: "string[]", facet: true, optional: true },
			{ name: "interpolations", type: "string[]", facet: true, optional: true },
			{ name: "language", type: "string[]", facet: true, optional: true },
			{ name: "project", type: "string[]", facet: true, optional: true },
			{ name: "joined_transmission", type: "string[]", facet: true, optional: true },
		],
		metadata: {
			owners: ["Ivana Dobcheva"],
			description: "index for the HIT project, indexing all msitems",
			service_ids: [23143],
		},
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
		const origDates = value?.orig_date || [];
		const terminus_post_quem = [];
		const terminus_ante_quem = [];

		origDates.forEach((d) => {
			if (Array.isArray(d.date)) {
				d.date.forEach((dateObj) => {
					if (dateObj.not_before !== undefined) {
						terminus_post_quem.push(dateObj.not_before);
					}
					if (dateObj.not_after !== undefined) {
						terminus_ante_quem.push(dateObj.not_after);
					}
				});
			}
		});

		// Get the earliest not_before and latest not_after
		const minNotBefore =
			terminus_post_quem.length > 0 ? Math.min(...terminus_post_quem) : undefined;
		const maxNotAfter = terminus_ante_quem.length > 0 ? Math.max(...terminus_ante_quem) : undefined;
		// Keeps only real values. Removes undefined, null and empty strings.
		const clean = (arr) => (arr ?? []).filter((v) => v !== undefined && v !== null && v !== "");

		const item = {
			sort_id: value?.id,
			hit_id: value?.hit_id,
			view_label: value?.view_label,
			title: value?.title_work?.[0]?.title || "Untitled",
			authors: value?.title_work?.[0]?.author?.[0]?.name || "Unknown",
			title_note: value?.title_note || "",
			manuscript: clean(value?.manuscript?.map((ms) => ms.value)),
			library: clean(value?.library?.map((l) => l.value)),
			library_place: clean(value?.library_place?.map((lb) => lb.value)),
			work: clean(value?.title_work?.map((w) => w.title)),
			author: clean(value?.title_work?.flatMap((w) => w.author?.map((a) => a.name) ?? [])),
			decoration: clean(value?.decoration?.map((d) => d.value)),
			orig_date: clean(value?.orig_date?.flatMap((od) => od.date?.map((d) => d.value) ?? [])),
			orig_century: clean(
				value?.orig_date?.flatMap((od) => od.date?.flatMap((d) => d.century) ?? []),
			),
			orig_place: clean(value?.orig_place?.flatMap((p) => p.place?.map((pl) => pl.value) ?? [])),
			provenance: clean(
				value?.provenance?.flatMap((prov) => prov.places?.map((pl) => pl.value) ?? []),
			),
			hands_role: clean(value?.hands?.flatMap((h) => h.jobs?.flatMap((j) => j.role) ?? [])),
			hands_function: clean(value?.hands?.flatMap((h) => h.jobs?.flatMap((j) => j.function) ?? [])),
			hands_role_context: clean(
				value?.hands?.flatMap((h) => h.jobs?.flatMap((j) => j.role_context) ?? []),
			),

			terminus_post_quem: minNotBefore ?? null,
			terminus_ante_quem: maxNotAfter ?? null,
			sub_genre: value?.title_work?.[0]?.subGenre ?? [],
			main_genre: value?.title_work?.[0]?.mainGenre ?? [],
			form: value?.form?.map((f) => f.value) ?? [],
			modifications: value?.text_modification ?? [],
			interpolations: value?.interpolations?.map((i) => i.title) ?? [],
			language: value?.language ?? [],
			project: value?.project ?? [],
			joined_transmission: value?.joined_transmission?.map((tr) => tr.title) ?? [],
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
		log.success("msItems index generated successfully.");
	})
	.catch((error) => {
		log.error("Oh no! Problem with msItems index\n", String(error));
		process.exitCode = 1;
	});
