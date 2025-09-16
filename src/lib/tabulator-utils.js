import { JSONPath } from "jsonpath-plus";

// function for tabulator accessor  Ensures filtering and sorting dates correctly
export function dateAccessor(value) {
	if (!value || !Array.isArray(value)) return "";
	return value.map((dateObj) => dateObj.range || "").join(", ");
}

//  function for tabulator formatter - Formatting the displayed values
export function dateFormatter(cell) {
	const value = cell.getValue();
	if (!value || !Array.isArray(value)) {
		console.log("Returning 'not array'");
		return "not array";
	}

	const result = value
		.map((dateObj) => {
			return dateObj.value || "";
		})
		.join(" | ");
	return result;
}

// Function to get the value of a specific path or several paths from a JSON object
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

//function for array with unique objects using Map
// returns an array of unique objects based on the 'id' property
// used to pass the data to accessor
export function jsonpathsDistinctMapLookup(value, data, type, params, component) {
	const paths = Array.isArray(params.path) ? params.path : [params.path];

	// Use a Map to ensure uniqueness based on 'range'
	const uniqueEntries = new Map();

	paths.forEach((path) => {
		const results = JSONPath({ path: path, json: value });

		results.forEach((obj) => {
			if (obj && typeof obj === "object" && obj.id) {
				uniqueEntries.set(obj.id, obj); // Store by 'id' to avoid duplicates
			}
		});
	});

	return Array.from(uniqueEntries.values()); // Convert back to array
}

// simple function to get distinct string values

export function distinctStringMutator(value, data, type, params, component) {
	const paths = Array.isArray(params.path) ? params.path : [params.path];
	const separator = params?.separator || ", ";

	const distinctValues = new Set();

	paths.forEach((path) => {
		const results = JSONPath({ path, json: value });
		results.forEach((result) => {
			if (typeof result === "string" && result.trim()) {
				distinctValues.add(result.trim());
			}
		});
	});

	return Array.from(distinctValues).join(separator);
}

export function dateRangeFilter(headerValue, rowValue, rowData, filterParams, accessor) {
	// Allow all rows if the filter is empty or invalid
	if (
		!headerValue ||
		(!/^\d+$/.test(headerValue) &&
			!/^vor \d+$/.test(headerValue) &&
			!/^nach \d+$/.test(headerValue))
	) {
		return true;
	}

	// Determine operator and filter year from input
	const operatorMatch = headerValue.match(/^(vor|nach)?\s?(\d+)$/);
	const operator = operatorMatch?.[1] || null;
	const filterYear = parseInt(operatorMatch?.[2], 10);

	// Use the accessor to preprocess the rowValue if provided
	const processedRowValue = accessor ? accessor(rowValue, rowData) : rowValue;

	// Ensure processedRowValue is an array of strings
	if (!Array.isArray(processedRowValue)) {
		console.warn("Unexpected non-array value in date filtering:", processedRowValue);
		return false;
	}

	const ranges = processedRowValue.map((dateObj) => dateObj.range || "");

	// Iterate over all ranges and apply the appropriate filtering logic
	return ranges.some((range) => {
		const [start, end] = range.split("-").map(Number);
		if (!isNaN(start) && !isNaN(end)) {
			if (operator === "vor") {
				return start < filterYear; // terminus ante quem using end
			} else if (operator === "nach") {
				return end > filterYear; // terminus post quem using start
			} else {
				return filterYear >= start && filterYear <= end; // Default range check (inclusive)
			}
		}
		return false; // Skip invalid ranges
	});
}

/* / OUTDATED function for header filtering with one input
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
} */
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

/* NOT FOR NOW - HEADER FOR DATE WITH TWO INPUT FIELDS 'FROM' AND 'TO'
export function dateRangeHeaderFilter(cell, onRendered, success, cancel, editorParams) {
  // Create a container for the inputs
  const container = document.createElement("span");

  // Create and style start and end input fields
  const start = document.createElement("input");
  start.type = "number";
  start.placeholder = "Start Year";
  start.style.padding = "4px";
  start.style.width = "50%";
  start.style.boxSizing = "border-box";

  const end = document.createElement("input");
  end.type = "number";
  end.placeholder = "End Year";
  end.style.padding = "4px";
  end.style.width = "50%";
  end.style.boxSizing = "border-box";

  container.appendChild(start);
  container.appendChild(end);

  // Helper function to build the date range object
  const buildDateRange = () => ({
    start: parseInt(start.value, 10) || null,
    end: parseInt(end.value, 10) || null,
  });

  // Submit new value on blur or change
  [start, end].forEach(input => {
    input.addEventListener("change", () => success(buildDateRange()));
    input.addEventListener("blur", () => success(buildDateRange()));
  });

  // Submit new value on Enter, cancel on Esc
  container.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      success(buildDateRange());
    } else if (e.key === "Escape") {
      cancel();
    }
  });

  return container;
}; 


export function dateRangeFilter(headerValue, rowValue, rowData, filterParams) {
  if (!headerValue || (!headerValue.start && !headerValue.end)) {
    return true; // If no filter is set, show all rows
  }

  const [startYear, endYear] = rowValue.split("-").map(Number); // Assuming "821-930" format

  const filterStart = headerValue.start || -Infinity; // Use -Infinity if no start year
  const filterEnd = headerValue.end || Infinity; // Use Infinity if no end year

  // Check if the row range overlaps with the filter range
  return !(startYear > filterEnd || endYear < filterStart);
}
*/
