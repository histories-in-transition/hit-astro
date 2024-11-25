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
