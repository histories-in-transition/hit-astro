import type {
	Place,
	NavigationLink,
	TitleWork,
	OrigDate,
	DateInfo,
	ShortRef,
	Value,
	OrigPlace,
	Authority,
} from "./shared";

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

export interface MsItemHand {
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
