type DateRangeObject = {
	range?: string; // e.g. "800-850"
	value?: string; // e.g. "saec. IX"
};

/**
 * Minimal Tabulator cell interface (avoids importing full Tabulator types)
 */
type TabulatorCell = {
	getValue(): unknown;
};

// function for tabulator accessor
// Ensures filtering and sorting dates correctly
export function dateAccessor(value: unknown): DateRangeObject[] {
	if (!Array.isArray(value)) return [];

	return value.map(
		(dateObj): DateRangeObject => ({
			range: typeof dateObj?.range === "string" ? dateObj.range : "",
		}),
	);
}
// function for tabulator formatter
// Formatting the displayed values
export function dateFormatter(cell: TabulatorCell): string {
	const value = cell.getValue();

	if (!Array.isArray(value)) {
		console.warn("dateFormatter: value is not an array", value);
		return "";
	}

	return value
		.map((dateObj: DateRangeObject) => (typeof dateObj.value === "string" ? dateObj.value : ""))
		.filter(Boolean)
		.join(" | ");
}

export function dateRangeFilter(
	headerValue: string,
	rowValue: unknown,
	rowData: unknown,
	filterParams: unknown,
	accessor?: (value: unknown, data?: unknown) => unknown,
): boolean {
	// Allow all rows if filter is empty or invalid
	if (
		!headerValue ||
		(!/^\d+$/.test(headerValue) &&
			!/^vor \d+$/.test(headerValue) &&
			!/^nach \d+$/.test(headerValue))
	) {
		return true;
	}

	const match = headerValue.match(/^(vor|nach)?\s?(\d+)$/);
	if (!match) return true;

	const operator = match[1] as "vor" | "nach" | undefined;
	const filterYear = Number(match[2]);

	if (Number.isNaN(filterYear)) return true;

	// Apply accessor if provided
	const processedRowValue = accessor ? accessor(rowValue, rowData) : rowValue;

	if (!Array.isArray(processedRowValue)) {
		console.warn("dateRangeFilter: non-array row value", processedRowValue);
		return false;
	}

	return processedRowValue.some((dateObj: DateRangeObject) => {
		if (typeof dateObj.range !== "string") return false;

		const [start, end] = dateObj.range.split("-").map(Number);

		if (Number.isNaN(start) || Number.isNaN(end)) return false;

		switch (operator) {
			case "vor":
				return start < filterYear; // terminus ante quem
			case "nach":
				return end > filterYear; // terminus post quem
			default:
				return filterYear >= start && filterYear <= end;
		}
	});
}
