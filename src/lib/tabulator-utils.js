import { JSONPath } from "jsonpath-plus";


export function jsonpathLookup(value, data, type, params, component) {
  const path = params.path;
  const separator = params.separator || ", ";
  const reverse = params.reverse || false;
  const result = JSONPath({path: path, json: value});
  if (reverse){
    return result.reverse().join(separator)
  } else {
    return result.join(separator)
  }
  
}
/* for several paths from one field joined in one column */
export function jsonpathsLookup(value, data, type, params, component) {
  const paths = params.paths;  // Assume `paths` is an array
  const separator = params.separator || ", ";
  const reverse = params.reverse || false;
  
  // Collect results from each path
  let allResults = paths.flatMap(path => JSONPath({ path: path, json: value }));

  // Optionally reverse the results and join them
  if (reverse) {
    allResults = allResults.reverse();
  }
  
  return allResults.join(separator);
}

/* for several paths from one field joined in one column */
export function jsonpathsDistinctLookup(value, data, type, params, component) {
  const paths = params.paths;  // Assume `paths` is an array
  const separator = params.separator || ", ";
  const reverse = params.reverse || false;
  
  // Collect results from each path
  let allResults = [...new Set(paths.flatMap(path => JSONPath({ path: path, json: value })))];

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

// To get the century of not_before not_after dates
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
}


export function dateRangeFilter(headerValue, rowValue, rowData, filterParams) {
  console.log("Filter Invoked with Value:", headerValue);
  console.log("Row Value:", JSON.stringify(rowValue, null, 2));

  if (!headerValue || isNaN(headerValue)) {
    return true; // Allow all rows if the filter is empty or invalid
  }

  const filterYear = parseInt(headerValue, 10);

  let startYears = [];
  let endYears = [];

  // rowValue is a string (e.g., "821-930")
  if (typeof rowValue === 'string' && rowValue.includes('-')) {
    const [start, end] = rowValue.split('-').map(Number);
    startYears = [start];
    endYears = [end];
  }

  if (startYears.length === 0 || endYears.length === 0) {
    console.warn("No start or end years found for this row:", rowValue);
  }

  // Check if filterYear is within any range
  return startYears.some((start, index) => {
    const end = endYears[index];
    return filterYear >= start && filterYear <= end;
  });
}



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