import * as z from "zod";
// helpers to turn null undefined to empty strings or array
const arrayOrEmpty = <T>(schema: z.ZodType<T>) =>
	z
		.array(schema)
		.nullable()
		.transform((v): T[] => v ?? []);

const stringOrEmpty = z
	.string()
	.nullable()
	.transform((v) => v ?? "");

const objectOrNull = <T>(schema: z.ZodType<T>) => schema.nullable().transform((v) => v ?? null);

export const LabelSchema = z.object({
	id: z.number(),
	value: z.string(),
});

export const IdsSchema = z.record(z.string(), z.number());
export type Ids = z.infer<typeof IdsSchema>;
export const TableRefSchema = z.object({
	ids: IdsSchema,
	value: z.string(),
});

export type Label = z.infer<typeof LabelSchema>;

export const multiSelectSchema = z.object({
	id: z.number(),
	value: z.string(),
	color: z.string(),
});

export const selectSchema = z.object({
	id: z.number(),
	value: z.array(multiSelectSchema),
});

export const RefSchema = z.object({
	id: z.number(),
	value: z.string(),
	order: z.string(),
});

export const EdBySchema = z.object({
	id: z.number(),
	name: z.string(),
});
export type EdBy = z.infer<typeof EdBySchema>;

// ######## data schemas:
export const HitWorksSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	title: stringOrEmpty,
	gnd_url: stringOrEmpty,
	note: stringOrEmpty,
	hit_id: stringOrEmpty,
	author: arrayOrEmpty(RefSchema),
	bibliography: arrayOrEmpty(z.any()),
	source_text: arrayOrEmpty(RefSchema),
	genre: arrayOrEmpty(RefSchema),
	note_source: stringOrEmpty,
	"Created by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified by": EdBySchema,
	"Last modified": stringOrEmpty,
});
export type HitWorks = z.infer<typeof HitWorksSchema>;

export type Work = z.infer<typeof RefSchema>;

export const HitWorksVersionSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	label: stringOrEmpty,
	work: arrayOrEmpty(RefSchema),
	version: stringOrEmpty,
	hit_id: stringOrEmpty,
});
export type HitWorksVersion = z.infer<typeof HitWorksVersionSchema>;

export const HitStrataSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	label: arrayOrEmpty(LabelSchema),
	character: arrayOrEmpty(multiSelectSchema),
	manuscript: arrayOrEmpty(RefSchema),
	number: stringOrEmpty,
	hit_id: stringOrEmpty,
	hand_role: arrayOrEmpty(RefSchema),
	ms_items: arrayOrEmpty(TableRefSchema),
	locus: arrayOrEmpty(LabelSchema),
	note: stringOrEmpty,
	"Created by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified by": EdBySchema,
	"Last modified": stringOrEmpty,
	strata_filiation: arrayOrEmpty(RefSchema),
	note_filiation: stringOrEmpty,
	cod_units: arrayOrEmpty(RefSchema),
	cod_unit: arrayOrEmpty(TableRefSchema),
});
export type HitStrata = z.infer<typeof HitStrataSchema>;

export const HitScribeSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	name: stringOrEmpty,
	hit_id: stringOrEmpty,
	description: stringOrEmpty,
	group: z.boolean(),
	hands: arrayOrEmpty(RefSchema),
	hand: arrayOrEmpty(TableRefSchema),
	"Last modified": stringOrEmpty,
	"Last modified by": EdBySchema,
	author_entry: arrayOrEmpty(RefSchema),
});
export type HitScribe = z.infer<typeof HitScribeSchema>;

export const HitPlaceSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	name: stringOrEmpty,
	geonames_url: stringOrEmpty,
	hit_id: stringOrEmpty,
	wikidata_url: stringOrEmpty,
	country: arrayOrEmpty(RefSchema),
	"Created by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified by": EdBySchema,
	"Last modified": stringOrEmpty,
	lat: stringOrEmpty,
	long: stringOrEmpty,
});
export type HitPlace = z.infer<typeof HitPlaceSchema>;

export const HitPeopleSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	name: stringOrEmpty,
	gnd_url: stringOrEmpty,
	hit_id: stringOrEmpty,
	role: z.array(multiSelectSchema),
	"Created by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified by": EdBySchema,
	"Last modified": stringOrEmpty,
	works: arrayOrEmpty(RefSchema),
	work: arrayOrEmpty(LabelSchema),
});
export type HitPeople = z.infer<typeof HitPeopleSchema>;

export const HitMsitemSchema = z.object({
	id: z.number(),
	order: z.string(),
	label: arrayOrEmpty(LabelSchema),
	manuscript: arrayOrEmpty(RefSchema),
	incipit: stringOrEmpty,
	explicit: stringOrEmpty,
	rubric: stringOrEmpty,
	title_work: arrayOrEmpty(RefSchema),
	title_note: stringOrEmpty,
	bibl: arrayOrEmpty(z.any()),
	final_rubric: stringOrEmpty,
	siglum: stringOrEmpty,
	hit_id: stringOrEmpty,
	filiation: stringOrEmpty,
	locus_grp: stringOrEmpty,
	hands_role: arrayOrEmpty(RefSchema),
	cod_unit: arrayOrEmpty(RefSchema),
	"Last modified": stringOrEmpty,
	"Created on": stringOrEmpty,
	"Created by": EdBySchema,
	"Last modified by": EdBySchema,
	note: stringOrEmpty,
	hand: arrayOrEmpty(TableRefSchema),
	decoration: arrayOrEmpty(multiSelectSchema),
	facs_url: stringOrEmpty,
	form: arrayOrEmpty(multiSelectSchema),
	form_note: stringOrEmpty,
	columns: arrayOrEmpty(multiSelectSchema),
	commented_msitem: arrayOrEmpty(RefSchema),
	interpolations: arrayOrEmpty(RefSchema),
	text_modification: arrayOrEmpty(multiSelectSchema),
	language: arrayOrEmpty(multiSelectSchema),
	version: arrayOrEmpty(RefSchema),
});

export type HitMsitem = z.infer<typeof HitMsitemSchema>;

export const HitManuscriptSchema = z.object({
	id: z.number(),
	order: z.string(),
	shelfmark: z.array(LabelSchema),
	hit_id: z.string(),
	library: z.array(RefSchema),
	manuscripta_url: stringOrEmpty,
	handschriftenportal_url: stringOrEmpty,
	catalog_url: stringOrEmpty,
	digi_url: stringOrEmpty,
	idno: z.string(),
	idno_former: stringOrEmpty,
	quire_structure: stringOrEmpty,
	library_full: arrayOrEmpty(LabelSchema),
	extent: stringOrEmpty,
	foliation: stringOrEmpty,
	acc_mat: stringOrEmpty,
	binding: stringOrEmpty,
	binding_date: arrayOrEmpty(RefSchema),
	history: stringOrEmpty,
	bibliography: z.array(z.any()),
	height: stringOrEmpty,
	width: stringOrEmpty,
	material_spec: stringOrEmpty,
	orig_place: arrayOrEmpty(RefSchema),
	catchwords: stringOrEmpty,
	quiremarks: stringOrEmpty,
	material: objectOrNull(multiSelectSchema),
	provenance: arrayOrEmpty(RefSchema),
	manuscripts_dated: arrayOrEmpty(RefSchema),
	orig_dated: arrayOrEmpty(TableRefSchema),
	"Created by": EdBySchema,
	"Last modified by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified": stringOrEmpty,
	content_summary: stringOrEmpty,
	charakter: arrayOrEmpty(multiSelectSchema),
	case_study: arrayOrEmpty(multiSelectSchema),
	status: arrayOrEmpty(multiSelectSchema),
	author_entry: arrayOrEmpty(RefSchema),
	title: stringOrEmpty,
});
export type HitManuscript = z.infer<typeof HitManuscriptSchema>;

export const HitManuscriptDatedSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	hit_id: stringOrEmpty,
	manuscript: arrayOrEmpty(RefSchema),
	date: arrayOrEmpty(RefSchema),
	authority: arrayOrEmpty(RefSchema),
	page: stringOrEmpty,
	preferred_date: z.boolean(),
	"Created by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified by": EdBySchema,
	"Last modified": z.coerce.date(),
	note: stringOrEmpty,
});
export type HitManuscriptDated = z.infer<typeof HitManuscriptDatedSchema>;

export const HitLibrarySchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	label: stringOrEmpty,
	hit_id: stringOrEmpty,
	gnd_url: stringOrEmpty,
	library_full: stringOrEmpty,
	library_website: stringOrEmpty,
	settlement: arrayOrEmpty(RefSchema),
	wikidata: stringOrEmpty,
	"Created by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified by": EdBySchema,
	"Last modified": stringOrEmpty,
});
export type HitLibrary = z.infer<typeof HitLibrarySchema>;

export const HitHandSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	label: arrayOrEmpty(TableRefSchema),
	description: stringOrEmpty,
	hit_id: stringOrEmpty,
	similar_hands: arrayOrEmpty(RefSchema),
	nr_daniel: stringOrEmpty,
	manuscript: arrayOrEmpty(RefSchema),
	number: stringOrEmpty,
	note: stringOrEmpty,
	"Created by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified by": EdBySchema,
	"Last modified": stringOrEmpty,
	hands_role: arrayOrEmpty(RefSchema),
	role: arrayOrEmpty(selectSchema),
	texts: arrayOrEmpty(TableRefSchema),
	hands_dated: arrayOrEmpty(RefSchema),
	dating: arrayOrEmpty(TableRefSchema),
	hands_placed: arrayOrEmpty(RefSchema),
	scribe: arrayOrEmpty(RefSchema),
	gruppe: z.boolean(),
	author_entry: arrayOrEmpty(RefSchema),
});
export type HitHand = z.infer<typeof HitHandSchema>;

export const HitHandRoleSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	hit_id: stringOrEmpty,
	hand: arrayOrEmpty(RefSchema),
	ms_item: arrayOrEmpty(RefSchema),
	role: arrayOrEmpty(multiSelectSchema),
	locus: stringOrEmpty,
	text: arrayOrEmpty(TableRefSchema),
	locus_text: arrayOrEmpty(LabelSchema),
	"Last modified by": EdBySchema,
	"Created by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified": stringOrEmpty,
	locus_layout: arrayOrEmpty(multiSelectSchema),
	function: arrayOrEmpty(multiSelectSchema),
	scribe_type: arrayOrEmpty(multiSelectSchema),
	strata: arrayOrEmpty(RefSchema),
});
export type HitHandRole = z.infer<typeof HitHandRoleSchema>;

export const HitHandsPlacedSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	hit_id: stringOrEmpty,
	hand: arrayOrEmpty(RefSchema),
	authority: arrayOrEmpty(RefSchema),
	page: stringOrEmpty,
	place: arrayOrEmpty(RefSchema),
	"Last modified by": EdBySchema,
});
export type HitHandsPlaced = z.infer<typeof HitHandsPlacedSchema>;

export const HitHandsDatedSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	hit_id: stringOrEmpty,
	authority: z.array(RefSchema),
	page: stringOrEmpty,
	dated: z.array(RefSchema),
	hand: z.array(RefSchema),
	new_dating: z.boolean(),
	"Created by": EdBySchema,
	"Last modified by": EdBySchema,
	"Last modified": stringOrEmpty,
	"Created on": stringOrEmpty,
	note: stringOrEmpty,
});
export type HitHandsDated = z.infer<typeof HitHandsDatedSchema>;

export const HitGenresSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	label: stringOrEmpty,
	genre: stringOrEmpty,
	hit_id: stringOrEmpty,
	m_genre: arrayOrEmpty(RefSchema),
	"Created by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified by": EdBySchema,
	"Last modified": stringOrEmpty,
	sub_genre: stringOrEmpty,
	main_genre: stringOrEmpty,
});
export type HitGenres = z.infer<typeof HitGenresSchema>;
export const HitFiliatedStrataSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	label: arrayOrEmpty(LabelSchema),
	library: arrayOrEmpty(RefSchema),
	idno: stringOrEmpty,
	locus: stringOrEmpty,
	catalog_url: stringOrEmpty,
	hit_id: stringOrEmpty,
	note: stringOrEmpty,
});
export type HitFiliatedStrata = z.infer<typeof HitFiliatedStrataSchema>;

export const HitDatesSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	label: stringOrEmpty,
	not_before: stringOrEmpty,
	hit_id: stringOrEmpty,
	not_after: stringOrEmpty,
	"Created by": EdBySchema,
	"Last modified by": EdBySchema,
	"Last modified": stringOrEmpty,
});
export type HitDates = z.infer<typeof HitDatesSchema>;

export const HitCodunitsSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	label: arrayOrEmpty(TableRefSchema),
	notes: stringOrEmpty,
	hit_id: stringOrEmpty,
	locus: stringOrEmpty,
	manuscript: arrayOrEmpty(RefSchema),
	number: stringOrEmpty,
	"Created by": EdBySchema,
	"Created on": stringOrEmpty,
	"Last modified by": EdBySchema,
	"Last modified": stringOrEmpty,
	orig_date: arrayOrEmpty(z.any()),
	heigth: stringOrEmpty,
	lines_number: stringOrEmpty,
	decorations: stringOrEmpty,
	basic_structure: arrayOrEmpty(z.any()),
	written_width: stringOrEmpty,
	written_height: stringOrEmpty,
	width: stringOrEmpty,
	columns: arrayOrEmpty(z.any()),
	cod_unit_placed: arrayOrEmpty(RefSchema),
	prov_place: arrayOrEmpty(TableRefSchema),
	strata: arrayOrEmpty(RefSchema),
	ruling: stringOrEmpty,
	material: multiSelectSchema.nullable(),
	material_spec: stringOrEmpty,
	catchwords: stringOrEmpty,
	quiremarks: stringOrEmpty,
});
export type HitCodunits = z.infer<typeof HitCodunitsSchema>;

export const HitCodPlacedSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	hit_id: stringOrEmpty,
	cod_unit: arrayOrEmpty(RefSchema),
	place: arrayOrEmpty(RefSchema),
	from: arrayOrEmpty(RefSchema),
	type: multiSelectSchema.nullable(),
	till: arrayOrEmpty(RefSchema),
	ms: arrayOrEmpty(LabelSchema),
	authority: arrayOrEmpty(RefSchema),
	page: stringOrEmpty,
	uncertain_from: z.boolean(),
	uncertain_till: z.boolean(),
	uncertain_place: z.boolean(),
});
export type HitCodPlaced = z.infer<typeof HitCodPlacedSchema>;

export const HitBibliographySchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	author: stringOrEmpty,
	short_title: stringOrEmpty,
	zotero_id: stringOrEmpty,
	hit_id: stringOrEmpty,
	title: stringOrEmpty,
	year: stringOrEmpty,
	citation: stringOrEmpty,
	link: stringOrEmpty,
});
export type HitBibliography = z.infer<typeof HitBibliographySchema>;

export const HitStrataFiliationSchema = z.object({
	id: z.number(),
	order: stringOrEmpty,
	hit_id: stringOrEmpty,
	stratum: arrayOrEmpty(RefSchema),
	filiated_stratum: arrayOrEmpty(RefSchema),
	reason: multiSelectSchema.nullable(),
	note: stringOrEmpty,
});
export type HitStrataFiliation = z.infer<typeof HitStrataFiliationSchema>;
