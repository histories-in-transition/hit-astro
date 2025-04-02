import { JSONPath } from "jsonpath-plus";
export function jsonpathFlexibleLookup(value, data, type, params, component) {
	const paths = Array.isArray(params.path) ? params.path : [params.path]; // Ensure paths is always an array
	const separator = params.separator || ", ";
	const reverse = params.reverse || false;

	// Collect results from each path
	let allResults = paths.flatMap((path) => JSONPath({ path: path, json: value }));

	// Optionally reverse the results
	if (reverse) {
		allResults = allResults.reverse();
	}

	// Join the results with the separator
	return allResults.join(separator);
}

/* for single or several paths from one field joined in one column */
export function jsonpathsDistinctLookup(value, data, type, params, component) {
	const paths = Array.isArray(params.path) ? params.path : [params.path]; // Ensure paths is always an array
	const separator = params.separator || ", ";
	const reverse = params.reverse || false;

	// Collect results from each path using JSONPath
	let allResults = paths.flatMap((path) => JSONPath({ path: path, json: value }));

	// Extract distinct values
	const distinctValues = [...new Set(allResults)];

	// Optionally reverse the results
	if (reverse) {
		distinctValues.reverse();
	}

	// Join the distinct values with the separator
	return distinctValues.join(separator);
}

/* // To get the century of not_before not_after dates
export function jsonpathGetCentury(value, data, type, params, component) {
  const paths = params.paths;
  const separator = params.separator || ", ";
  
  // Helper function to calculate the century
  const getCentury = (year) => {
    if (!year) return "N/A"; // Handle null or undefined dates
    // get the century  by dividing the year by 100 and round it to the nearest integer 
    // need to add 1 since they use formats 800-899 for 9th c.
  const century = Math.ceil((parseInt(year) + 1) / 100);
  return `${century} Jh.`;
};

// Collect results from each path and convert to centuries
  let allResults = paths.flatMap(path => {
  return JSONPath({ path: path, json: value }).map(date => {
    const year = date ? date.split("-")[0] : null;
    return getCentury(year);
  });
  });

  return [...new Set(allResults)].join(separator); // Remove duplicates
} */

export function dateRangeFilter(headerValue, rowValue, rowData, filterParams, accessor) {
	// Allow all rows if the filter is empty or invalid
	if (!headerValue || isNaN(headerValue)) {
		return true;
	}

	const filterYear = parseInt(headerValue, 10);

	// Use the accessor to preprocess the rowValue if provided
	const processedRowValue = accessor ? accessor(rowValue, rowData) : rowValue;

	// Ensure processedRowValue is a string and process multiple ranges (e.g., "821-930, 950-999")
	if (typeof processedRowValue === "string") {
		const ranges = processedRowValue.split(",").map((range) => range.trim());

		// Iterate over all ranges and check if filterYear falls within any of them
		return ranges.some((range) => {
			const [start, end] = range.split("-").map(Number);
			if (!isNaN(start) && !isNaN(end)) {
				return filterYear >= start && filterYear <= end;
			}
			return false; // Skip invalid ranges
		});
	}

	console.warn("Row value is not a valid string:", processedRowValue);
	return false; // Filter out rows with invalid rowValue
}
