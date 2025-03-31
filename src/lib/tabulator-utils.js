import { JSONPath } from "jsonpath-plus";

export function jsonpathLookup(value, data, type, params, component) {
	const path = params.path;
	const separator = params.separator || ", ";
	const reverse = params.reverse || false;
	const result = JSONPath({ path: path, json: value });
	if (reverse) {
		return result.reverse().join(separator);
	} else {
		return result.join(separator);
	}
}
/* for several paths from one field joined in one column */
export function jsonpathsLookup(value, data, type, params, component) {
	const paths = params.paths; // Assume `paths` is an array
	const separator = params.separator || ", ";
	const reverse = params.reverse || false;

	// Collect results from each path
	let allResults = paths.flatMap((path) => JSONPath({ path: path, json: value }));

	// Optionally reverse the results and join them
	if (reverse) {
		allResults = allResults.reverse();
	}

	return allResults.join(separator);
}

export function jsonpathDistinctLookup(value, data, type, params, component) {
	const path = params.path;
	const separator = params.separator || ", ";
	const reverse = params.reverse || false;

	// Ensure value is an array (default to empty array if undefined)
	if (!Array.isArray(value)) {
		console.warn("jsonpathDistinctLookup received invalid data:", value);
		return "";
	}

	// Step 1: Use JSONPath to retrieve values
	const result = JSONPath({ path: path, json: value });

	// Step 2: Extract distinct values
	const distinctValues = [...new Set(result)];

	// Step 3: Apply reverse ordering if specified
	if (reverse) {
		distinctValues.reverse();
	}

	// Step 4: Join the distinct values with the separator
	return distinctValues.join(separator);
}
/* for several paths from one field joined in one column */
export function jsonpathsDistinctLookup(value, data, type, params, component) {
	const paths = params.paths; // Assume `paths` is an array
	const separator = params.separator || ", ";
	const reverse = params.reverse || false;

	// Collect results from each path
	let allResults = [...new Set(paths.flatMap((path) => JSONPath({ path: path, json: value })))];

	// Optionally reverse the results and join them
	if (reverse) {
		allResults = allResults.reverse();
	}

	return allResults.join(separator);
}

/* for several years ranges in msItem tabulator */
export function jsonpathsDistinctRanges(value, data, type, params, component) {
	const paths = params.paths; // Array of JSONPath queries
	const separator = params.separator || ", ";

	// Collect all yearRange results from each path
	let yearRanges = paths
		.flatMap((path) =>
			JSONPath({ path: path, json: value }).map((range) => {
				if (range.start != null && range.end != null) {
					return `${range.start}-${range.end}`; // Format as "start-end"
				}
				return null; // Skip invalid ranges
			}),
		)
		.filter(Boolean); // Remove null values

	// Return distinct year ranges joined by the separator
	return [...new Set(yearRanges)].join(separator);
}
// for original nested date range with not_before, not_after
export function jsonpathsDateRangles(value, data, type, params, component) {
	const separator = params.separator || ", ";

	// Extract year ranges from the `dated` arrays in `hands_dated`
	const yearRanges = value
		.flatMap((hand) => hand.dated) // Flatten the `dated` arrays
		.map((item) => {
			if (item.not_before && item.not_after) {
				const start = new Date(item.not_before).getFullYear(); // Extract start year
				const end = new Date(item.not_after).getFullYear(); // Extract end year
				return `${start}-${end}`; // Format as "start-end"
			}
			return null; // Skip invalid entries
		})
		.filter(Boolean); // Remove null values

	// Ensure distinct values and join them with the separator
	return [...new Set(yearRanges)].join(separator);
}

export function jsonpathsDateRanges(value, data, type, params, component) {
	const paths = params.paths; // Array of JSONPath queries
	const separator = params.separator || ", ";

	// Collect all year ranges from each path
	let yearRanges = paths
		.flatMap((path) =>
			JSONPath({ path: path, json: value }).map((item) => {
				if (item.not_before && item.not_after) {
					const start = new Date(item.not_before).getFullYear(); // Extract start year
					const end = new Date(item.not_after).getFullYear(); // Extract end year
					return `${start}-${end}`; // Format as "start-end"
				}
				return null; // Skip invalid ranges
			}),
		)
		.filter(Boolean); // Remove null values

	// Return distinct year ranges joined by the separator
	return [...new Set(yearRanges)].join(separator);
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
export function dateRangeFilter(headerValue, rowValue, rowData, filterParams) {
	// Allow all rows if the filter is empty or invalid
	if (!headerValue || isNaN(headerValue)) {
		return true;
	}

	const filterYear = parseInt(headerValue, 10);

	// Ensure rowValue is a string and process multiple ranges (e.g., "821-930, 950-999")
	if (typeof rowValue === "string") {
		const ranges = rowValue.split(",").map((range) => range.trim()); // Split and trim multiple ranges

		// Iterate over all ranges and check if filterYear falls within any of them
		return ranges.some((range) => {
			const [start, end] = range.split("-").map(Number); // Parse start and end years
			if (!isNaN(start) && !isNaN(end)) {
				return filterYear >= start && filterYear <= end;
			}
			return false; // Skip invalid ranges
		});
	}

	console.warn("Row value is not a valid string:", rowValue);
	return false; // Filter out rows with invalid rowValue
}
