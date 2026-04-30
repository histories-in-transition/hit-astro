export function parseCentury(c: string): number {
	const m = c.match(/\d+/);
	return m ? parseInt(m[0], 10) : Infinity;
}

const PALETTE = [
	"#E74D1E", // orange
	"#FF9F1C", // amber
	"#2E658C", // baltic blue
	"#1D0200", // dark brown
	"#6FA008", // lime green
	"#221627", // violet
	"#651B52", // deep purple
	"#FFF12F", // bright lemon
];
export function buildGenreColorMap(genres: string[]) {
	const map = new Map<string, string>();

	genres.forEach((genre, i) => {
		map.set(genre, PALETTE[i % PALETTE.length]);
	});

	return map;
}
