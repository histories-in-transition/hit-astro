// for the strata graph we need numbers for the x axis, comeing from the locus of hand_roles
// must converts folio notation ("1r-8r, 86rv, Ir-IIv")
//
//   1r -> 0,  1v -> 1,  2r -> 2,  2v -> 3,  ...  n r -> 2*(n-1),  n v -> 2*(n-1)+1
//
// Roman folios (flyleaves) come BEFORE folio 1, so they get NEGATIVE numbers.
// They are counted backwards from 1r, so the last roman side sits right next to 1r:
//
//   with romanCount = 2:   Ir -> -4,  Iv -> -3,  IIr -> -2,  IIv -> -1,  1r -> 0
//
// romanCount is the highest roman folio that occurs ANYWHERE in the manuscript.
// That is why it has to be computed first (maxRomanFolio) and then passed in.
//
// Writing convention (important, because "Iv" is ambiguous otherwise):
//   - roman numerals are UPPERCASE, the side is lowercase:  "Iv" = folio I, verso
//   - "IV" (both uppercase) is the roman number 4, whole folio

export interface LeafSegment {
	start: number;
	end: number;
}

// ---------------------------------------------------------------------------
// Roman numeral helpers
// ---------------------------------------------------------------------------

const ROMAN_TABLE: [string, number][] = [
	["M", 1000],
	["CM", 900],
	["D", 500],
	["CD", 400],
	["C", 100],
	["XC", 90],
	["L", 50],
	["XL", 40],
	["X", 10],
	["IX", 9],
	["V", 5],
	["IV", 4],
	["I", 1],
];

export function numberToRoman(n: number): string {
	let rest = n;
	let result = "";
	for (const [symbol, value] of ROMAN_TABLE) {
		while (rest >= value) {
			result += symbol;
			rest -= value;
		}
	}
	return result;
}

function romanToNumber(text: string): number | undefined {
	const single: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
	let total = 0;

	for (let i = 0; i < text.length; i++) {
		const value = single[text[i]];
		const next = single[text[i + 1]];
		// A smaller symbol in front of a bigger one is subtracted (IV = 4).
		total += next !== undefined && next > value ? -value : value;
	}

	// Round trip check rejects nonsense like "IIII" or "VX".
	return total > 0 && numberToRoman(total) === text ? total : undefined;
}

// ---------------------------------------------------------------------------
// Step 1: read the text into a raw structure (no numbers on the axis yet)
// ---------------------------------------------------------------------------

interface Folio {
	roman: boolean;
	number: number; // 1-based: "IIr" -> { roman: true, number: 2 }
}

interface RawSegment {
	start: Folio;
	startSide: 0 | 1;
	end: Folio;
	endSide: 0 | 1;
}

// <folio><side?> [ - <folio?><side?> ]   where folio = digits OR uppercase roman numeral
// Handles: "9r", "86rv", "1r-8r", "9v-82r", "82r-v", "1-8", "12", "Ir", "Iv", "Ir-IIv", "IV"
// No "i" flag on purpose: the case tells roman numerals (uppercase) from sides (lowercase).
const PART = /^(\d+|[IVXLCDM]+)\s*(rv|vr|r|v)?\s*(?:([-–—])\s*(\d+|[IVXLCDM]*)\s*(rv|vr|r|v)?)?$/;

function readFolio(token: string): Folio | undefined {
	if (/^\d/.test(token)) return { roman: false, number: Number(token) };
	const n = romanToNumber(token);
	return n === undefined ? undefined : { roman: true, number: n };
}

function parseRaw(locus: string | undefined | null): RawSegment[] {
	if (!locus) return [];

	const segments: RawSegment[] = [];

	const cleaned = locus
		// Remove notes in brackets, e.g. "9v-82r (Interpolationen)".
		.replace(/\([^)]*\)/g, "")
		// Be forgiving with uppercase sides directly after digits: "12R" -> "12r".
		.replace(
			/(\d)\s*([RV]{1,2})(?![A-Za-z])/g,
			(_m, digit: string, side: string) => digit + side.toLowerCase(),
		);

	for (const raw of cleaned.split(/[;,]/)) {
		const match = raw.trim().match(PART);
		if (!match) continue; // unknown notation ("Vorsatz", "*", ...) is skipped

		const [, startText, startSideText, hyphen, endText, endSideText] = match;

		const start = readFolio(startText);
		if (!start) continue;

		// "86rv" (no hyphen) and "82r-v" (no folio after the hyphen) stay on the same folio.
		const end = hyphen && endText ? readFolio(endText) : start;
		if (!end) continue;

		// "v" starts on the verso; "r", "rv" or nothing start on the recto.
		const startSide: 0 | 1 = startSideText === "v" ? 1 : 0;

		// "86rv" (no hyphen) means both sides, so the end uses the same side text.
		const endSideToken = hyphen ? endSideText : startSideText;
		// No side or anything containing "v" ends on the verso; only a plain "r" ends on the recto.
		const endSide: 0 | 1 = endSideToken === "r" ? 0 : 1;

		segments.push({ start, startSide, end, endSide });
	}

	return segments;
}

// ---------------------------------------------------------------------------
// Step 2: public functions
// ---------------------------------------------------------------------------

/** Highest roman folio found in all given locus strings (0 if there is none). */
export function maxRomanFolio(loci: (string | undefined | null)[]): number {
	let max = 0;
	for (const locus of loci) {
		for (const seg of parseRaw(locus)) {
			if (seg.start.roman) max = Math.max(max, seg.start.number);
			if (seg.end.roman) max = Math.max(max, seg.end.number);
		}
	}
	return max;
}

function leaf(folio: Folio, side: 0 | 1, romanCount: number): number {
	const position = 2 * (folio.number - 1) + side;
	return folio.roman ? position - 2 * romanCount : position;
}

export function parseLocus(locus: string | undefined | null, romanCount = 0): LeafSegment[] {
	return parseRaw(locus)
		.map((seg) => {
			const a = leaf(seg.start, seg.startSide, romanCount);
			const b = leaf(seg.end, seg.endSide, romanCount);
			return { start: Math.min(a, b), end: Math.max(a, b) };
		})
		.sort((s, t) => s.start - t.start);
}

/** 0 -> "1r", 1 -> "1v", 2 -> "2r" ...   and negative numbers -> "Ir", "Iv", "IIr" ... */
export function leafLabel(leafNumber: number, romanCount = 0): string {
	if (leafNumber >= 0) {
		return `${Math.floor(leafNumber / 2) + 1}${leafNumber % 2 === 0 ? "r" : "v"}`;
	}

	// Shift back to a 0-based position inside the roman block.
	const index = leafNumber + 2 * romanCount;
	if (index < 0) return "";
	return `${numberToRoman(Math.floor(index / 2) + 1)}${index % 2 === 0 ? "r" : "v"}`;
}
