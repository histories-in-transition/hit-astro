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
	id: number;
	hit_id: string;
	label: string;
	view_label?: string;
	manuscript?: ManuscriptRef[];
	library?: ManuscriptRef[];
	library_place?: Place[];
	cod_unit?: ManuscriptRef[];
	locus: string;
	incipit?: string;
	explicit?: string;
	rubric?: string;
	final_rubric?: string;
	title_work: TitleWork[];
	title_note?: string;
	siglum?: string;
	text_modification?: string[];
	interpolations?: TitleWork[];
	bibl?: Bibliography[];
	commentedMsItem?: CommentedMsItem[];
	hands?: any;
	decoration?: FormItem[];
	form?: FormItem[];
	form_note?: string;
	note?: string;
	orig_date?: OrigDateItem[];
	orig_place?: OrigPlaceItem[];
	provenance?: ProvenanceItem[];
	author_entry?: string[];
	prev?: NavigationLink;
	next?: NavigationLink;
	language?: FormItem[];
}

interface FormItem {
	value: string;
}

interface OrigDateItem {
	id?: number;
	hit_id?: string;
	authority?: Authority[];
	page?: string;
	date?: DateInfo[];
}

interface OrigPlaceItem {
	id: number;
	hit_id: string;
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
}

interface CommentedMsItem {
	id: number;
	value?: string;
	title?: string;
	hit_id: string;
}

interface TitleWork {
	id: number;
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

interface Hand {
	hit_id: string;
	label: string;
	description: string;
	similar_hands?: SimilarHand[];
	nr_daniel?: string;
	note?: string;
	scribe?: Scribe[];
	group: boolean;
	date?: HandDate[];
	dating?: OrigDateItem[];
	place?: OrigPlaceItem[];
	hand_roles?: HandRole[];
	placed?: HandPlacement[];
	jobs?: HandRole[];
}

interface SimilarHand {
	id: number;
	value: string;
}

interface Scribe {
	id: number;
	hit_id?: string;
	value?: string;
	name?: string;
	description?: string;
	group?: boolean;
	hands?: ScribeHand[];
	date?: HandDate[];
	places?: HandPlacement[];
	author_entry?: string[];
	prev?: NavigationLink;
	next?: NavigationLink;
}

interface ScribeHand {
	id: number;
	hit_id: string;
	label: string;
	view_label?: string;
	description: string;
	similar_hands?: SimilarHand[];
	nr_daniel?: string;
	manuscript?: ManuscriptRef[];
	note?: string;
	roles?: string[];
	group: boolean;
	date?: HandDate[];
	hand_roles?: HandRole[];
	placed?: HandPlacement[];
	texts?: string[];
}

interface ManuscriptRef {
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
	locus?: string;
	role?: RoleValue[];
	function?: RoleValue[];
	role_context?: RoleValue[];
	scribe_type?: RoleValue[];
	locus_layout?: string[];
	all_in_one?: string;
}

interface HandRoleContent {
	hit_id: string;
	title_work?: TitleWork[];
	locus: string;
}

interface RoleValue {
	value: string;
}

interface HandPlacement {
	hit_id: string;
	authority?: Authority[];
	page?: string;
	place?: Place[];
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

interface Stratum {
	id: number | string;
	number: string;
	hit_id?: string;
	label: string;
	character?: string[];
	hand_roles?: StratumHandRole[];
	note?: string;
}

interface StratumHandRole {
	hit_id: string;
	hand?: StratumHand[];
	ms_item?: StratumMsItem[];
	role?: string[];
	locus?: string;
	scribe_type?: string[];
	function?: string[];
	locus_layout?: string[];
}

interface StratumHand {
	hit_id: string;
	label: string;
	date?: DateInfo[];
}

interface StratumMsItem {
	id: number;
	hit_id: string;
	title?: string[];
	author?: string[];
	locus: string;
}
