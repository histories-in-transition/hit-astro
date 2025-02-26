export interface Scribe {
	id: number;
	hit_id: string;
	name: string;
	description: string;
	group: boolean;
	hands: Hand[];
	date: ScribeDate[];
	places: OrigPlaceElement[];
	prev: Next;
	next: Next;
}

export interface ScribeDate {
	hit_id: string;
	authority: Authority[];
	page: string;
	dated: DatedElement[];
	dating: boolean;
	note: string;
}

export interface Authority {
	citation: string;
	link: string;
	author: string;
	title: string;
}

export interface DatedElement {
	id: number;
	value: string;
	range: string;
	not_before: string;
	not_after: string;
}

export interface Hand {
	id: number;
	hit_id: string;
	label: string;
	view_label: string;
	description: string;
	similar_hands: ManuscriptElement[];
	nr_daniel: string;
	manuscript: ManuscriptElement[];
	note: string;
	roles: string[];
	scribe: ManuscriptElement[];
	group: boolean;
	date: ScribeDate[];
	hand_roles: HandHandRole[];
	placed: OrigPlaceElement[];
	texts: string[];
	prev: Next;
	next: Next;
}

export interface HandHandRole {
	hit_id: string;
	content: Content[];
	scope: string;
	role: string[];
	function: string[];
	scribe_type: string[];
	locus_layout: string[];
}

export interface Content {
	manuscript: ManuscriptElement[];
	hit_id: string;
	title_work: TitleWorkElement[];
	locus: string;
}

export interface ManuscriptElement {
	id: number;
	value: string;
}

export interface TitleWorkElement {
	hit_id: string;
	title: string;
	author: string;
}

export interface Next {
	id: string;
	label: string;
}

export interface OrigPlaceElement {
	id?: number;
	hit_id: string;
	authority: string[];
	page: string;
	date?: DatedElement[];
	place?: CommentedMSItem[];
}

export interface CommentedMSItem {
	id: number;
	value: string;
	title?: string;
	hit_id: string;
	geonames_url?: string;
}

export interface Manuscript {
	id: number;
	hit_id: string;
	shelfmark: string;
	library: Library;
	library_full: LibraryFull;
	library_place: LibraryPlace[];
	manuscripta_url: string;
	handschriftenportal_url: string;
	catalog_url: string;
	digi_url: string;
	idno_former: string;
	quire_structure: string;
	extent: string;
	foliation: string;
	acc_mat: string;
	binding: string;
	binding_date: ManuscriptElement[];
	bibliography: any[];
	height: string;
	width: string;
	material?: string;
	material_spec: string;
	catchwords: string;
	quiremarks: string;
	history: string;
	orig_place: CommentedMSItem[];
	provenance: CommentedMSItem[];
	orig_date: ManuscriptOrigDate[];
	content_summary: string;
	charakter: string[];
	case_study: string[];
	status: string[];
	cod_units: PurpleCodUnit[];
	strata: Stratum[];
	prev: Next;
	next: Next;
}

export interface PurpleCodUnit {
	id: number;
	hit_id: string;
	value: string;
	number: string;
	notes: string;
	locus: string;
	quires_number: string;
	heigth: string;
	width: string;
	written_height: string;
	written_width: string;
	columns: string[];
	lines_number: string;
	decoration: string;
	codicological_reworking: any[];
	basic_structure: any[];
	prov_place: ProvPlace[];
	content: MSItem[];
}

export interface MSItem {
	id: number;
	hit_id: string;
	view_label?: string;
	label?: string;
	manuscript?: ManuscriptElement[];
	cod_unit?: ManuscriptElement[];
	locus: string;
	incipit: string;
	explicit: string;
	rubric: string;
	final_rubric: string;
	title_work: TitleWork[];
	title_note: string;
	siglum: string;
	bibl: any[];
	function: string[];
	commentedMsItem: CommentedMSItem[];
	hands?: MSItemHand[];
	decoration: string[];
	note: string;
	orig_date: OrigPlaceElement[];
	orig_place: OrigPlaceElement[];
	prev: Next;
	next: Next;
	role?: string;
}

export interface MSItemHand {
	id: number;
	label: string;
	hit_id: string;
	description: string;
	similar_hands: ManuscriptElement[];
	nr_daniel: string;
	note: string;
	scribe: ManuscriptElement[];
	group: boolean;
	dating: OrigPlaceElement[];
	place: OrigPlaceElement[];
	jobs: Job[];
}

export interface Job {
	id: number;
	hit_id: string;
	role: string[];
	locus: null | string;
	locus_layout: string[];
	function: Function[];
	role_context: string[];
}

export interface TitleWork {
	id: number;
	hit_id: string;
	title: string;
	author: AuthorElement[];
	gnd_url: string;
	note: string;
	bibliography: any[];
	source_text: TitleWorkSourceText[];
	genre: string[];
	note_source: NoteSource;
}

export interface AuthorElement {
	id: number;
	hit_id: string;
	name: string;
	gnd_url: string;
}

export type NoteSource =
	| ""
	| "II, 1"
	| "Autorschaft umstritten"
	| "recencio brevior"
	| "II, 14"
	| "Lib. 2"
	| "I, 48"
	| "Kapitel 19";

export interface TitleWorkSourceText {
	id: number;
	value: Value;
	order: string;
}

export type Value =
	| "Miracula sancti Martini"
	| "Decem libri historiarum"
	| "Historiae duae de sancta cruce";

export interface ProvPlace {
	place: CommentedMSItem[];
	from: DatedElement[];
	till: DatedElement[];
	uncertain_from: boolean;
	uncertain_till: boolean;
	type: Type;
}

export type Type = "orig" | "prov";

export type Library = "ÖNB" | "UBWÜ" | "BSB" | "Saint-Omer" | "Bruxelles KBR";

export type LibraryFull =
	| "Österreichische Nationalbibliothek"
	| "Universitätsbibliothek Würzburg"
	| "Bayerische Staatsbibliothek"
	| "Saint-Omer, Bibliothèque d'agglomération de Saint-Omer"
	| "Bibliothèque royale de Belgique";

export interface LibraryPlace {
	id: number;
	hit_id: string;
	place: CommentedMSItem[];
}

export interface ManuscriptOrigDate {
	date: DatedElement[];
	authority: Authority[];
	page: string;
	preferred_date: boolean;
}

export interface Stratum {
	id: IDEnum | number;
	number: string;
	hit_id?: string;
	label: string;
	character: string[];
	hand_roles: StratumHandRole[];
	note: string;
}

export interface StratumHandRole {
	hit_id: string;
	hand: HandRoleHand[];
	ms_item: MSItemElement[];
	role: string[];
	locus: null | string;
	scribe_type: string[];
	function: Function[];
	locus_layout: string[];
}

export interface HandRoleHand {
	hit_id: string;
	label: string;
	date: DatedElement[];
}

export interface MSItemElement {
	id: number;
	hit_id: string;
	title: string[];
	author: string[];
	locus: string;
}

export type IDEnum = "TBD";

export interface Work {
	hit_id: string;
	title: string;
	gnd_url: string;
	note: string;
	author: AuthorElement[];
	bibliography: any[];
	source_text: TitleWorkElement[];
	note_source: NoteSource;
	genre: Genre[];
	ms_transmission: MSTransmission[];
	prev: Next;
	next: Next;
}

export interface Genre {
	value: string;
	main_genre: string[];
}

export interface MSTransmission {
	hit_id: string;
	manuscript: ManuscriptElement[];
	function: Function[];
	commented_msitem: CommentedMSItem[];
	locus: string;
	orig_date: OrigPlaceElement[];
	orig_place: OrigPlaceElement[];
	decoration: string[];
	annotation_date: OrigPlaceElement[];
	annotation_typ: string[];
	role?: string;
}
