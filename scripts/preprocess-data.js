import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
	addPrevNextToMsItems,
	enrichPlaces,
	enrichDates,
	enrichBibl,
	enrichWorks,
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadJSON = (file) =>
	JSON.parse(readFileSync(join(__dirname, "../src/content/raw", file), "utf8"));

const bibliography = Object.values(loadJSON("bibliography.json"));
const cod_units = Object.values(loadJSON("cod_units.json"));
const cod_unitsprov = Object.values(loadJSON("cod_unit_placed.json"));
const dates = Object.values(loadJSON("dates.json"));
const genres = Object.values(loadJSON("genres.json"));
const hands = Object.values(loadJSON("hands.json"));
const handsdated = Object.values(loadJSON("hands_dated.json"));
const handsplaced = Object.values(loadJSON("hands_placed.json"));
const handsrole = Object.values(loadJSON("hands_role.json"));
const libraries = Object.values(loadJSON("libraries_organisations.json"));
const manuscripts = Object.values(loadJSON("manuscripts.json"));
const manuscripts_dated = Object.values(loadJSON("manuscripts_dated.json"));
const msitems = Object.values(loadJSON("ms_items.json"));
const people = Object.values(loadJSON("people.json"));
const places = Object.values(loadJSON("places.json"));
const scribes = Object.values(loadJSON("scribes.json"));
const strataa = Object.values(loadJSON("strata.json"));
const works = Object.values(loadJSON("works.json"));

// set the output folder
const folderPath = join(process.cwd(), "src", "content", "data");
mkdirSync(folderPath, { recursive: true });

//rewrite organisations aka libraries

const librariesPlus = libraries.map((library) => {
	return {
		id: library.id,
		hit_id: library.hit_id,
		abbreviation: library.label,
		library_full: library.library_full,
		place: enrichPlaces(library.settlement, places),
		wikidata: library.wikidata,
	};
});

// Save
writeFileSync(join(folderPath, "libraries.json"), JSON.stringify(librariesPlus, null, 2), {
	encoding: "utf-8",
});

//rewrite places

const placesPlus = places.map((place) => {
	return {
		id: place.id,
		hit_id: place.hit_id,
		name: place.name,
		geonames_url: place.geonames_url,
		wikidata_url: place.wikidata_url,
		lat: place.lat ?? "",
		long: place.long ?? "",
	};
});

const updatedPlaces = addPrevNextToMsItems(placesPlus);

// Save the merged msitems in json
writeFileSync(join(folderPath, "places.json"), JSON.stringify(updatedPlaces, null, 2), {
	encoding: "utf-8",
});

// merge data for msItems

const msItemsPlus = msitems
	//filter out all entries without a manuscript, title OR title_note
	.filter((item) => item.manuscript.length > 0 && (item.title_work.length > 0 || item.title_note))
	.map((item) => {
		// get author_entry from manuscript
		const author_entry = manuscripts
			.filter((ms) => ms.id === item.manuscript[0]?.id)
			.flatMap((ms) => ms.author_entry.map((a) => a.value));
		// get library and library place for each msitem
		const library = manuscripts
			.filter((ms) => ms.id === item.manuscript[0]?.id)
			.flatMap((ms) => ms.library_full);
		const library_place = librariesPlus
			.filter((lib) => library.some((libr) => libr.id === lib.id))
			.flatMap((lib) => lib.place);

		const relatedWorks = enrichWorks(item.title_work, works, people, genres);

		// Do the same with interpolations from works.json
		const interpolations = enrichWorks(item.interpolations, works, people, genres);

		// Add related hands
		const handLabelsSet = new Set(item.hand.map((h) => h.value));
		const relatedHand = hands
			.filter(
				(hand) => hand.label.length > 0 && item.hand.some((h) => h.value === hand.label[0]?.value),
			)
			.filter((hand) => handLabelsSet.has(hand.label[0]?.value))
			.map((hand) => {
				// use map to prune unnecessary fields from each hand object
				const prunedHand = {
					id: hand.id,
					label: hand.label[0]?.value,
					hit_id: hand.hit_id,
					description: hand.description,
					similar_hands: hand.similar_hands.map(({ order, ...rest }) => rest),
					nr_daniel: hand.nr_daniel ?? "",
					note: hand.note ?? "",
					// dating: Array.from(new Set(hand.dating.flatMap((dating) => dating.value))),
					scribe: hand.scribe.map(({ order, ...rest }) => rest),
					group: hand.gruppe,
				};
				// Add realted dating of each hand from hands_dated.json

				const hand_dated = handsdated
					.filter((hDated) => hDated.hand.some((h) => h.id === hand.id))
					// use map to remove unnecessary objects
					.map((hDated) => {
						return {
							id: hDated.id,
							hit_id: hDated.hit_id,
							authority: enrichBibl(hDated.authority, bibliography),
							page: hDated.page,
							date: enrichDates(hDated.dated, dates),
						};
					});
				// Add related placement of each hand from hands_placed.json
				const hand_placed = handsplaced
					.filter((hPlaced) => hPlaced.hand.some((h) => h.id === hand.id))
					.map((hPlaced) => {
						return {
							id: hPlaced.id,
							hit_id: hPlaced.hit_id,
							place: enrichPlaces(hPlaced.place, places),
							authority: enrichBibl(hPlaced.authority, bibliography),
							page: hPlaced.page,
						};
					});
				// Add related roles for each hand from hands_role.json
				const hand_roles = handsrole
					// filter for matching hands
					.filter((hRole) => hRole.hand.some((h) => h.id === hand.id))
					// filter for matching items
					.filter((hRole) => hRole.ms_item.some((m_item) => m_item.id === item.id))
					.map((hRole) => {
						return {
							id: hRole.id,
							hit_id: hRole.hit_id,
							role: hRole.role.map(({ value }) => ({ value })),
							locus: hRole.locus,
							locus_layout: hRole.locus_layout.map(({ value }) => ({ value })),
							function: hRole.function.map(({ value }) => ({ value })),
							role_context: hRole.scribe_type.map(({ value }) => ({ value })),
						};
					});
				return {
					...prunedHand,
					dating: hand_dated,
					place: hand_placed,
					jobs: hand_roles,
				};
			});

		// get provenance based on cod_unit_placed.json
		const provenance = cod_unitsprov
			.filter((unit_pr) => unit_pr.cod_unit.length > 0)
			.filter((unit_pr) => item.cod_unit.some((c) => c.id === unit_pr.cod_unit[0].id))
			.flatMap((unit_pr) => {
				return {
					hit_id: unit_pr.hit_id,
					type: unit_pr.type.value,
					places: enrichPlaces(unit_pr.place, places),
					from: enrichDates(unit_pr.from, dates),
					till: enrichDates(unit_pr.till, dates),
					uncertain_from: unit_pr.uncertain_from,
					uncertain_till: unit_pr.uncertain_till,
					authority: enrichBibl(unit_pr.authority, bibliography),
					page: unit_pr.page ?? "",
				};
			});

		// Return the enriched msitem
		return {
			id: item.id,
			hit_id: item.hit_id,
			view_label: item.manuscript[0]?.value + ", fol. " + item.locus_grp,
			label: item.label[0]?.value,
			manuscript: item.manuscript.map(({ order, ...rest }) => rest),
			library: library,
			library_place: library_place,
			cod_unit: item.cod_unit.map(({ order, ...rest }) => rest),
			locus: item.locus_grp,
			incipit: item.incipit,
			explicit: item.explicit,
			rubric: item.rubric,
			final_rubric: item.final_rubric,
			title_work: relatedWorks.length > 0 ? relatedWorks : [{ title: item.title_note }],
			title_note: relatedWorks.length > 0 ? item.title_note : "",
			siglum: item.siglum,
			text_modification: item.text_modification.map((modification) => modification.value),
			interpolations: interpolations.length > 0 ? interpolations : [],
			bibl: item.bibl,
			commentedMsItem: item.commented_msitem.map((cItem) => {
				// Find the corresponding msitem for the commented item
				const relatedMsItem = msitems.find((ms) => ms.id === cItem.id);
				return {
					id: cItem.id,
					value: cItem.value,
					title: relatedMsItem?.title_work[0].value, // Add title if found
					hit_id: relatedMsItem?.hit_id, // Add hit_id if found
				};
			}),
			hands: relatedHand, // enriched with dating, placement and hand roles
			decoration: item.decoration.map(({ value }) => ({ value })),
			form: item.form.map(({ value }) => ({ value })),
			form_note: item.form_note ?? "",
			note: item.note ?? "",
			orig_date: [
				...relatedHand
					.filter((h) => h.jobs.some((j) => j.role.some((r) => r.value === "Schreiber")))
					.flatMap((hand) => hand.dating),
				...provenance
					.filter((prov) => prov.type === "orig")
					.map((prov) => ({
						hit_id: prov.hit_id,
						date: prov.from,
						authority: prov.authority,
						page: prov.page,
					})),
			],
			orig_place: [
				...relatedHand
					.filter((h) => h.jobs.some((j) => j.role.some((r) => r.value === "Schreiber")))
					.flatMap((hand) => hand.place),
				...provenance
					.filter((prov) => prov.type === "orig")
					.map((prov) => ({
						hit_id: prov.hit_id,
						place: prov.places,
						authority: prov.authority,
						page: prov.page,
					})),
			],
			provenance: [
				...provenance.filter((prov) => prov.type === "prov"),
				...relatedHand
					.filter((h) => h.jobs.some((j) => j.role.some((r) => r.value !== "Schreiber")))
					.flatMap((hand) =>
						hand.place.map((pl) => {
							return {
								hit_id: pl.hit_id,
								places: pl.place,
								from: hand.dating.flatMap((dating) => dating.date),
								till: [],
								authority: hand.dating.flatMap((d) => d.authority),
							};
						}),
					),
			],
			author_entry: author_entry,
		};
	});

const updatedMsItems = addPrevNextToMsItems(msItemsPlus);

// Save the merged msitems in json
writeFileSync(join(folderPath, "ms_items.json"), JSON.stringify(updatedMsItems, null, 2), {
	encoding: "utf-8",
});

// Merge data for hands
const handsPlus = hands
	.filter((hand) => hand.label.length > 0) // skip hands with empty labels
	.map((hand) => {
		// find matching dating for the hands from hands_Dated.json
		const h_dated = handsdated
			.filter((dhand) => dhand.hand.some((h) => h.id === hand.id))
			.map((dathand) => {
				return {
					hit_id: dathand.hit_id,
					authority: enrichBibl(dathand.authority, bibliography),
					page: dathand.page ?? "",
					dated: enrichDates(dathand.dated, dates),
					dating: dathand.new_dating,
					note: dathand.note ?? "",
				};
			});
		const h_placed = handsplaced
			.filter((hplaced) => hplaced.hand.some((h) => h.id === hand.id))
			.map((p_hand) => {
				return {
					hit_id: p_hand.hit_id,
					authority: enrichBibl(p_hand.authority, bibliography),
					page: p_hand.page,
					place: enrichPlaces(p_hand.place, places),
				};
			});
		const h_roles = handsrole
			.filter((hrol) => hrol.hand.some((h) => h.id === hand.id))
			.map((hand_r) => {
				const msitem = msItemsPlus
					.filter((m) => m.hands.some((han) => han.jobs.some((j) => j.hit_id === hand_r.hit_id)))
					.map((msit) => {
						return {
							hit_id: msit.hit_id,
							title_work: msit.title_work.map((t) => {
								return {
									hit_id: t.hit_id,
									title: t.title,
									author: t.author,
								};
							}),
							locus: msit.locus,
						};
					});
				let hand_qualities = "";
				if (hand_r.scribe_type.length > 0) {
					hand_qualities = `${hand_r.role.map((r) => r.value)} (${hand_r.scribe_type.map((s) => s.value)})`;
				}
				if (hand_r.scribe_type.length > 0 && hand_r.function.length > 0) {
					hand_qualities = `${hand_r.role.map((r) => r.value)} (${hand_r.scribe_type.map((s) => s.value)} — ${hand_r.function.map((f) => f.value)})`;
				} else {
					hand_qualities = hand_r.role.map((r) => r.value).join(", ");
				}

				return {
					hit_id: hand_r.hit_id,
					content: msitem,
					scope: hand_r.locus ?? "",
					role: hand_r.role.map((r) => {
						return { value: r.value };
					}),
					function: hand_r.function.map((f) => {
						return { value: f.value };
					}),
					scribe_type: hand_r.scribe_type.map((sc) => {
						return { value: sc.value };
					}),
					locus_layout: hand_r.locus_layout.map((l) => l.value),
					all_in_one: hand_qualities,
				};
			});

		return {
			id: hand.id,
			hit_id: hand.hit_id,
			label: hand.label[0].value,
			view_label: hand.label[0].value,
			description: hand.description,
			similar_hands: hand.similar_hands.map(({ order, ...rest }) => rest),
			nr_daniel: hand.nr_daniel ?? "",
			manuscript: hand.manuscript.map(({ order, ...rest }) => rest),
			note: hand.note ?? "",
			roles: [...new Set(hand.role.flatMap((r) => r.value.map((v) => v.value)))],
			scribe: hand.scribe.map(({ order, ...rest }) => rest),
			group: hand.gruppe,
			date: h_dated,
			hand_roles: h_roles,
			placed: h_placed,
			texts: [...new Set(hand.texts.map((text) => text.value))],
			author_entry: hand.author_entry.map((a) => a.value),
		};
	});

const scribesPlus = scribes.map((scribe) => {
	const scribalHands = handsPlus.filter((hand) => hand.scribe.some((s) => s.id === scribe.id));
	const date = scribalHands.flatMap((hand) => hand.date);
	const place = scribalHands.flatMap((hand) => hand.placed);
	return {
		id: scribe.id,
		hit_id: scribe.hit_id,
		name: scribe.name ?? "N/A",
		description: scribe.description ?? "N/A",
		group: scribe.group,
		hands: scribalHands.map(({ scribe, author_entry, places, dated, ...rest }) => rest),
		date: date,
		places: place,
		author_entry: scribe.author_entry.map((a) => a.value),
	};
});
const updatedScribes = addPrevNextToMsItems(scribesPlus, "hit_id", "name");

writeFileSync(join(folderPath, "scribes.json"), JSON.stringify(updatedScribes, null, 2), {
	encoding: "utf-8",
});

// enrich hands with full scribe data from scribesPlus
// match scribe data by id
// return empty array if no match / no scribe assigned to this hand
const handsWithScribe = handsPlus.map((hand) => {
	const scribe = scribesPlus.filter((sPlus) => hand.scribe.some((s) => sPlus.id === s.id)) || [];
	return { ...hand, scribe };
});

const updatedHands = addPrevNextToMsItems(handsWithScribe);

writeFileSync(join(folderPath, "hands.json"), JSON.stringify(updatedHands, null, 2), {
	encoding: "utf-8",
});

// merge data for manuscripts

const manuscriptsPlus = manuscripts
	.filter((manuscript) => manuscript.shelfmark.length > 0)
	.map((manuscript) => {
		// find and prune related dating from manuscripts_Dated.json
		const ms_dating = manuscripts_dated
			.filter((mDated) => mDated.manuscript.some((m) => m.id === manuscript.id))
			.map((mDated) => {
				return {
					date: enrichDates(mDated.date, dates),
					authority: enrichBibl(mDated.authority, bibliography),
					page: mDated.page,
					preferred_date: mDated.preferred_date,
				};
			});
		const cod_unit = cod_units
			.filter((unit) => unit.manuscript.some((m) => m.id === manuscript.id))
			.map((unit) => {
				// enrich with data from cod_unit_placed.json
				const prov_place = cod_unitsprov
					.filter((prov) => prov.cod_unit.some((c) => c.id === unit.id))
					.map((prov) => {
						return {
							places: enrichPlaces(prov.place, places),
							from: enrichDates(prov.from, dates),
							till: enrichDates(prov.till, dates),
							uncertain_from: prov.uncertain_from,
							uncertain_till: prov.uncertain_till,
							type: prov.type.value,
						};
					});
				const relevantMsItems = msItemsPlus
					// get the msitems which belong to this unit
					.filter((item) => item.cod_unit?.some((u) => u.id === unit.id))
					// clean up unnecessary fields by map and return the prune rest
					.map(
						({
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
						}) => rest,
					);

				return {
					id: unit.id,
					hit_id: unit.hit_id,
					value: unit.label[0].value,
					number: unit.number,
					notes: unit.notes,
					locus: unit.locus,
					material: unit.material?.value ?? "",
					material_spec: unit.material_spec ?? "",
					catchwords: unit.catchwords ?? "",
					quiremarks: unit.quiremarks ?? "",
					heigth: unit.heigth ?? "",
					width: unit.width ?? "",
					written_height: unit.written_height ?? "",
					written_width: unit.written_width ?? "",
					columns: unit.columns.map((c) => c.value) ?? "",
					lines_number: unit.lines_number ?? "",
					ruling: unit.ruling ?? "",
					decoration: unit.decorations ?? "",
					basic_structure: unit.basic_structure.map((str) => str.value),
					notes: unit.notes ?? "",
					prov_place: prov_place,
					content: relevantMsItems,
				};
			});

		const strata = strataa
			// get strata for specific manuscript based on ms_id
			.filter((stratum) => stratum.manuscript.some((ms) => ms.id === manuscript.id))
			.map((stratum) => {
				// get corresponding hand_roles data from hands_role.json
				const h_roles = handsrole
					.filter((h_role) => stratum.hand_role.some((s_h_role) => s_h_role.id === h_role.id))
					.map((h_role) => {
						const hand = hands
							.filter((hand) => h_role.hand.some((hand_r) => hand_r.id === hand.id))
							.map((hand) => {
								// enrich hands with data from hands_Dated.json
								const dhand = handsdated
									// filter hands_dated.json for hands (hand => hand.id)
									.filter((hand_d) => hand_d.hand.some((h) => hand.id === h.id))
									.flatMap((dhand) => enrichDates(dhand.dated, dates));
								return {
									hit_id: hand.hit_id,
									label: hand.label[0].value,
									date: dhand,
								};
							});
						const mssitems = msItemsPlus
							.filter((mitem) => h_role.ms_item.some((item) => item.id === mitem.id))
							.map((item) => {
								return {
									id: item.id,
									hit_id: item.hit_id,
									title: item.title_work.map((t) => t.title),
									author: item.title_work.flatMap((t) => t.author?.map((a) => a.name) || []),
									locus: item.locus,
								};
							});
						return {
							hit_id: h_role.hit_id,
							hand: hand,
							ms_item: mssitems,
							role: h_role.role.map((r) => r.value),
							locus: h_role.locus,
							scribe_type: h_role.scribe_type.map((type) => type.value),
							function: h_role.function.map((func) => func.value),
							locus_layout: h_role.locus_layout.map((layout) => layout.value),
						};
					});
				return {
					id: stratum.id,
					number: stratum.number,
					hit_id: stratum.hit_id,
					label: stratum.label[0].value,
					character: stratum.character.map((c) => c.value),
					hand_roles: h_roles,
					note: stratum.note ?? "",
				};
			});
		// some hand_roles are not yet assigned to a stratum, need to collect them in a separate 'TBD' stratum
		const uncharted_roles = handsrole
			.filter((h_role) =>
				msItemsPlus.some(
					(item) =>
						item.manuscript.some((ms) => ms.id === manuscript.id) &&
						item.hands.some((hand) => hand.jobs.some((j) => j.id === h_role.id)),
				),
			)
			.filter((h_role) => !strataa.some((str) => str.hand_role.some((r) => r.id === h_role.id)))
			.map((h_role) => {
				// Enrich hands with data from hands_Dated.json
				const hand = hands
					.filter((hand) => h_role.hand.some((hand_r) => hand_r.id === hand.id))
					.map((hand) => {
						// enrich hands with data from hands_Dated.json
						const dhand = handsdated
							// filter hands_dated.json for hands (hand => hand.id)
							.filter((hand_d) => hand_d.hand.some((h) => hand.id === h.id))
							.flatMap((dhand) => enrichDates(dhand.dated, dates));
						return {
							hit_id: hand.hit_id,
							label: hand.label[0].value,
							date: dhand,
						};
					});

				// Enrich ms_items
				const mssitems = msItemsPlus
					.filter((mitem) => h_role.ms_item.some((item) => item.id === mitem.id))
					.map((item) => ({
						id: item.id,
						hit_id: item.hit_id,
						title: item.title_work.map((t) => t.title),
						author: item.title_work.flatMap((t) => t.author?.map((a) => a.name) || []),
						locus: item.locus,
					}));

				return {
					hit_id: h_role.hit_id,
					hand: hand,
					ms_item: mssitems,
					role: h_role.role.map((r) => r.value),
					locus: h_role.locus,
					scribe_type: h_role.scribe_type.map((type) => type.value),
					function: h_role.function.map((func) => func.value),
					locus_layout: h_role.locus_layout.map((layout) => layout.value),
				};
			});
		uncharted_roles.length > 0 &&
			strata.push({
				id: "TBD",
				number: "TBD",
				label: "undefined stratum",
				character: ["TBD"],
				hand_roles: uncharted_roles,
				note: "These hand-roles are not yet assigned to a stratum",
			});

		const library = libraries
			.filter((lib) => manuscript.library.some((l) => l.id === lib.id))
			.map((library) => {
				return {
					id: library.id,
					hit_id: library.hit_id,
					abbreviation: manuscript.library[0].value,
					library_full: manuscript.library_full[0].value,
					place: enrichPlaces(library.settlement, places),
				};
			});

		const relevantHands = handsWithScribe
			.filter((hand) => hand.manuscript[0].id === manuscript.id)
			.map((hand) => {
				return {
					hit_id: hand.hit_id,
					label: hand.label,
					description: hand.description,
					similar_hands: hand.similar_hands,
					nr_daniel: hand.nr_daniel,
					note: hand.note,
					scribe: hand.scribe,
					group: hand.group,
					date: hand.date,
					hand_roles: hand.hand_roles,
					placed: hand.placed,
				};
			});
		const provenance = librariesPlus.filter((lib) =>
			manuscript.provenance.some((prov) => prov.id === lib.id),
		);
		return {
			id: manuscript.id,
			hit_id: manuscript.hit_id,
			shelfmark: manuscript.shelfmark[0].value.split(",")[1].trim(),
			library: library,
			title: manuscript.title ?? "",
			manuscripta_url: manuscript.manuscripta_url,
			handschriftenportal_url: manuscript.handschriftenportal_url,
			catalog_url: manuscript.catalog_url,
			digi_url: manuscript.digi_url,
			idno_former: manuscript.idno_former ?? "",
			quire_structure: manuscript.quire_structure,
			extent: manuscript.extent ?? "",
			foliation: manuscript.foliation ?? "",
			acc_mat: manuscript.acc_mat ?? "",
			binding: manuscript.binding ?? "",
			binding_date: enrichDates(manuscript.binding_date, dates),
			bibliography: enrichBibl(manuscript.bibliography, bibliography),
			height: manuscript.height ?? "",
			width: manuscript.width ?? "",
			material: [...new Set(cod_unit.map((unit) => unit.material))] ?? "",
			history: manuscript.history,
			orig_place: enrichPlaces(manuscript.orig_place, places),

			provenance: provenance,
			orig_date: ms_dating,
			content_summary: manuscript.content_summary ?? "",
			content: msItemsPlus
				// get the msitems not belonging to any cod. unit
				.filter(
					(item) =>
						item.manuscript.some((ms) => ms.id === manuscript.id) && item.cod_unit.length == 0,
				)
				// clean up unnecessary fields by map and return the prune rest
				.map(
					({
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
					}) => rest,
				),
			charakter: manuscript.charakter.map((char) => char.value),
			case_study: manuscript.case_study.map((c) => c.value),
			status: manuscript.status?.map((s) => s.value) ?? [],
			hands: relevantHands || [],
			cod_units: cod_unit,
			strata: strata,
			author_entry: manuscript.author_entry.map((a) => a.value),
		};
	});

const updatedManuscripts = addPrevNextToMsItems(manuscriptsPlus, "hit_id", "shelfmark");

// Save the merged json
writeFileSync(join(folderPath, "manuscripts.json"), JSON.stringify(updatedManuscripts, null, 2), {
	encoding: "utf-8",
});

// merge data for works objects enriched with manuscript transmission, dates etc.
const worksPlus = works.map((work) => {
	const relatedAuthors = work.author
		?.flatMap((wAuthor) => {
			// Find the corresponding author from the people list
			const author = people
				.filter((person) => person.id === wAuthor.id)
				// Return the author with only the necessary properties
				.map((person) => {
					return {
						id: person.id,
						hit_id: person.hit_id,
						name: person.name,
						gnd_url: person.gnd_url,
					};
				});

			return author.length > 0 ? author : null; // returns valid authors or null
		})
		.filter((author) => author !== null); // remove null authors
	const relatedMsitems = msItemsPlus
		.filter((msi) => msi.title_work.some((w) => w.id === work.id))
		.map((msi) => {
			return {
				hit_id: msi.hit_id,
				manuscript: msi.manuscript,
				role: msi.role,
				function: msi.function,
				commented_msitem: msi.commentedMsItem,
				locus: msi.locus,
				orig_date: msi.orig_date,
				orig_place: msi.orig_place,
				provenance: msi.provenance,
				decoration: msi.decoration,
				annotation_date: msi.hands
					.filter((h) => !h.jobs.some((j) => j.role.includes("Schreiber")))
					.flatMap((hand) => hand.dating),
				annotation_place: msi.hands
					.filter((h) => !h.jobs.some((j) => j.role.includes("Schreiber")))
					.flatMap((hand) => hand.place),
				annotation_typ: [
					...new Set(
						msi.hands
							.filter((h) => !h.jobs.some((j) => j.role.includes("Schreiber")))
							.flatMap((hand) => hand.jobs.map((j) => j.role).flat()), // Ensure full flattening
					),
				],
			};
		});
	const relatedGenres = genres
		.filter((genre) => work.genre.some((g) => g.id === genre.id))
		.map((genre) => {
			return {
				value: `${genre.main_genre || "Varia"} > ${genre.sub_genre}`,
				sub_genre: genre.sub_genre,
				main_genre: genre.main_genre || "Varia",
			};
		});
	const relatedSourceTexts = works
		.filter((w) => work.source_text.some((st) => st.id === w.id))
		.map((source_w) => {
			return {
				title: source_w.title,
				author: source_w.author.map((aut) => aut.value).join("; "),
				hit_id: source_w.hit_id,
			};
		});
	return {
		id: work.id,
		hit_id: work.hit_id,
		title: work.title,
		gnd_url: work.gnd_url,
		note: work.note ?? "",
		author: relatedAuthors,
		bibliography: enrichBibl(work.bibliography, bibliography),
		source_text: relatedSourceTexts,
		note_source: work.note_source ?? "",
		genre: relatedGenres,
		ms_transmission: relatedMsitems,
	};
});

const updatedWorks = addPrevNextToMsItems(worksPlus, "hit_id", "title");

writeFileSync(join(folderPath, "works.json"), JSON.stringify(updatedWorks, null, 2), {
	encoding: "utf-8",
});

console.log("JSON files have been merged and cleaned successfully!");
