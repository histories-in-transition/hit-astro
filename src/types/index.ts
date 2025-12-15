export interface Manuscript {
	id: number;
	hit_id: string;
	shelfmark: string;
	library: Library[];
	title?: string;
	manuscripta_url?: string;
	handschriftenportal_url?: string;
	catalog_url?: string;
	digi_url?: string;
	idno_former?: string;
	quire_structure?: string;
	extent?: string;
	foliation?: string;
	acc_mat?: string;
	binding?: string;
	binding_date?: BindingDate[];
	bibliography?: Bibliography[];
	height?: string;
	width?: string;
	material?: string[];
	history?: string;
	orig_place?: Place[];
	provenance?: Provenance[];
	orig_date?: OrigDate[];
	content_summary?: string;
	content?: MsItem[];
	charakter?: string[];
	case_study?: string[];
	status?: string[];
	hands?: Hand[];
	cod_units?: CodUnit[];
	strata?: Stratum[];
	author_entry?: string[];
	prev?: NavigationLink;
	next?: NavigationLink;
}

interface NavigationLink {
	id: string;
	label: string;
}

interface Library {
	id: number;
	hit_id: string;
	abbreviation: string;
	library_full?: string;
	place?: Place[];
}

interface Place {
	id: number;
	value: string;
	geonames_url?: string;
	hit_id: string;
	lat?: string;
	long?: string;
}

interface BindingDate {
	id: number;
	value: string;
	range?: string;
	not_before?: string;
	not_after?: string;
	century?: string[];
}

interface Bibliography {
	// Define based on your bibliography structure
	// Currently empty array in JSON
}

interface Provenance {
	id: number;
	hit_id: string;
	abbreviation: string;
	library_full?: string;
	place?: Place[];
	wikidata?: string;
}

interface OrigDate {
	date?: DateInfo[];
	authority?: Authority[];
	page?: string;
	preferred_date?: boolean;
	id?: number;
	hit_id?: string;
}

interface DateInfo {
	id: number;
	value: string;
	range?: string;
	not_before?: string;
	not_after?: string;
	century?: string[];
}

interface Authority {
	hit_id: string;
	citation?: string;
	link?: string;
	author?: string;
	title?: string;
}

export interface MsItem {
	id?: number;
	hit_id: string;
	label?: string;
	view_label?: string;
	manuscript?: ShortRef[];
	library?: ShortRef[];
	library_place?: Place[];
	cod_unit?: ShortRef[];
	locus: string;
	incipit?: string;
	explicit?: string;
	rubric?: string;
	final_rubric?: string;
	title_work?: TitleWork[];
	title_note?: string;
	siglum?: string;
	text_modification?: string[];
	interpolations?: TitleWork[];
	bibl?: Bibliography[];
	commented_msitem?: CommentedMsItem[];
	hands?: MsItemHand[];
	decoration?: FormItem[];
	form?: FormItem[];
	form_note?: string;
	note?: string;
	orig_date?: OrigDate[];
	orig_place?: OrigPlace[];
	provenance?: ProvenanceItem[];
	author_entry?: string[];
	prev?: NavigationLink;
	next?: NavigationLink;
	language?: FormItem[];
	version: FormItem[];
	facs_url?: string;
	annotation_typ?: string[];
	annotation_date?: OrigDate[];
}

interface FormItem {
	value: string;
}

interface OrigPlace {
	id?: number;
	hit_id?: string;
	place: Place[];
	authority?: Authority[];
	page?: string;
}

interface ProvenanceItem {
	hit_id: string;
	places?: Place[];
	from?: DateInfo[];
	till?: DateInfo[];
	authority?: Authority[];
	type?: string;
	uncertain_from?: boolean;
	uncertain_till?: boolean;
	page?: string;
}

interface CommentedMsItem {
	id: number;
	value?: string;
	title?: string;
	hit_id: string;
}

interface TitleWork {
	id?: number;
	hit_id: string;
	title: string;
	author?: Author[];
	gnd_url?: string;
	note?: string;
	bibliography?: Bibliography[];
	source_text?: TitleWork[];
	mainGenre?: string[];
	subGenre?: string[];
	note_source?: string;
}

interface Author {
	id: number;
	hit_id: string;
	name: string;
	gnd_url?: string;
}

export interface Hand {
	hit_id: string;
	id?: number;
	label: string;
	view_label?: string;
	description?: string;
	similar_hands?: SimilarHand[];
	nr_daniel?: string;
	note?: string;
	scribe?: Scribe[];
	group?: boolean;
	date?: HandDate[] | DateInfo[];
	dating?: OrigDate[];
	place?: OrigPlace[] | Place[];
	hand_roles?: HandRole[];
	placed?: OrigPlace[];
	jobs?: HandRole[];
	texts?: TitleWork[];
	roles?: Value[] | string[];
	manuscript?: ShortRef[];
	author_entry?: string[];
	prev?: NavigationLink;
	next?: NavigationLink;
}

interface MsItemHand {
	hit_id: string;
	id?: number;
	label: string;
	view_label?: string;
	description?: string;
	similar_hands?: SimilarHand[];
	nr_daniel?: string;
	note?: string;
	scribe?: ShortRef[];
	group?: boolean;
	date?: HandDate[] | DateInfo[];
	dating?: OrigDate[];
	place?: OrigPlace[] | Place[];
	hand_roles?: HandRole[];
	placed?: OrigPlace[];
	jobs?: HandRole[];
	texts?: TitleWork[];
	roles?: Value[] | string[];
	manuscript?: ShortRef[];
	author_entry?: string[];
	prev?: NavigationLink;
	next?: NavigationLink;
}

interface SimilarHand {
	id: number;
	value: string;
}

export interface Scribe {
	id: number;
	hit_id?: string;
	name?: string;
	description?: string;
	group?: boolean;
	hands?: Hand[];
	date?: HandDate[];
	places?: OrigPlace[];
	author_entry?: string[];
	prev?: NavigationLink;
	next?: NavigationLink;
}

interface ShortRef {
	id: number;
	value: string;
}

interface HandDate {
	hit_id: string;
	authority?: Authority[];
	page?: string;
	dated?: DateInfo[];
	dating?: boolean;
	note?: string;
}

interface HandRole {
	hit_id: string;
	id?: number;
	content?: HandRoleContent[];
	scope?: string;
	role?: Value[];
	function?: Value[];
	role_context?: Value[];
	scribe_type?: Value[];
	locus_layout?: Value[];
	all_in_one?: string;
	locus?: string;
}

interface HandRoleContent {
	hit_id: string;
	title_work?: TitleWork[];
	locus: string;
}

interface Value {
	value: string;
}

interface CodUnit {
	id: number;
	hit_id: string;
	value: string;
	number?: string;
	notes?: string;
	locus: string;
	material: string;
	material_spec?: string;
	catchwords?: string;
	quiremarks?: string;
	heigth?: string;
	width?: string;
	written_height?: string;
	written_width?: string;
	columns?: string[];
	lines_number?: string;
	ruling?: string;
	decoration?: string;
	codicological_reworking?: string[];
	basic_structure?: string[];
	prov_place?: ProvenanceItem[];
	content?: MsItem[];
}

export interface Stratum {
	id: number | string;
	number: string;
	hit_id?: string;
	label: string;
	character?: string[];
	hand_roles?: StratumHandRole[];
	note?: string;
	manuscript: StratumMs[];
	msitems: MSIforStratum[];
	date: DateInfo[];
	place: Place[];
	hands: Hand[];
	stratum_filiations: StratumFiliation[];
	prev?: NavigationLink;
	next?: NavigationLink;
}

interface StratumFiliation {
	id?: string | number;
	hit_id: string;
	reason: string;
	filiated_strata: {
		hit_id: string;
		value: string;
		note: string;
		locus: string;
		internal: boolean;
		catalog_url: string;
	}[];
	note: string;
}

interface MSIforStratum {
	id: string | number;
	hit_id: string;
	work: {
		title: string;
		hit_id: string;
	}[];
	author: Author[];
	w_aut: string;
	locus: string;
	orig_date: OrigDate[];
	orig_place: OrigPlace[];
	provenance: ProvenanceItem[];
	hands: Hand[];
	text_modification: string[];
	interpolations: TitleWork[];
	form: Value[];
	language: Value[];
}

interface StratumMs {
	id: number;
	value: string;
	library: ShortRef[];
	author_entry: string[];
	project: string[];
}

interface StratumHandRole {
	hit_id: string;
	hand?: Hand[];
	ms_item?: StratumMsItem[];
	role?: string[];
	locus?: string;
	scribe_type?: string[];
	function?: string[];
	locus_layout?: string[];
}

interface StratumMsItem {
	id: number;
	hit_id: string;
	title?: string[];
	author?: string[];
	locus: string;
}

export interface Work {
	id: number;
	hit_id: string;
	title: string;
	gnd_url: string;
	note: string;
	author: Author[];
	bibliography: any[];
	source_text: SourceText[];
	note_source: string;
	genre: Genre[];
	ms_transmission: MsItem[];
	joined_transmission: TitleWork[];
	prev?: NavigationLink;
	next?: NavigationLink;
}

interface SourceText {
	title: string;
	author: string;
	hit_id: string;
}

interface Genre {
	value: string;
	main_genre: string;
	sub_genre: string;
}
