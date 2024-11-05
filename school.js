// Auto-load sheet data on page load
window.addEventListener("DOMContentLoaded", function () {
  fetchSheetData(); // Loads the default sheet if available
});

let tableData = []; // To store sheet data for editing

// Function to fetch data for the selected sheet
function fetchSheetData() {
  const SHEET_ID = "1iR7x1U6uJhyLhkueQ0vpg6eHSMAfEnWPMCgWTWQBDHM";
  const SHEET_TITLE = "SCHOOLS";
  const SHEET_RANGE = "A1:C100";
  const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}&range=${SHEET_RANGE}`;

  fetch(FULL_URL)
    .then((res) => res.text())
    .then((rep) => {
      const jsonData = JSON.parse(rep.substr(47).slice(0, -2));
      const tableBody = document.querySelector("#resultTable tbody");
      const tableHeader = document.getElementById("tableHeader");
      tableBody.innerHTML = "";
      tableHeader.innerHTML = "";

      if (!jsonData || jsonData.table.rows.length === 0) {
        document.getElementById("errorMessage").innerText = "No data found";
        return;
      }

      // Extract headers
      const headers = jsonData.table.cols.map((col) => col.label);
      tableData = jsonData.table.rows.map((row) =>
        row.c.map((cell) => (cell ? cell.v : ""))
      );

      // Add "Delete" column header
      headers.push("Actions");

      // Create headers dynamically
      headers.forEach((header) => {
        const th = document.createElement("th");
        th.innerText = header || "N/A";
        tableHeader.appendChild(th);
      });

      // Populate table rows with data and add "Delete" buttons
      tableData.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");

        row.forEach((cell, cellIndex) => {
          const td = document.createElement("td");
          td.contentEditable = true; // Make table cells editable
          td.innerText = cell;
          td.addEventListener("input", function () {
            // Update the tableData array with the edited data
            tableData[rowIndex][cellIndex] = td.innerText;
          });
          tr.appendChild(td);
        });

        // Add "Delete" button for each row
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-btn");

        // Use innerHTML to set both the icon and the text
        deleteButton.innerHTML = '<i class="fas fa-trash"></i><span></span> ';

        // Add the event listener for deleting the row
        deleteButton.addEventListener("click", function () {
          deleteRow(rowIndex); // Call the function to delete the row
        });

        const actionTd = document.createElement("td");
        actionTd.appendChild(deleteButton);
        tr.appendChild(actionTd);

        tableBody.appendChild(tr);
      });
    })
    .catch((error) => {
      console.error("Error fetching sheet data:", error);
      document.getElementById("errorMessage").innerText =
        "Failed to load sheet data";
    });
}

// Delete row function
async function deleteRow(rowIndex) {
  // Adjust rowIndex for 1-based index if necessary for the backend
  const adjustedRowIndex = rowIndex - 1;

  // Backend logic to delete the row
  try {
    const sheetName = "SCHOOLS"; // Set sheetName dynamically if needed

    const response = await fetch("http://localhost:3000/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetName, rowIndex: adjustedRowIndex }), // Send sheet name and 1-based row index
    });

    if (!response.ok) {
      throw new Error("Failed to delete row");
    }

    const result = await response.json();
    alert("Row deleted: " + result.message);

    // Remove row from tableData array after the backend call succeeds
    tableData.splice(rowIndex, 1);

    // Update the UI
    const tableBody = document.querySelector("#resultTable tbody");
    tableBody.innerHTML = ""; // Clear the table

    // Rebuild the table with remaining data
    tableData.forEach((row, index) => {
      const tr = document.createElement("tr");

      row.forEach((cell, cellIndex) => {
        const td = document.createElement("td");
        td.contentEditable = true;
        td.innerText = cell;
        td.addEventListener("input", function () {
          tableData[index][cellIndex] = td.innerText;
        });
        tr.appendChild(td);
      });

      // Add "Delete" button for each row
      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = '<i class="fas fa-trash"></i><span></span> ';
      deleteButton.classList.add("delete-btn");
      deleteButton.addEventListener("click", function () {
        deleteRow(index);
      });

      const actionTd = document.createElement("td");
      actionTd.appendChild(deleteButton);
      tr.appendChild(actionTd);

      tableBody.appendChild(tr);
    });

    // Optionally, refresh the data after deletion
    fetchSheetData(); // Fetch and rebuild the table with fresh data if needed
  } catch (error) {
    console.error("Error deleting row:", error);
  }
}

// Save changes to Google Sheets
document.getElementById("saveChanges").addEventListener("click", function () {
  const selectedSheet = document.getElementById("sheetSelect").value;

  fetch("http://localhost:3000/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sheet: selectedSheet,
      data: tableData,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        alert("Changes saved successfully!");
      } else {
        alert("Failed to save changes.");
      }
    })
    .catch((error) => {
      console.error("Error saving data:", error);
      alert("Failed to save changes.");
    });
});

// Add new row
document.getElementById("addRow").addEventListener("click", function () {
  const newRow = Array(tableData[0].length).fill(""); // Create an empty row with the same number of columns
  tableData.push(newRow); // Add the new row to the tableData array

  // Update the UI by adding a new editable row
  const tableBody = document.querySelector("#resultTable tbody");
  const tr = document.createElement("tr");
  newRow.forEach((cell, cellIndex) => {
    const td = document.createElement("td");
    td.contentEditable = true;
    td.innerText = cell;
    td.addEventListener("input", function () {
      tableData[tableData.length - 1][cellIndex] = td.innerText;
    });
    tr.appendChild(td);
  });

  // Add "Delete" button for the new row
  const deleteButton = document.createElement("button");
  deleteButton.innerText = "Delete";
  deleteButton.classList.add("delete-btn");
  deleteButton.addEventListener("click", function () {
    deleteRow(tableData.length - 1);
  });

  const actionTd = document.createElement("td");
  actionTd.appendChild(deleteButton);
  tr.appendChild(actionTd);

  tableBody.appendChild(tr);
});

// Function to handle form submission
document
  .getElementById("addSchoolForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the form from refreshing the page

    // Collect data from the form
    const schoolName = document.getElementById("school-name").value.trim();
    const subCounty = document.getElementById("sub-county").value.trim();

    // Validate the input (Ensure both fields are filled)
    if (!schoolName || !subCounty) {
      alert("Please provide both the school name and sub-county.");
      return;
    }

    // Prepare the data to send
    const schoolData = {
      schoolName: schoolName,
      subCounty: subCounty,
    };

    try {
      // Send the data to the backend using fetch
      const response = await fetch("http://localhost:3000/add-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schoolData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }

      alert("School added: " + result.message);

      // Clear the form fields after submission
      document.getElementById("school-name").value = "";
      document.getElementById("sub-county").value = "KIGUMO"; // Reset the select option

      // Optionally, refresh the table with the new data
      fetchSheetData(); // Call your existing function to refresh the table with the new school data
    } catch (error) {
      alert(error.message);
      console.error("Error adding school:", error);
    }
  });
