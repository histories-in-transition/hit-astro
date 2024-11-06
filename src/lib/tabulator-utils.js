function mutateSelectField(value, data, type, params, component) {
  let output = value
    .map((item) => {
      return `${item.value}`;
    })
    .join(" / ");
  return `${output}`;
}

function mutateSingleSelectField(value, data, type, params, component) {
  let output = value.value;
  return `${output}`;
}

export function mutateM2mField(value, data, type, params, component) {
  let labelField = params.labelField;
  let names = [];

  value.forEach((item) => {
    // Add the main name
    if (item[labelField]) {
      names.push(item[labelField]);
    }
  });
  return names.join(" ");
}

export function mutateNestedM2mField(value, data, type, params, component) {
  const labelField = params.labelField; // e.g., "main_genre" or "manuscript"
  const subField = params.labelSubField; // e.g., "genre" or "shelfmark"
  let names = [];

  // Ensure 'value' is an array, else log a warning and return an empty string
  if (!Array.isArray(value)) {
    console.warn("Expected an array in field:", value);
    return "";
  }

  // Iterate over each item in the main array (e.g., 'genre' or 'related__ms_items')
  value.forEach((item) => {
    // Check if the labelField (e.g., 'main_genre' or 'manuscript') exists and is an array
    if (Array.isArray(item[labelField]) && item[labelField].length > 0) {
      item[labelField].forEach((nestedItem) => {
        // Check if nestedItem has the specified subField to display (e.g., 'genre' or 'shelfmark')
        if (nestedItem && nestedItem[subField]) {
          names.push(nestedItem[subField]);
        }
      });
    }
  });

  // Return the joined names or a placeholder if none were found
  return names.length > 0 ? names.join(", ") : "N/D";
}

export function mutate2NestedM2mField(value, data, type, params, component) {
  const labelField = params.labelField; // e.g., "main_genre" or "manuscript"
  const subField = params.labelSubField; // e.g., "genre" or "shelfmark"
  const subSubField = params.labelSubSubField; // e.g., "value" within "shelfmark"
  let names = [];

  // Ensure 'value' is an array, else log a warning and return an empty string
  if (!Array.isArray(value)) {
    console.warn("Expected an array in field:", value);
    return "";
  }

  // Iterate over each item in the main array (e.g., 'genre' or 'related__ms_items')
  value.forEach((item) => {
    // Check if labelField (e.g., 'main_genre' or 'manuscript') exists and is an array
    if (Array.isArray(item[labelField]) && item[labelField].length > 0) {
      item[labelField].forEach((nestedItem) => {
        // Check if nestedItem contains subField (e.g., 'genre' or 'shelfmark') as an array
        if (
          Array.isArray(nestedItem[subField]) &&
          nestedItem[subField].length > 0
        ) {
          nestedItem[subField].forEach((subNestedItem) => {
            // Access subSubField (e.g., 'value' within 'shelfmark')
            if (subNestedItem && subSubField && subNestedItem[subSubField]) {
              names.push(subNestedItem[subSubField]);
            }
          });
        }
      });
    }
  });

  // Return the joined names or a placeholder if none were found
  return names.length > 0 ? names.join(", ") : "N/A";
}
