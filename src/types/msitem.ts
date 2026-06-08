import type {
	Place,
	NavigationLink,
	OrigDate,
	TitleWork,
	ShortRef,
	OrigPlace,
	ProvenanceItem,
	Bibliography,
	Value,
} from "./shared";
import type { MsItemHand } from "./hand";

//used in work
export interface MsItemBase {
	hit_id: string;
	manuscript: ShortRef[];
	commented_msitem: CommentedMsItem[];
	locus: string;
	orig_date: OrigDate[];
	orig_place: OrigPlace[];
	provenance: ProvenanceItem[];
	decoration: Value[];
	annotation_date: OrigDate[];
	annotation_place: Place[];
	annotation_typ: string[];
	form: Value[];
	text_modification: string[];
	version: Value[];
}

export interface MsItem {
	id?: number;
	hit_id: string;
	label?: string;
	view_label?: string;
	manuscript?: ShortRef[];
	joined_transmission?: joinedTransmission[];
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
	language: FormItem[];
	version: FormItem[];
	facs_url: string;
	annotation_typ?: string[];
	annotation_date?: OrigDate[];
	project?: string[];
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

interface joinedTransmission {
	id: number;
	title: string;
	hit_id: string;
}
