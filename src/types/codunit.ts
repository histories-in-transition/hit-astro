import type {
	NavigationLink,
	OrigDate,
	OrigPlace,
	Authority,
	ProvenanceItem,
	Place,
	DateInfo,
	TitleWork,
} from "@/types/shared.ts";
export interface Codunit {
	id: number;
	hit_id: string;
	value: string;
	number: string;
	notes: string;
	locus: string;
	material: string;
	material_spec: string;
	catchwords: string;
	quiremarks: string;
	heigth: string;
	width: string;
	written_height: string;
	written_width: string;
	columns: string[];
	lines_number: string;
	ruling: string;
	decoration: string;
	basic_structure: string[];
	prov_place: ProvPlace[];
	content: ContentUnit[];
	manuscript: { id: number; value: string }[];
	prev?: NavigationLink;
	next?: NavigationLink;
}

export interface ContentUnit {
	id?: number;
	hit_id: string;
	label: string;
	language: Form[];
	locus: string;
	facs_url: string;
	incipit?: string;
	explicit?: string;
	rubric?: string;
	final_rubric?: string;
	title_work?: TitleWork[];
	title_note?: string;
	version: any[];
	siglum?: string;
	text_modification?: any[];
	interpolations?: any[];
	bibl?: any[];
	commented_msitem?: any[];
	decoration?: any[];
	form?: Form[];
	form_note?: string;
	note?: string;
	orig_date?: OrigDate[];
	orig_place?: OrigPlace[];
	provenance?: ProvenanceItem[];
}

export interface Form {
	value: string;
}
export interface ProvPlace {
	hit_id: string;
	places: Place[];
	from: DateInfo[];
	till: DateInfo[];
	uncertain_from: boolean;
	uncertain_till: boolean;
	type: string;
	authority: Authority[];
	page: string;
}
