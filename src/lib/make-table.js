// function to create the skeleton of the table, could incl. css
function createTable(config, data) {
  const { title, columns } = config;

  columns.forEach((column) => {
    data.forEach((item) => {
      const rowValue = column.getValue(item);
      // render in a <td>{rowValue}</td>
    });
  });
}

// use the function in different projects by passing specific config which set the values to be passed

const config = {
  title: "The new Table",
  columns: [
    {
      header: "Full name",
      getValue(item) {
        return [item.firstname, item.lastname].join(", ");
      },
    },
  ],
};

createTable(config);
