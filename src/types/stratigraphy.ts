import type { locusArray } from "@/types";
export interface StratigraphyMsItem {
	hit_id: string;
	locusArray: locusArray[];
	pageStart?: number;
	pageEnd?: number;
	stratum_number: string;
	character: string[];
	title: string | string[];
}

export interface StratigraphyHandRole {
	hit_id: string;
	dateStart?: number;
	dateEnd?: number;
	msItemIds: string[];
	pageStart?: number;
	pageEnd?: number;
	stratum: string;
}

export interface StratigraphyData {
	msitems: StratigraphyMsItem[];
	handRoles: StratigraphyHandRole[];
}
