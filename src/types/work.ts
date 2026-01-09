import type { Author, TitleWork, NavigationLink } from "./shared";
import type { MsItem } from "./msitem";

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
