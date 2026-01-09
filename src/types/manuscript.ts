import type { Place, NavigationLink, OrigDate, Bibliography, ProvenanceItem } from "./shared";
import type { Stratum } from "./stratum";
import type { MsItem } from "./msitem";
import type { Hand } from "./hand";

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

interface Library {
	id: number;
	hit_id: string;
	abbreviation: string;
	library_full?: string;
	place?: Place[];
}

interface BindingDate {
	id: number;
	value: string;
	range?: string;
	not_before?: string;
	not_after?: string;
	century?: string[];
}

interface Provenance {
	id: number;
	hit_id: string;
	abbreviation: string;
	library_full?: string;
	place?: Place[];
	wikidata?: string;
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
