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
