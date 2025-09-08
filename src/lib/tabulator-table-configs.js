// Configuration for Tabulator tables in work detail pages
export const workDetailTableConfig = {
	transformData: (msTransmission) => {
		return msTransmission.map((item) => ({
			manuscript: item.manuscript[0]?.value || "",
			manuscriptId: item.manuscript[0]?.id || "",
			locus: item.locus || "",
			hitId: item.hit_id || "",
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
			annotationType: [...new Set(item.annotation_typ.map((type) => type.value))].join(" | "),
			version: [...new Set(item.version.map((ver) => ver.value))].join(" | "),
			textModification: [...new Set(item.text_modification)].join(" | "),
			decoration: [...new Set(item.decoration.map((deco) => deco.value))].join(" | "),
		}));
	},

	getColumns: (hasRole = false, hasVersion = false, hasTextModification = false) => {
		const baseColumns = [
			{
				title: "Handschrift",
				field: "manuscript",
			},
			{
				title: "Locus",
				field: "locus",
			},
			...(hasRole
				? [
						{
							title: "Role",
							field: "role",
						},
					]
				: []),
			{
				title: "Schreibort",
				field: "origPlace",
			},
			{
				title: "Datierung",
				field: "origDate",
			},
			{
				title: "Annotationen - Datierung",
				field: "annotationDate",
			},
			{
				title: "Annotationen - Typ",
				field: "annotationType",
			},
			...(hasVersion
				? [
						{
							title: "Version",
							field: "version",
							headerFilter: "input",
						},
					]
				: []),
			...(hasTextModification
				? [
						{
							title: "Textmodifikation",
							field: "textModification",
							headerFilter: "input",
						},
					]
				: []),
		];

		return addHeaderFilters(baseColumns);
	},

	// Row click configuration for work-mss-transmission table
	getRowClickConfig: () => ({
		urlPattern: "/msitems/{id}",
		idField: "hitId",
		target: "_self",
	}),
};

// Helper function to add header filters to columns
const addHeaderFilters = (columns, filterConfig = {}) => {
	return columns.map((column) => ({
		...column,
		headerFilter: filterConfig[column.field] || "input", // Default to input filter
		headerFilterPlaceholder: `Filtern ...`,
	}));
};
