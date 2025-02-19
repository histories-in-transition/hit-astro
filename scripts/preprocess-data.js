import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { addPrevNextToMsItems } from "./utils.js";

import msitemsjson from "../src/content/raw/ms_items.json" assert { type: "json" };
import handsjson from "../src/content/raw/hands.json" assert { type: "json" };
import handsdatedjson from "../src/content/raw/hands_dated.json" assert { type: "json" };
import handsrolejson from "../src/content/raw/hands_role.json" assert { type: "json" };
import handsplacedjson from "../src/content/raw/hands_placed.json" assert { type: "json" };
import worksjson from "../src/content/raw/works.json" assert { type: "json" };
import peoplejson from "../src/content/raw/people.json" assert { type: "json" };
import datesjson from "../src/content/raw/dates.json" assert { type: "json" };
import placesjson from "../src/content/raw/places.json" assert { type: "json" };
import stratajson from "../src/content/raw/strata.json" assert { type: "json" };
import manuscriptsjson from "../src/content/raw/manuscripts.json" assert { type: "json" };
import manuscripts_Datedjson from "../src/content/raw/manuscripts_dated.json" assert { type: "json" };
import cod_unitsjson from "../src/content/raw/cod_units.json" assert { type: "json" };
import cod_unitsprovjson from "../src/content/raw/cod_unit_placed.json" assert { type: "json" };
import bibljson from "../src/content/raw/bibliography.json" assert { type: "json" };
import genrejson from "../src/content/raw/genres.json" assert { type: "json" };

// convert json to array:
const msitems = Object.values(msitemsjson);
const works = Object.values(worksjson);
const hands = Object.values(handsjson);
const handsdated = Object.values(handsdatedjson);
const handsrole = Object.values(handsrolejson);
const people = Object.values(peoplejson);
const handsplaced = Object.values(handsplacedjson);
const dates = Object.values(datesjson);
const places = Object.values(placesjson);
const manuscripts = Object.values(manuscriptsjson);
const manuscripts_dated = Object.values(manuscripts_Datedjson);
const cod_units = Object.values(cod_unitsjson);
const cod_unitsprov = Object.values(cod_unitsprovjson);
const strataa = Object.values(stratajson);
const bibliography = Object.values(bibljson);
const genres = Object.values(genrejson);

// set the output folder
const folderPath = join(process.cwd(), "src", "content", "data");
mkdirSync(folderPath, { recursive: true });

// functions to enrich data

function enrichPlaces(placeArray, places) {
	return placeArray.map((place) => {
		// Find matching place in places.json
		const place_geo = places.find((p) => p.id === place.id) || {};
		return {
			id: place.id,
			value: place.value,
			geonames_url: place_geo.geonames_url ?? "",
			hit_id: place_geo.hit_id ?? "",
		};
	});
}

function enrichDates(dateArray, dates) {
	return dateArray.map((date) => {
		// Find matching date in dates.json
		const dateRange = dates.find((d) => d.id === date.id);

		if (!dateRange) {
			// Return default structure if no match is found
			return {
				id: date.id,
				value: date.value,
				range: "",
				not_before: "",
				not_after: "",
			};
		}

		const not_before = dateRange.not_before?.substring(0, 4) ?? "";
		const not_after = dateRange.not_after?.substring(0, 4) ?? "";

		return {
			id: date.id,
			value: date.value,
			range: `${not_before}-${not_after}`,
			not_before,
			not_after,
		};
	});
}

function enrichBibl(biblArray, bibliography) {
	return biblArray.map((bibl) => {
		// find matching bibl entreis in bibl_entries.json
		const bibl_entries = bibliography.find((bibl_entry) => bibl_entry.id === bibl.id);
		return {
			citation: bibl_entries.citation ?? "",
			link: bibl_entries.link ?? "",
			author: bibl_entries.author ?? "",
			title: bibl_entries.title ?? "",
		};
	});
}

// merge data for msItems

const msItemsPlus = msitems.map((item) => {
	// Add info to related works
	const relatedWorks = works
		.map((work) => {
			// Check if the msitem has any related works
			if (item.title_work.some((title) => title.id === work.id)) {
				// Find authors related to the work
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

				// Return the work with its related authors
				return {
					id: work.id,
					hit_id: work.hit_id,
					title: work.title,
					author: relatedAuthors,
					gnd_url: work.gnd_url,
					note: work.note ?? "",
					bibliography: work.bibliography,
					source_text: work.source_text,
					genre: work.genre.map((genre) => genre.value),
					note_source: work.note_source ?? "",
				};
			}
			return null; // Return null if no related works are found
		})
		.filter((work) => work !== null); // Remove null works

	// Add related hands
	const relatedHand = hands
		// Filter for matching hands
		.filter((hand) => item.hand.some((h) => h.value === hand.label[0]?.value))
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
						role: hRole.role.map((role) => role.value),
						locus: hRole.locus,
						locus_layout: hRole.locus_layout.flatMap((layout) => layout.value),
						function: hRole.function.flatMap((func) => func.value),
						role_context: hRole.scribe_type.flatMap((context) => context.value),
					};
				});
			return {
				...prunedHand,
				dating: hand_dated,
				place: hand_placed,
				jobs: hand_roles,
			};
		});
	// Return the enriched msitem
	return {
		id: item.id,
		hit_id: item.hit_id,
		view_label: item.manuscript[0]?.value + ", fol. " + item.locus_grp,
		label: item.label[0]?.value,
		manuscript: item.manuscript.map(({ order, ...rest }) => rest),
		cod_unit: item.cod_unit.map(({ order, ...rest }) => rest),
		locus: item.locus_grp,
		incipit: item.incipit,
		explicit: item.explicit,
		rubric: item.rubric,
		final_rubric: item.final_rubric,
		title_work: relatedWorks, // Enriched with related authors
		title_note: item.title_note,
		siglum: item.siglum,
		bibl: item.bibl,
		role: item.role?.value,
		function: item.function_role.map((func) => func.value),
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
		decoration: item.decoration.map((deco) => deco.value),
		note: item.note ?? "",
		orig_date: relatedHand
			.filter((h) => h.jobs.some((j) => j.role.includes("Schreiber")))
			.flatMap((hand) => hand.dating),
		orig_place: relatedHand
			.filter((h) => h.jobs.some((j) => j.role.includes("Schreiber")))
			.flatMap((hand) => hand.place),
	};
});

const updatedMsItems = addPrevNextToMsItems(msItemsPlus);

// Save the merged msitems in json
writeFileSync(join(folderPath, "neu_ms_items.json"), JSON.stringify(updatedMsItems, null, 2), {
	encoding: "utf-8",
});

// merge data for manuscripts

const manuscriptsPlus = manuscripts.map((manuscript) => {
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
						place: enrichPlaces(prov.place, places),
						from: prov.from,
						till: prov.till,
						uncertain_from: prov.uncertain_from,
						uncertain_till: prov.uncertain_till,
						type: prov.type.map((t) => t.value).join(", "),
					};
				});
			return {
				id: unit.id,
				hit_id: unit.hit_id,
				value: unit.label[0].value,
				notes: unit.notes,
				locus: unit.locus,
				quires_number: unit.quires_number ?? "",
				heigth: unit.heigth ?? "",
				width: unit.width ?? "",
				written_hight: unit.written_height ?? "",
				written_width: unit.written_width ?? "",
				columns: unit.columns ?? "",
				lines_number: unit.lines_number ?? "",
				decoration: unit.decorations ?? "",
				codicological_reworking: unit.codicological_reworking.map((re) => re.value),
				basic_Structure: unit.basic_structure.map((str) => str.value),

				prov_place: prov_place,
				content: msItemsPlus
					// get the msitems which belong to this unit
					.filter((item) => item.cod_unit?.some((u) => u.id === unit.id))
					// clean up unnecessary fields by map and return the prune rest
					.map(({ manuscript, cod_unit, hands, view_label, ...rest }) => rest),
			};
		});

	const strata = strataa
		.filter((stratum) => stratum.manuscript.some((ms) => ms.id === manuscript.id))
		.map((stratum) => {
			// get corresponding hand_roles data from hands_role.json
			const h_roles = handsrole
				.filter((h_role) => stratum.hand_role.some((s_h_role) => s_h_role.id === h_role.id))
				.map((h_role) => {
					// enrich hands with data from hands_Dated.json
					const hand = handsdated
						.filter((hand) => h_role.hand.some((rol_hand) => rol_hand.id === hand.id))
						.map((hand) => {
							return {
								id: hand.id,
								hit_id: hand.hit_id,
								date: enrichDates(hand.dated, dates),
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
								locus: item.locus_grp,
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
				hit_id: stratum.hit_id,
				label: stratum.label[0].value,
				character: stratum.character.map((c) => c.value),
				hand_roles: h_roles,
			};
		});
	return {
		id: manuscript.id,
		hit_id: manuscript.hit_id,
		shelfmark: manuscript.shelfmark[0].value,
		library: manuscript.library[0].value,
		library_full: manuscript.library_full[0].value,
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
		binding_date: manuscript.binding_date.map((date) => {
			return {
				id: date.id,
				value: date.value,
			};
		}),
		bibliography: manuscript.bibliography,
		height: manuscript.height ?? "",
		width: manuscript.width ?? "",
		material: manuscript.material?.value,
		material_spec: manuscript.material_spec,
		catchwords: manuscript.catchwords ?? "",
		quiremarks: manuscript.quiremarks ?? "",
		history: manuscript.history,
		orig_place: enrichPlaces(manuscript.orig_place, places),

		provenance: enrichPlaces(manuscript.provenance, places),
		orig_date: ms_dating,
		content_summary: manuscript.content_summary ?? "",

		charakter: manuscript.charakter.map((char) => char.value),
		case_study: manuscript.case_study.map((c) => c.value),
		status: manuscript.status.map((s) => s.value),
		cod_units: cod_unit,
		strata: strata,
	};
});

const updatedManuscripts = addPrevNextToMsItems(manuscriptsPlus, "hit_id", "shelfmark");

// Save the merged json
writeFileSync(
	join(folderPath, "neu_manuscripts.json"),
	JSON.stringify(updatedManuscripts, null, 2),
	{
		encoding: "utf-8",
	},
);

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
					new_dating: dathand.new_dating,
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
							manuscript: msit.manuscript,
							title_work: msit.title_work.map((t) => {
								return {
									hit_id: t.hit_id,
									title: t.title,
									author: t.author.map((a) => a.name).join("; "),
								};
							}),
							locus: msit.locus,
						};
					});
				return {
					hit_id: hand_r.hit_id,
					ms_item: msitem,
					locus: hand_r.locus ?? "",
					function: hand_r.function.map((f) => f.value),
					scribe_type: hand_r.scribe_type.map((sc) => sc.value),
					locus_layout: hand_r.locus_layout.map((l) => l.value),
				};
			});

		return {
			id: hand.id,
			hit_id: hand.hit_id,
			label: hand.label[0].value,
			view_label: hand.label[0].value,
			description: hand.description,
			similar_hands: hand.similar_hands.map(({ order, ...rest }) => rest),
			nr_danie: hand.nr_daniel ?? "",
			manuscript: hand.manuscript.map(({ order, ...rest }) => rest),
			note: hand.note ?? "",
			roles: [...new Set(hand.role.flatMap((r) => r.value.map((v) => v.value)))],
			scribe: hand.scribe.map(({ order, ...rest }) => rest),
			group: hand.gruppe,
			date: h_dated,
			hand_roles: h_roles,
			placed: h_placed,
		};
	});

const updatedHands = addPrevNextToMsItems(handsPlus);

writeFileSync(join(folderPath, "new_hands.json"), JSON.stringify(updatedHands, null, 2), {
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
				decoration: msi.decoration,
				annotation_date: msi.hands
					.filter((h) => !h.jobs.some((j) => j.role.includes("Schreiber")))
					.flatMap((hand) => hand.dating),
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
				value: genre.genre,
				main_genre: genre.main_genre.map((mg) => mg.value),
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

writeFileSync(join(folderPath, "new_works.json"), JSON.stringify(updatedWorks, null, 2), {
	encoding: "utf-8",
});
console.log("JSON files have been merged and cleaned successfully!");
