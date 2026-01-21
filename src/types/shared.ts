export interface NavigationLink {
	id: string;
	label: string;
}

export interface Place {
	id: number;
	value: string;
	geonames_url?: string;
	hit_id: string;
	lat?: string;
	long?: string;
}

export interface Authority {
	hit_id: string;
	citation?: string;
	link?: string;
	author?: string;
	title?: string;
}

export interface DateInfo {
	id: number;
	value: string;
	range?: string;
	not_before?: string;
	not_after?: string;
	century?: string[];
}
export interface ShortRef {
	id: number;
	value: string;
}

export interface Value {
	value: string;
}

export interface Place {
	id: number;
	value: string;
	geonames_url?: string;
	hit_id: string;
	lat?: string;
	long?: string;
}
export interface OrigPlace {
	id?: number;
	hit_id?: string;
	place: Place[];
	authority?: Authority[];
	page?: string;
}
export interface OrigDate {
	date?: DateInfo[];
	authority?: Authority[];
	page?: string;
	preferred_date?: boolean;
	id?: number;
	hit_id?: string;
}
export interface DateInfo {
	id: number;
	value: string;
	range?: string;
	not_before?: string;
	not_after?: string;
	century?: string[];
}
export interface Authority {
	hit_id: string;
	citation?: string;
	link?: string;
	author?: string;
	title?: string;
}
export interface ProvenanceItem {
	id?: number;
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

export interface TitleWork {
	id?: number;
	hit_id: string;
	title: string;
	author?: Author[];
	gnd_url?: string;
	note?: string;
	bibliography?: unknown[];
	source_text?: TitleWork[];
	mainGenre?: string[];
	subGenre?: string[];
	note_source?: string;
}

export interface Author {
	id: number;
	hit_id: string;
	name: string;
	gnd_url?: string;
}

export interface Bibliography {
	hit_id: string;
	citation: string;
	link: string;
	author: string;
	title: string; /* Currently empty array in JSON */
}
