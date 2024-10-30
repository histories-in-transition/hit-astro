import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.css";
import "tabulator-tables/dist/js/tabulator.js";

export async function build_table(table_cfg, json_url) {
  try {
    console.log("loading table");

    // Fetch data from the provided JSON URL
    const response = await fetch(json_url);
    const tabulator_data = await response.json();

    // Assign the fetched data to Tabulator's configuration and initialize the table
    table_cfg.tabulator_cfg.data = tabulator_data;
    const table = new Tabulator(
      table_cfg.table_div_html_id,
      table_cfg.tabulator_cfg
    );

    console.log("made table");
  } catch (error) {
    console.error(error);
  }
}

// Helper function to create an HTML link
function createHtmlLink(displayText, url) {
  return `<a href='${url}'>${displayText}</a>`;
}

// Helper function to wrap items in an HTML list
function createHtmlList(items) {
  const listItems = items
    .map((item) => `<li>${String(item)}</li>`) // Ensure each item is safely converted to a string
    .join("");

  return `<ul>${listItems}</ul>`;
}

// FUnction to generate links in tabulator cells

export function build_linklist_cell(table, cell) {
  // Retrieve the cell values, expected to be an array of [displayText, url] pairs
  const cellValues = cell.getValue();

  // Return an empty string if there are no values
  if (cellValues.length === 0) {
    return "";
  }

  // Build an array of HTML links using the helper function
  const links = cellValues.map((cellValue) =>
    createHtmlLink(cellValue[0], cellValue[1])
  );

  // Convert the links array into an HTML list using the helper function
  return createHtmlList(links);
}
