// Auto-load sheet data on page load
window.addEventListener("DOMContentLoaded", function () {
  fetchSheetData("SCHOOLS");
});

// Fetch data for the selected sheet
function fetchSheetData(sheetName) {
  fetch(`http://localhost:3000/read?sheet=${sheetName}`)
    .then((response) => response.json())
    .then((data) => {
      if (!data || data.length === 0) {
        displayError("No data found");
        return;
      }

      updateTableHeaders(data[0]); // Assuming the first row contains headers
      updateTableBody(data.slice(1)); // Exclude headers and render the body
      tableData = data; // Store the fetched data for future edits
    })
    .catch((error) => {
      console.error("Error fetching sheet data:", error);
      displayError("Failed to load sheet data");
    });
}

// Function to update table headers dynamically
function updateTableHeaders(headers) {
  const tableHeader = document.getElementById("tableHeader");
  tableHeader.innerHTML = ""; // Clear existing headers

  headers.forEach((header) => {
    const th = document.createElement("th");
    th.innerText = header;
    tableHeader.appendChild(th);
  });

  // Add an "Actions" column
  const actionTh = document.createElement("th");
  actionTh.innerText = "Actions";
  tableHeader.appendChild(actionTh);
}

// Function to update table body dynamically
function updateTableBody(rows) {
  const tableBody = document.querySelector("#resultTable tbody");
  tableBody.innerHTML = ""; // Clear existing rows

  rows.forEach((row, rowIndex) => {
    addRowToTable(row, rowIndex);
  });
}

// Function to add a row to the table
function addRowToTable(rowData, rowIndex) {
  const tableBody = document.querySelector("#resultTable tbody");
  const tr = document.createElement("tr");

  rowData.forEach((cell, cellIndex) => {
    const td = document.createElement("td");
    td.contentEditable = true; // Make all cells editable
    td.innerText = cell;
    td.addEventListener("input", function () {
      tableData[rowIndex + 1][cellIndex] = td.innerText; // Update the data
    });
    tr.appendChild(td);
  });

  // Create a delete button for the row
  const actionTd = document.createElement("td");
  const deleteButton = document.createElement("button");
  deleteButton.innerText = "Delete";
  deleteButton.addEventListener("click", function () {
    deleteSchool(rowData[0], tr); // Pass the ID (row[0]) and the row element
  });
  actionTd.appendChild(deleteButton);
  tr.appendChild(actionTd);

  tableBody.appendChild(tr);
}

// Save changes when 'Save Changes' button is clicked
document.getElementById("saveChanges").addEventListener("click", function () {
  saveChangesToSheet();
});

// Save changes to the backend
function saveChangesToSheet() {
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
        openPopup();
        alert("Changes saved successfully!");
      } else {
        alert("Failed to save changes.");
      }
    })
    .catch((error) => {
      console.error("Error saving data:", error);
      alert("Failed to save changes.");
    });
}

// Add school functionality
document
  .getElementById("addSchoolForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const schoolName = document.getElementById("school-name").value.trim();
    const subCounty = document.getElementById("sub-county").value.trim();

    if (schoolName && subCounty) {
      // Check if the school already exists
      const isSchoolUnique = !tableData.some(
        (row) => row[1] === schoolName && row[2] === subCounty
      );

      if (!isSchoolUnique) {
        alert("This school already exists in the selected sub-county.");
        return;
      }

      // Generate a new unique ID
      const newId = tableData.length ? tableData.length + 1 : 1;
      const newRow = [newId, schoolName, subCounty];
      tableData.push(newRow); // Add the new row

      addRowToTable(newRow, tableData.length - 1); // Update UI
      clearForm(); // Clear input fields

      saveChangesToSheet();
    } else {
      alert("Please fill out both the school name and sub-county.");
    }
  });

// Clear the form fields after submission
function clearForm() {
  document.getElementById("school-name").value = "";
  document.getElementById("sub-county").value = "";
}

// Function to delete a school
function deleteSchool(id, rowElement) {
  console.log("Deleting school with ID:", id);
  const index = tableData.findIndex((row) => row[0] === id);

  if (index !== -1) {
    tableData[index].fill(""); // Set row to empty strings
    rowElement.remove(); // Remove the row from the UI
    saveChangesToSheet();
    alert("School deleted successfully.");
  } else {
    alert("School not found.");
  }
}

// Function to download data as Excel
document.getElementById("download-excel").addEventListener("click", () => {
  const jsonData = tableData.slice(1).map((row) => ({
    ID: row[0],
    "School Name": row[1],
    "Sub County": row[2],
  }));

  const worksheet = XLSX.utils.json_to_sheet(jsonData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "School Data");
  XLSX.writeFile(workbook, "school_data.xlsx");
});

// Function to download data as PDF
document.getElementById("download-pdf").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const tableDataForPDF = tableData
    .slice(1)
    .map((row) => [row[0], row[1], row[2]]);

  doc.text("School Data", 14, 16);
  doc.autoTable({
    head: [["ID", "School Name", "Sub County"]],
    body: tableDataForPDF,
    startY: 20,
    theme: "striped",
  });

  doc.save("school_data.pdf");
});

// Popup functionality
let popup = document.getElementById("popup");

function openPopup() {
  popup.classList.add("open-popup");
}

function closePopup() {
  popup.classList.remove("open-popup");
}

// Utility function to display error messages
function displayError(message) {
  document.getElementById("errorMessage").innerText = message;
}
