// Put event listener on the input - cll function searchTable
document.querySelectorAll("input").forEach((input, index) => {
  input.addEventListener("input", () => {
    searchTable(index, input.value);
  });
});

// Filter table based on input value -
function searchTable(columnIndex, searchValue) {
  const table = document.querySelector(".data-table");
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row) => {
    const cellValue = row.children[columnIndex].textContent.toLowerCase();
    if (cellValue.includes(searchValue.toLowerCase())) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
  // Reapply row striping to visible rows after search
  reapplyRowStriping(rows);
}

// Function to reapply row striping
function reapplyRowStriping(rows) {
  let visibleRowIndex = 0; // to store number of visible rows - the ones filtered after the search

  rows.forEach((row) => {
    // iterate through all rows
    if (row.style.display === "") {
      // if the row is visible , check the visibleRow Index which increments each time a visible row is found
      if (visibleRowIndex % 2 === 0) {
        // computes the remainder of the division by 2 - if 0 the number of the row is even - apply one color, else (% 2 = 1) apply the other color for odd
        row.style.backgroundColor = "#fef9f8"; // Color for even rows
      } else {
        row.style.backgroundColor = "#f5e8e6"; // Color for odd rows
      }
      visibleRowIndex++; // Increment visible row counter with every loop; by the first visible row index is 0, by the next 1 etc.
    }
  });
}

// Function to add highlight when hovered with mouse
const tableRows = document.querySelectorAll("tbody tr");
tableRows.forEach((row) => {
  row.addEventListener("mouseenter", () => {
    row.style.backgroundColor = "#d6bbb2";
    row.style.color = "black";
  });
  row.addEventListener("mouseleave", () => {
    row.style.backgroundColor = "";
    row.style.color = "";
  });
});

// Function for download button on table

document.getElementById("download-btn").addEventListener("click", function () {
  // Function to convert table to CSV
  function tableToCSV() {
    const rows = document.querySelectorAll(".data-table tr");
    let csvContent = "";

    rows.forEach((row) => {
      const cols = row.querySelectorAll("td, th");
      let rowContent = Array.from(cols)
        .map((col) => col.innerText.replace(/,/g, "")) // Remove commas for CSV formatting
        .join(",");
      csvContent += rowContent + "\r\n"; // Add new line
    });

    return csvContent;
  }

  // Create a Blob with CSV content
  const csvContent = tableToCSV();
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  // Create a temporary download link and trigger the download
  const a = document.createElement("a");
  // title of csv to match the id of the table
  const tableElement = document.querySelector(".data-table");
  const title = tableElement.getAttribute("id");
  a.href = url;
  a.download = title + ".csv";
  a.click();

  // Cleanup
  URL.revokeObjectURL(url);
});
