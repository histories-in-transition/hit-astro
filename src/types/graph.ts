export interface GraphData {
	nodes: Node[];
	edges: Edge[];
}

export interface Node {
	id: string;
	name: string;
	genre: string;
	value: number;
	msItems?: string[];
	degree?: number;
}

export interface Edge {
	source: string;
	target: string;
	value: number;
	mss: MSItem[];
	msitems: string[];
}

export interface MSItem {
	id: number;
	shelfmark: string;
	date: string;
	place: string;
}
