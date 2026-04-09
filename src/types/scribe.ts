import type { Authority, Place, HandDate, Value, Author, NavigationLink } from "@/types/shared.ts";
export interface Scribe {
	id: number;
	hit_id: string;
	name: string;
	description: string;
	group: boolean;
	hands: HandForScribe[];
	date: HandDate[];
	places: PlacedElement[];
	author_entry: string[];
	prev: NavigationLink;
	next: NavigationLink;
}

export interface HandForScribe {
	id: number;
	hit_id: string;
	label: string;
	view_label: string;
	description: string;
	similar_hands: Ref[];
	nr_daniel: string;
	manuscript: Ref[];
	note: string;
	roles: string[];
	group: boolean;
	date: HandDate[];
	hand_roles: HandRole[];
	placed: PlacedElement[];
	texts: Text[];
	prev: NavigationLink;
	next: NavigationLink;
}

export interface HandRole {
	hit_id: string;
	content: Content[];
	scope: string;
	role: Value[];
	function: Value[];
	scribe_type: Value[];
	locus_layout: Value[];
	all_in_one: string;
}

export interface Content {
	hit_id: string;
	title_work: Text[];
	locus: string;
}

export interface Text {
	hit_id: string;
	title: string;
	author: Author[];
}

export interface Ref {
	id: number;
	value: string;
}

export interface PlacedElement {
	hit_id: string;
	authority: Authority[];
	page: string;
	place: Place[];
}
