import type {
	DateInfo,
	Place,
	NavigationLink,
	Value,
	ShortRef,
	OrigDate,
	OrigPlace,
	ProvenanceItem,
	TitleWork,
	Author,
} from "./shared";
import type { Hand } from "./hand";

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
