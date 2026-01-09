import type {
	Place,
	NavigationLink,
	OrigDate,
	TitleWork,
	ShortRef,
	OrigPlace,
	ProvenanceItem,
	Bibliography,
} from "./shared";
import type { MsItemHand } from "./hand";

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
interface CommentedMsItem {
	id: number;
	value?: string;
	title?: string;
	hit_id: string;
}
