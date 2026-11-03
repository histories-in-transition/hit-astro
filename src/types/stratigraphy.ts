import type { LeafSegment } from "@/lib/stratigraphy-visualisation/helpers";

export interface StratigraphyMsItem {
	hit_id: string;
	title_work: [
		{
			hit_id: string;
			title: string;
		},
	];
	/** Original notation, e.g. "1r-8r" */
	locus: string;
	/** Overall start/end as side numbers (see lib/folio.ts) */
	leafStart?: number;
	leafEnd?: number;
}

export interface StratigraphyHandRole {
	hit_id: string;
	stratum: number | string;

	/** Short hand name used as the label on the bar, e.g. "H. 3" */
	hand: string;
	/** Full hand label, e.g. "BSB, Clm. 6388_H. 3" */
	handLabel: string;

	dateStart?: number;
	dateEnd?: number;
	/** Human readable date, e.g. "10 Jh., zweite Hälfte" */
	dateLabel?: string;

	/** Original notation of the hand role, e.g. "1r-8r, 86rv" */
	locus: string;
	/** The parsed locus: one entry per separate stretch of folios */
	segments: LeafSegment[];

	roles: string[];
	functions: string[];
	scribeTypes: string[];
	msItems: { hit_id: string; title: string; locus: string }[];
}

export interface StratigraphyData {
	msitems: StratigraphyMsItem[];
	handRoles: StratigraphyHandRole[];
	/** Highest roman folio in the manuscript; needed to label the axis (see lib/folio.ts) */
	romanFolioCount: number;
}
