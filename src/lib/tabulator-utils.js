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