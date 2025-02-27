// json-to-tei.js
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { js2xml } from "xml-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { json } from "stream/consumers";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct the absolute path to your JSON file
const jsonPath = join(__dirname, "..", "content", "data", "ms-sample.json");

// Read the JSON file
const jsonData = JSON.parse(readFileSync(jsonPath, "utf8"));

// console.log("JSON data:", jsonData);

// Function to create TEI XML structure
function createTEIXML(manuscripts) {
	const teiDoc = {
		declaration: { attributes: { version: "1.0", encoding: "UTF-8" } },
		elements: [
			{
				type: "element",
				name: "TEI",
				attributes: {
					xmlns: "http://www.tei-c.org/ns/1.0",
					"xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
					"xsi:schemaLocation":
						"http://www.tei-c.org/ns/1.0 https://www.tei-c.org/release/xml/tei/custom/schema/xsd/tei_all.xsd",
				},
				elements: manuscripts.map((ms) => ({
					type: "element",
					name: "msDesc",
					elements: [
						{ type: "element", name: "id", elements: [{ type: "text", text: ms.id.toString() }] },
						{
							type: "element",
							name: "shelfmark",
							elements: [{ type: "text", text: ms.shelfmark }],
						},
						{ type: "element", name: "library", elements: [{ type: "text", text: ms.library }] },
						{
							type: "element",
							name: "library_full",
							elements: [{ type: "text", text: ms.library_full }],
						},
						createTeiHeader(ms),
						createTeiText(ms),
					],
				})),
			},
		],
	};

	return teiDoc;
}

// Create the TEI Header
function createTeiHeader() {
	return {
		type: "element",
		name: "teiHeader",
		elements: [
			{
				type: "element",
				name: "fileDesc",
				elements: [
					{
						type: "element",
						name: "titleStmt",
						elements: [
							{
								type: "element",
								name: "title",
								elements: [{ type: "text", text: "Manuscript Descriptions" }],
							},
						],
					},
					{
						type: "element",
						name: "publicationStmt",
						elements: [
							{
								type: "element",
								name: "p",
								elements: [{ type: "text", text: "Generated from JSON manuscript database" }],
							},
						],
					},
					{
						type: "element",
						name: "sourceDesc",
						elements: [
							{
								type: "element",
								name: "p",
								elements: [{ type: "text", text: "Converted from manuscript database" }],
							},
						],
					},
				],
			},
		],
	};
}

/// Create the TEI Text element with msDesc elements
function createTeiText(manuscript) {
	return {
		type: "element",
		name: "text",
		elements: [
			{
				type: "element",
				name: "body",
				elements: [createMsDesc(manuscript)], // Ensure it's wrapped in an array
			},
		],
	};
}

// Create the msDesc element for a manuscript
function createMsDesc(manuscript) {
	return {
		type: "element",
		name: "msDesc",
		attributes: {
			"xml:id": `ms_${manuscript.id}`,
		},
		elements: [
			createMsIdentifier(manuscript),
			createMsContents(manuscript),
			createPhysDesc(manuscript),
			createHistory(manuscript),
			createAdditional(manuscript),
		].filter(Boolean), // Remove undefined/null elements
	};
}

// Create the msIdentifier element
function createMsIdentifier(manuscript) {
	const elements = [
		{
			type: "element",
			name: "settlement",
			elements: [],
		},
		{
			type: "element",
			name: "repository",
			elements: [{ type: "text", text: manuscript.library_full || manuscript.library }],
		},
		{
			type: "element",
			name: "idno",
			elements: [{ type: "text", text: manuscript.shelfmark }],
		},
	];

	// Add settlement if available
	if (
		manuscript.library_place &&
		manuscript.library_place.length > 0 &&
		manuscript.library_place[0].place &&
		manuscript.library_place[0].place.length > 0
	) {
		elements[0].elements.push({
			type: "text",
			text: manuscript.library_place[0].place[0].value,
		});
	}

	// Add former shelfmark if available
	if (manuscript.idno_former) {
		elements.push({
			type: "element",
			name: "altIdentifier",
			attributes: { type: "former" },
			elements: [
				{
					type: "element",
					name: "idno",
					elements: [{ type: "text", text: manuscript.idno_former }],
				},
			],
		});
	}

	return {
		type: "element",
		name: "msIdentifier",
		elements: elements,
	};
}

// Create the msContents element
function createMsContents(manuscript) {
	const elements = [];

	// Add summary if available
	if (manuscript.content_summary) {
		elements.push({
			type: "element",
			name: "summary",
			elements: [{ type: "text", text: manuscript.content_summary }],
		});
	}

	return {
		type: "element",
		name: "msContents",
		elements: elements,
	};
}

// Create the physDesc element
function createPhysDesc(manuscript) {
	const elements = [createObjectDesc(manuscript)];

	// Add bindingDesc if available
	if (manuscript.binding) {
		const bindingElements = [
			{
				type: "element",
				name: "p",
				elements: [{ type: "text", text: manuscript.binding }],
			},
		];

		// Add binding date if available
		if (manuscript.binding_date && manuscript.binding_date.length > 0) {
			bindingElements.push({
				type: "element",
				name: "date",
				elements: [{ type: "text", text: manuscript.binding_date[0].value }],
			});
		}

		elements.push({
			type: "element",
			name: "bindingDesc",
			elements: [
				{
					type: "element",
					name: "binding",
					elements: bindingElements,
				},
			],
		});
	}

	// Add accMat if available
	if (manuscript.acc_mat) {
		elements.push({
			type: "element",
			name: "accMat",
			elements: [{ type: "text", text: manuscript.acc_mat }],
		});
	}

	return {
		type: "element",
		name: "physDesc",
		elements: elements,
	};
}

// Create the objectDesc element
function createObjectDesc(manuscript) {
	const supportDescElements = [];

	// Add material with German translation
	if (manuscript.material) {
		let materialText = manuscript.material;
		if (manuscript.material === "parchment") {
			materialText = "Pergament";
		} else if (manuscript.material === "paper") {
			materialText = "Papier";
		} else if (manuscript.material === "mixed") {
			materialText = "Mischung";
		}

		supportDescElements.push({
			type: "element",
			name: "p",
			elements: [{ type: "text", text: materialText }],
		});
	}

	// Add material specification
	if (manuscript.material_spec) {
		supportDescElements.push({
			type: "element",
			name: "p",
			elements: [{ type: "text", text: manuscript.material_spec }],
		});
	}

	// Add extent
	if (manuscript.extent) {
		supportDescElements.push({
			type: "element",
			name: "extent",
			elements: [
				{
					type: "element",
					name: "measure",
					attributes: { unit: "folios", quantity: manuscript.extent },
					elements: [{ type: "text", text: `${manuscript.extent} folios` }],
				},
			],
		});

		// Add dimensions if available
		if (manuscript.height && manuscript.width) {
			supportDescElements[supportDescElements.length - 1].elements.push({
				type: "element",
				name: "dimensions",
				attributes: { unit: "mm" },
				elements: [
					{
						type: "element",
						name: "height",
						elements: [{ type: "text", text: manuscript.height }],
					},
					{
						type: "element",
						name: "width",
						elements: [{ type: "text", text: manuscript.width }],
					},
				],
			});
		}
	}

	const elements = [
		{
			type: "element",
			name: "supportDesc",
			attributes: manuscript.material ? { material: manuscript.material } : {},
			elements: supportDescElements,
		},
	];

	// Add foliation
	if (manuscript.foliation) {
		elements.push({
			type: "element",
			name: "foliation",
			elements: [{ type: "text", text: manuscript.foliation }],
		});
	}

	// Add collation
	if (manuscript.quire_structure || manuscript.catchwords || manuscript.quiremarks) {
		const collationElements = [];

		if (manuscript.quire_structure) {
			collationElements.push({
				type: "element",
				name: "formula",
				elements: [{ type: "text", text: manuscript.quire_structure }],
			});
		}

		if (manuscript.catchwords) {
			collationElements.push({
				type: "element",
				name: "catchwords",
				elements: [{ type: "text", text: manuscript.catchwords }],
			});
		}

		if (manuscript.quiremarks) {
			collationElements.push({
				type: "element",
				name: "signatures",
				elements: [{ type: "text", text: manuscript.quiremarks }],
			});
		}

		elements.push({
			type: "element",
			name: "collation",
			elements: collationElements,
		});
	}

	return {
		type: "element",
		name: "objectDesc",
		elements: elements,
	};
}

// Create the history element
function createHistory(manuscript) {
	const elements = [];

	// Add general history
	if (manuscript.history) {
		elements.push({
			type: "element",
			name: "summary",
			elements: [{ type: "text", text: manuscript.history }],
		});
	}
	// Add origin if available
	if (
		(manuscript.orig_place && manuscript.orig_place.length > 0) ||
		(manuscript.orig_date && manuscript.orig_date.length > 0)
	) {
		const originElements = [];

		// Add place of origin
		if (manuscript.orig_place && manuscript.orig_place.length > 0) {
			manuscript.orig_place.forEach((place) => {
				originElements.push({
					type: "element",
					name: "placeName",
					elements: [{ type: "text", text: place.value }],
				});
			});
		}

		// Add date of origin
		if (manuscript.orig_date && manuscript.orig_date.length > 0) {
			manuscript.orig_date.forEach((dateObj) => {
				if (dateObj.date && dateObj.date.length > 0) {
					const date = dateObj.date[0];
					originElements.push({
						type: "element",
						name: "date",
						attributes: {
							...(date.not_before ? { notBefore: date.not_before } : {}),
							...(date.not_after ? { notAfter: date.not_after } : {}),
						},
						elements: [{ type: "text", text: date.value }],
					});
				}
			});
		}

		elements.push({
			type: "element",
			name: "origin",
			elements: originElements,
		});
	}

	// Process provenance places with dates
	if (manuscript.prov_place && manuscript.prov_place.length > 0) {
		manuscript.prov_place.forEach((provPlace) => {
			if (provPlace.type === "orig") {
				// For origin type, add to origin element
				const originElements = [];

				if (provPlace.place && provPlace.place.length > 0) {
					provPlace.place.forEach((place) => {
						originElements.push({
							type: "element",
							name: "placeName",
							elements: [{ type: "text", text: place.value }],
						});
					});
				}

				if (provPlace.date && provPlace.date.length > 0) {
					provPlace.date.forEach((dateObj) => {
						originElements.push({
							type: "element",
							name: "date",
							attributes: {
								...(dateObj.not_before ? { notBefore: dateObj.not_before } : {}),
								...(dateObj.not_after ? { notAfter: dateObj.not_after } : {}),
							},
							elements: [{ type: "text", text: dateObj.value }],
						});
					});
				}

				if (originElements.length > 0) {
					elements.push({
						type: "element",
						name: "origin",
						elements: originElements,
					});
				}
			} else {
				// For other types, add to provenance
				const provenanceElements = [];

				if (provPlace.place && provPlace.place.length > 0) {
					provPlace.place.forEach((place) => {
						provenanceElements.push({
							type: "element",
							name: "placeName",
							elements: [{ type: "text", text: place.value }],
						});
					});
				}

				if (provPlace.date && provPlace.date.length > 0) {
					provPlace.date.forEach((dateObj) => {
						provenanceElements.push({
							type: "element",
							name: "date",
							attributes: {
								...(dateObj.not_before ? { notBefore: dateObj.not_before } : {}),
								...(dateObj.not_after ? { notAfter: dateObj.not_after } : {}),
							},
							elements: [{ type: "text", text: dateObj.value }],
						});
					});
				}

				if (provenanceElements.length > 0) {
					elements.push({
						type: "element",
						name: "provenance",
						elements: provenanceElements,
					});
				}
			}
		});
	}

	// Add general provenance entries
	if (manuscript.provenance && manuscript.provenance.length > 0) {
		manuscript.provenance.forEach((place) => {
			elements.push({
				type: "element",
				name: "provenance",
				elements: [
					{
						type: "element",
						name: "placeName",
						elements: [{ type: "text", text: place.value }],
					},
				],
			});
		});
	}

	return {
		type: "element",
		name: "history",
		elements: elements,
	};
}

// Create the additional element
function createAdditional(manuscript) {
	const elements = [];

	// Add bibliography if available
	if (manuscript.bibliography && manuscript.bibliography.length > 0) {
		elements.push({
			type: "element",
			name: "listBibl",
			elements: manuscript.bibliography.map((bib) => ({
				type: "element",
				name: "bibl",
				elements: [
					...(bib.author
						? [
								{
									type: "element",
									name: "author",
									elements: [{ type: "text", text: bib.author }],
								},
							]
						: []),
					...(bib.title
						? [
								{
									type: "element",
									name: "title",
									elements: [{ type: "text", text: bib.title }],
								},
							]
						: []),
					...(bib.citation
						? [
								{
									type: "element",
									name: "citedRange",
									elements: [{ type: "text", text: bib.citation }],
								},
							]
						: []),
					...(bib.link
						? [
								{
									type: "element",
									name: "ptr",
									attributes: { target: bib.link },
								},
							]
						: []),
				],
			})),
		});
	}

	// Add surrogates for URLs if available
	const urls = [
		{ url: manuscript.manuscripta_url, type: "manuscripta" },
		{ url: manuscript.handschriftenportal_url, type: "handschriftenportal" },
		{ url: manuscript.catalog_url, type: "catalog" },
		{ url: manuscript.digi_url, type: "digitization" },
	].filter((item) => item.url);

	if (urls.length > 0) {
		elements.push({
			type: "element",
			name: "surrogates",
			elements: urls.map((item) => ({
				type: "element",
				name: "ref",
				attributes: { type: item.type, target: item.url },
				elements: [{ type: "text", text: `${item.type} reference` }],
			})),
		});
	}

	// Add admin info for project-specific metadata
	const adminInfo = [];

	if (manuscript.charakter && manuscript.charakter.length > 0) {
		adminInfo.push({
			type: "element",
			name: "note",
			attributes: { type: "character" },
			elements: manuscript.charakter.map((char) => ({ type: "text", text: char })),
		});
	}

	if (manuscript.case_study && manuscript.case_study.length > 0) {
		adminInfo.push({
			type: "element",
			name: "note",
			attributes: { type: "case_study" },
			elements: manuscript.case_study.map((study) => ({ type: "text", text: study })),
		});
	}

	if (manuscript.status && manuscript.status.length > 0) {
		adminInfo.push({
			type: "element",
			name: "note",
			attributes: { type: "status" },
			elements: manuscript.status.map((status) => ({ type: "text", text: status })),
		});
	}

	if (adminInfo.length > 0) {
		elements.push({
			type: "element",
			name: "adminInfo",
			elements: adminInfo,
		});
	}

	if (elements.length > 0) {
		return {
			type: "element",
			name: "additional",
			elements: elements,
		};
	}

	return null;
}

// Process codicological units (msPart elements)
function processMsParts(manuscript) {
	if (!manuscript.cod_units || manuscript.cod_units.length === 0) {
		return [];
	}

	return manuscript.cod_units.map((unit, index) => {
		const elements = [];

		// Add msIdentifier
		elements.push({
			type: "element",
			name: "msIdentifier",
			elements: [
				{
					type: "element",
					name: "idno",
					elements: [{ type: "text", text: unit.value || `Unit ${unit.number || index + 1}` }],
				},
			],
		});

		// Add locus
		if (unit.locus) {
			elements.push({
				type: "element",
				name: "locus",
				elements: [{ type: "text", text: unit.locus }],
			});
		}

		// Add physical description
		const physDescElements = [];

		// Add dimensions
		if (unit.heigth || unit.width || unit.written_height || unit.written_width) {
			const supportDescElements = [];

			if (unit.heigth || unit.width) {
				supportDescElements.push({
					type: "element",
					name: "dimensions",
					attributes: { type: "leaf", unit: "mm" },
					elements: [
						...(unit.heigth
							? [
									{
										type: "element",
										name: "height",
										elements: [{ type: "text", text: unit.heigth }],
									},
								]
							: []),
						...(unit.width
							? [
									{
										type: "element",
										name: "width",
										elements: [{ type: "text", text: unit.width }],
									},
								]
							: []),
					],
				});
			}

			if (unit.written_height || unit.written_width) {
				supportDescElements.push({
					type: "element",
					name: "dimensions",
					attributes: { type: "written", unit: "mm" },
					elements: [
						...(unit.written_height
							? [
									{
										type: "element",
										name: "height",
										elements: [{ type: "text", text: unit.written_height }],
									},
								]
							: []),
						...(unit.written_width
							? [
									{
										type: "element",
										name: "width",
										elements: [{ type: "text", text: unit.written_width }],
									},
								]
							: []),
					],
				});
			}

			if (supportDescElements.length > 0) {
				physDescElements.push({
					type: "element",
					name: "objectDesc",
					elements: [
						{
							type: "element",
							name: "supportDesc",
							elements: supportDescElements,
						},
					],
				});
			}
		}

		// Add layout information
		if (unit.columns || unit.lines_number) {
			physDescElements.push({
				type: "element",
				name: "layoutDesc",
				elements: [
					{
						type: "element",
						name: "layout",
						attributes: {
							...(unit.columns && unit.columns.length > 0 ? { columns: unit.columns[0] } : {}),
							...(unit.lines_number ? { writtenLines: unit.lines_number } : {}),
						},
					},
				],
			});
		}

		// Add decoration
		if (unit.decoration) {
			physDescElements.push({
				type: "element",
				name: "decoDesc",
				elements: [
					{
						type: "element",
						name: "p",
						elements: [{ type: "text", text: unit.decoration }],
					},
				],
			});
		}

		if (physDescElements.length > 0) {
			elements.push({
				type: "element",
				name: "physDesc",
				elements: physDescElements,
			});
		}

		// Add content
		if (unit.content && unit.content.length > 0) {
			elements.push({
				type: "element",
				name: "msContents",
				elements: unit.content.map((item) => createMsItem(item)),
			});
		}

		// Add history specific to this part
		if (unit.prov_place && unit.prov_place.length > 0) {
			const historyElements = [];

			// Process provenance places by type
			unit.prov_place.forEach((provPlace) => {
				if (provPlace.type === "orig") {
					// For origin type
					const originElements = [];

					if (provPlace.place && provPlace.place.length > 0) {
						provPlace.place.forEach((place) => {
							originElements.push({
								type: "element",
								name: "placeName",
								elements: [{ type: "text", text: place.value }],
							});
						});
					}

					if (provPlace.date && provPlace.date.length > 0) {
						provPlace.date.forEach((dateObj) => {
							originElements.push({
								type: "element",
								name: "date",
								attributes: {
									...(dateObj.not_before ? { notBefore: dateObj.not_before } : {}),
									...(dateObj.not_after ? { notAfter: dateObj.not_after } : {}),
								},
								elements: [{ type: "text", text: dateObj.value }],
							});
						});
					}

					if (originElements.length > 0) {
						historyElements.push({
							type: "element",
							name: "origin",
							elements: originElements,
						});
					}
				} else {
					// For other types (provenance)
					const provenanceElements = [];

					if (provPlace.place && provPlace.place.length > 0) {
						provPlace.place.forEach((place) => {
							provenanceElements.push({
								type: "element",
								name: "placeName",
								elements: [{ type: "text", text: place.value }],
							});
						});
					}

					if (provPlace.date && provPlace.date.length > 0) {
						provPlace.date.forEach((dateObj) => {
							provenanceElements.push({
								type: "element",
								name: "date",
								attributes: {
									...(dateObj.not_before ? { notBefore: dateObj.not_before } : {}),
									...(dateObj.not_after ? { notAfter: dateObj.not_after } : {}),
								},
								elements: [{ type: "text", text: dateObj.value }],
							});
						});
					}

					if (provenanceElements.length > 0) {
						historyElements.push({
							type: "element",
							name: "provenance",
							elements: provenanceElements,
						});
					}
				}
			});

			if (historyElements.length > 0) {
				elements.push({
					type: "element",
					name: "history",
					elements: historyElements,
				});
			}
		}

		return {
			type: "element",
			name: "msPart",
			attributes: { n: unit.number || (index + 1).toString() },
			elements: elements,
		};
	});
}

// Create msItem element
function createMsItem(item) {
	const elements = [];

	// Add locus
	if (item.locus) {
		elements.push({
			type: "element",
			name: "locus",
			elements: [{ type: "text", text: item.locus }],
		});
	}

	// Add title and author
	if (item.title_work && item.title_work.length > 0) {
		const work = item.title_work[0];

		if (work.title) {
			elements.push({
				type: "element",
				name: "title",
				elements: [{ type: "text", text: work.title }],
			});
		}

		if (work.author && work.author.length > 0) {
			work.author.forEach((author) => {
				elements.push({
					type: "element",
					name: "author",
					attributes: author.gnd_url ? { ref: author.gnd_url } : {},
					elements: [{ type: "text", text: author.name }],
				});
			});
		}
	}

	// Add incipit
	if (item.incipit) {
		elements.push({
			type: "element",
			name: "incipit",
			elements: [{ type: "text", text: item.incipit }],
		});
	}

	// Add explicit
	if (item.explicit) {
		elements.push({
			type: "element",
			name: "explicit",
			elements: [{ type: "text", text: item.explicit }],
		});
	}

	// Add rubric
	if (item.rubric) {
		elements.push({
			type: "element",
			name: "rubric",
			elements: [{ type: "text", text: item.rubric }],
		});
	}

	// Add final rubric
	if (item.final_rubric) {
		elements.push({
			type: "element",
			name: "finalRubric",
			elements: [{ type: "text", text: item.final_rubric }],
		});
	}

	return {
		type: "element",
		name: "msItem",
		attributes: {
			n: item.id.toString(),
			...(item.label ? { "xml:id": item.label } : {}),
		},
		elements: elements,
	};
}

// Main function to process manuscripts
function processManuscripts(teiElements) {
	teiElements.forEach((manuscript) => {
		// Find the "msDesc" element inside the manuscript entry
		const msDesc = manuscript.elements.find((el) => el.name === "msDesc");

		if (msDesc) {
			const msParts = processMsParts(manuscript); // Process msParts for this manuscript
			if (msParts.length > 0) {
				msDesc.elements.push(...msParts);
			}
		}
	});

	return teiElements;
}
// Generate the TEI XML
let teiDoc = createTEIXML(jsonData);

// Process manuscripts inside the TEI document
teiDoc.elements[0].elements = processManuscripts(teiDoc.elements[0].elements);

const xmlOutput = js2xml(teiDoc, { compact: false, spaces: 4 });
console.log("Generated XML:", xmlOutput);

// Convert to XML string with formatting
const xmlOptions = { compact: false, spaces: 2 };
const xmlString = js2xml(teiDoc, xmlOptions);

// set the output folder
const folderPath = join(process.cwd(), "src", "content", "tei");
mkdirSync(folderPath, { recursive: true });

// Write to file
writeFileSync(join(folderPath, "manuscript-tei.xml"), xmlString);
console.log("TEI XML file has been created in folder ${folderPath}");
