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
