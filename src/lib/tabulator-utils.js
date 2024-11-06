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
  const labelField = params.labelField; // Should be "main_genre"
  let names = [];

  // Ensure 'value' is an array, else log a warning and return an empty string
  if (!Array.isArray(value)) {
    console.warn("Expected an array in 'genre' field, but got:", value);
    return "";
  }

  // Iterate over each item in 'genre' array
  value.forEach((item) => {
    // Check if 'main_genre' exists and is an array
    if (Array.isArray(item[labelField]) && item[labelField].length > 0) {
      item[labelField].forEach((nestedItem) => {
        // Check if nestedItem has a 'genre' field to display
        if (nestedItem && nestedItem.genre) {
          names.push(nestedItem.genre);
        }
      });
    }
  });

  // Return a placeholder if no main genres were found, otherwise join the names
  return names.length > 0 ? names.join(", ") : "N/D";
}
