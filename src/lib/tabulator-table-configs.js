// Configuration for Tabulator tables in work detail pages
export const workDetailTableConfig = {
	transformData: (msTransmission) => {
		return msTransmission.map((item) => ({
			manuscript: item.manuscript[0]?.value || "",
			manuscriptId: item.manuscript[0]?.id || "",
			locus: item.locus || "",
			hit_id: item.hit_id || "",
			role: item.role || "",
			function: item.function || "",
			origPlace: [...new Set(item.orig_place.flatMap((p) => p.place.map((pl) => pl.value)))].join(
				", ",
			),
			origDate: [...new Set(item.orig_date.flatMap((oDat) => oDat.date.map((d) => d.value)))].join(
				" | ",
			),
			annotationDate: [
				...new Set(item.annotation_date.flatMap((anDat) => anDat.date.map((d) => d.value))),
			].join(" | "),
			annotationType: [...new Set(item.annotation_typ)].join(" | "),
			version: [...new Set(item.version.map((ver) => ver.value))].join(" | "),
			textModification: [...new Set(item.text_modification)].join(" | "),
			decoration: [...new Set(item.decoration.map((deco) => deco.value))].join(" | "),
			form: [...new Set(item.form.map((f) => f.value))].join(" | "),
		}));
	},

	getColumns: (
		hasRole = false,
		hasVersion = false,
		hasTextModification = false,
		hasForm = false,
		hasAnnotationType = false,
		hasAnnotationDate = false,
	) => {
		const baseColumns = [
			{
				title: "Handschrift",
				field: "manuscript",
				responsive: 0,

				widthGrow: 3,
				minWidth: 150,
			},
			{
				title: "Locus",
				field: "locus",
				responsive: 0,
				widthGrow: 1,
				minWidth: 80,
			},
			...(hasRole
				? [
						{
							title: "Role",
							field: "role",
							responsive: 3,
							minWidth: 150,
						},
					]
				: []),
			{
				title: "Schreibort",
				field: "origPlace",
				responsive: 1,
				widthGrow: 2,
				minWidth: 150,
			},
			{
				title: "Datierung",
				field: "origDate",
				responsive: 2,
				widthGrow: 1,
				minWidth: 150,
			},
			...(hasAnnotationDate
				? [
						{
							title: "Annotationen - Datierung",
							field: "annotationDate",
							responsive: 3,
							minWidth: 150,
						},
					]
				: []),
			...(hasAnnotationType
				? [
						{
							title: "Annotationen - Typ",
							field: "annotationType",
							responsive: 2,
							widthGrow: 2,
							minWidth: 150,
							formatter: "textarea",
						},
					]
				: []),

			...(hasForm
				? [
						{
							title: "Form",
							field: "form",
							responsive: 3,
							widthGrow: 2,
							minWidth: 150,
						},
					]
				: []),
			...(hasVersion
				? [
						{
							title: "Version",
							field: "version",
							responsive: 3,
							widthGrow: 2,
							minWidth: 150,
							formatter: "textarea",
						},
					]
				: []),
			...(hasTextModification
				? [
						{
							title: "Textmodifikation",
							field: "textModification",
							responsive: 3,
							widthGrow: 2,
							minWidth: 120,
							formatter: "textarea",
						},
					]
				: []),
		];

		return addHeaderFilters(baseColumns);
	},

	// Row click configuration for work-mss-transmission table
	getRowClickConfig: () => ({
		urlPattern: "/msitems/{id}",
		idField: "hit_id",
		target: "_self",
	}),
};

// Helper function to add header filters to columns
function addHeaderFilters(columns) {
	return columns.map((column) => ({
		headerFilter: "input", // Default
		headerFilterPlaceholder: "Filtern ...", // Default
		...column,
	}));
}

// Configuration for Tabulator tables in manuscripts
export const manuscriptsTableConfig = {
	transformData: (manuscripts) => {
		return manuscripts.map((ms) => {
			const dates = ms.orig_date.flatMap((d) => d.date);
			const uniqueDates = Array.from(new Map(dates.map((d) => [d.id, d])).values());
			return {
				id: ms.id || "",
				hit_id: ms.hit_id || "",
				shelfmark: ms.shelfmark || "",
				origDate: uniqueDates,
				origPlace: [...new Set(ms.orig_place.flatMap((place) => place.value))].join(", "),
				library: (ms.library[0].place[0].value, ms.library[0]?.library_full || ""),
				case_study: ms.case_study || "",
			};
		});
	},

	getColumns: () => {
		const columns = [
			{
				title: "Bibliothek",
				field: "library",
				responsive: 1,
				widthGrow: 2,
				minWidth: 150,
			},
			{
				title: "Signatur",
				field: "shelfmark",
				responsive: 0,
				widthGrow: 1,
				minWidth: 150,
			},
			{
				title: "Schreibort",
				field: "origPlace",
				responsive: 2,
				widthGrow: 2,
				minWidth: 150,
			},
			{
				title: "Datierung",
				field: "origDate",
				headerFilterPlaceholder: "e.g. nach 810",
				responsive: 3,
				widthGrow: 2,
				minWidth: 150,
			},
			{
				title: "Case study",
				field: "case_study",
				responsive: 4,
				widthGrow: 1,
				minWidth: 150,
			},
		];

		return addHeaderFilters(columns);
	},
	// Row click configuration for work-mss-transmission table
	getRowClickConfig: {
		urlPattern: "/manuscripts/{id}",
		idField: "hit_id",
		target: "_self",
	},
};

// Configuration for Tabulator tables in works
export const worksTableConfig = {
	transformData: (works) => {
		return works.map((work) => {
			const orgDate = [
				...new Map(
					work.ms_transmission
						.flatMap((ms) => ms.orig_date.flatMap((d) => d.date))
						.map((date) => [date.id, date]), // Use ID as a unique key
				).values(),
			]
				.map((place) => place.value)
				.join(" | ");
			const orgPlace = [
				...new Set(
					work.ms_transmission.flatMap((ms) =>
						ms.orig_place.flatMap((p) => p.place.map((place) => place.value)),
					),
				),
			].join(" | ");
			const provenance = [
				...new Set(
					work.ms_transmission.flatMap((ms) =>
						ms.provenance.flatMap((placement) => placement.places.map((place) => place.value)),
					),
				),
			].join(", ");
			return {
				id: work.id || "",
				hit_id: work.hit_id || "",
				title: work.title || "",
				author: [...new Set(work.author.map((a) => a.name))].join(", "),
				genre: [...new Set(work.genre.map((g) => g.value))].join(", "),
				ms_transmission: [...new Set(work.ms_transmission.map((m) => m.manuscript[0]?.value))].join(
					", ",
				),
				origPlace: orgPlace,
				provenance: provenance,
				origDate: orgDate,
			};
		});
	},

	getColumns() {
		const columns = [
			{
				title: "Titel",
				field: "title",
				responsive: 1,
				widthGrow: 3,
				minWidth: 150,
			},
			{
				title: "Autor",
				field: "author",
				headerFilterPlaceholder: "e.g. Isidor",
				minWidth: 100,
				widthGrow: 2,
				responsive: 1,
			},
			{
				title: "Genre",
				field: "genre",
				headerFilter: "list",
				headerFilterParams: { valuesLookup: true, clearable: true, sort: "asc" },
				minWidth: 150,
				widthGrow: 1,
				responsive: 2,
			},
			{
				title: "Überlieferung",
				field: "ms_transmission",
				headerFilterPlaceholder: "e.g. Clm. 6380",
				minWidth: 150,
				headerFilter: "input",
				formatter: "textarea",
				widthGrow: 1,
				responsive: 2,
			},
			{
				title: "Entstehungsort",
				field: "origPlace",
				headerFilterPlaceholder: "e.g. Reims",
				minWidth: 150,
				formatter: "textarea",
				responsive: 2,
			},
			{
				title: "Provenienz",
				field: "provenance",
				headerFilterPlaceholder: "e.g. Freising",
				minWidth: 150,
				formatter: "textarea",
				responsive: 2,
			},
			{
				title: "Datum",
				field: "origDate",
				headerFilterPlaceholder: "e.g. 850, nach 850",
				minWidth: 150,
				// Ensures filtering and sorting work correctly

				responsive: 2,
			},
		];
		return addHeaderFilters(columns);
	},
	// Row click configuration for work-mss-transmission table
	getRowClickConfig: {
		urlPattern: "/works/{id}",
		idField: "hit_id",
		target: "_self",
	},
};
