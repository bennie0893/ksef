function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar.style.display === "none") {
    sidebar.style.display = "block";
  } else {
    sidebar.style.display = "none";
  }
}
function validateMax(input) {
  const maxValue = parseFloat(input.max);
  const value = parseFloat(input.value);

  if (value > maxValue) {
    alert(`Value should be less than or equal to ${maxValue}`);
    input.value = maxValue; // Set the input value to the maximum allowed value
  }

  calculateAverage(); // Call the function to recalculate averages
}

function calculateAverage() {
  let a = parseFloat(document.getElementById("a").value) || 0;
  let b = parseFloat(document.getElementById("b").value) || 0;
  let c = parseFloat(document.getElementById("c").value) || 0;

  let av1 = (a + b + c) / 3;
  document.getElementById("av1").value = av1.toFixed(1);

  let a2 = parseFloat(document.getElementById("a2").value) || 0;
  let b2 = parseFloat(document.getElementById("b2").value) || 0;
  let c2 = parseFloat(document.getElementById("c2").value) || 0;

  let av2 = (a2 + b2 + c2) / 3;
  document.getElementById("av2").value = av2.toFixed(1);

  let a3 = parseFloat(document.getElementById("a3").value) || 0;
  let b3 = parseFloat(document.getElementById("b3").value) || 0;
  let c3 = parseFloat(document.getElementById("c3").value) || 0;

  let av3 = (a3 + b3 + c3) / 3;
  document.getElementById("av3").value = av3.toFixed(1);
}

// Function to handle tab selection and trigger data fetching
function openTab(evt, category) {
  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  evt.currentTarget.className += " active";
  document.getElementById("category").value = category;
  fetchSheetData(category);
}

// Function to fetch and display the sheet data and return project totals
async function fetchSheetData(selectedCategory) {
  if (!selectedCategory) {
    document.getElementById("tableHeader").textContent =
      "Please select a category.";
    return [];
  }

  const SHEET_ID = "1iR7x1U6uJhyLhkueQ0vpg6eHSMAfEnWPMCgWTWQBDHM"; // Replace with your actual Sheet ID
  const SHEET_TITLE = selectedCategory;
  const SHEET_RANGE = "A3:U"; // Adjust range if necessary
  const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}&range=${SHEET_RANGE}`;

  try {
    const res = await fetch(FULL_URL);
    const rep = await res.text();
    const data = JSON.parse(rep.substr(47).slice(0, -2));

    const tableBody = document.querySelector("#projectsTable tbody");

    // Clear previous content
    tableBody.innerHTML = "";

    // Array to store all project totals
    const allProjects = [];

    // Populate table body and collect totals
    data.table.rows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      const projectData = row.c.map((cell) => (cell ? cell.v : ""));
      const total = parseFloat(projectData[17] || 0); // Adjust index for 'total' column

      allProjects.push({ total });

      projectData.forEach((cellValue) => {
        const td = document.createElement("td");
        td.textContent = cellValue;
        tr.appendChild(td);
      });

      // Add Action buttons (Edit/Delete)
      const actionTd = document.createElement("td");
      actionTd.innerHTML = `
          <button class="edit-btn" onclick="editRow(this, ${rowIndex})"><span class="icon-edit"></span> </button>
          <button class="delete-btn" onclick="deleteRow('${SHEET_TITLE}', ${rowIndex})"><span class="icon-delete"></span> </button>
        `;

      tr.appendChild(actionTd);

      tableBody.appendChild(tr);
    });

    return allProjects;
  } catch (error) {
    console.error("Error fetching data: ", error);
    document.getElementById("tableHeader").textContent =
      "Error fetching data. Please try again.";
    return [];
  }
}
// Function to fetch and display the sheet data and return sorted project totals
async function fetchSheetDataPdf(selectedCategory) {
  if (!selectedCategory) {
    document.getElementById("tableHeader").textContent =
      "Please select a category.";
    return [];
  }

  const SHEET_ID = "1iR7x1U6uJhyLhkueQ0vpg6eHSMAfEnWPMCgWTWQBDHM"; // Replace with your actual Sheet ID
  const SHEET_TITLE = selectedCategory;
  const SHEET_RANGE = "A3:U"; // Adjust range if necessary
  const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}&range=${SHEET_RANGE}`;

  try {
    const res = await fetch(FULL_URL);
    const rep = await res.text();
    const data = JSON.parse(rep.substr(47).slice(0, -2));

    const tableBody = document.querySelector("#projectsTable tbody");

    // Clear previous content
    tableBody.innerHTML = "";

    // Array to store all project data
    let allProjects = [];

    // Populate array and collect totals
    data.table.rows.forEach((row, rowIndex) => {
      const projectData = row.c.map((cell) => (cell ? cell.v : "")); // Ensures each cell is a string
      allProjects.push(projectData); // Store each row’s data for sorting and PDF generation
    });

    // Sort allProjects by Rank (assuming Rank is at index 19)
    allProjects.sort((a, b) => {
      const rankA = parseFloat(a[19]) || 0;
      const rankB = parseFloat(b[19]) || 0;
      return rankA - rankB;
    });

    // Display sorted data in the table
    allProjects.forEach((projectData, rowIndex) => {
      const tr = document.createElement("tr");

      projectData.forEach((cellValue) => {
        const td = document.createElement("td");
        td.textContent = cellValue;
        tr.appendChild(td);
      });

      // Add Action buttons (Edit/Delete)
      const actionTd = document.createElement("td");
      actionTd.innerHTML = `
        <button class="edit-btn" onclick="editRow(this, ${rowIndex})"><span class="icon-edit"></span> </button>
        <button class="delete-btn" onclick="deleteRow('${SHEET_TITLE}', ${rowIndex})"><span class="icon-delete"></span> </button>
      `;
      tr.appendChild(actionTd);

      tableBody.appendChild(tr);
    });

    return allProjects;
  } catch (error) {
    console.error("Error fetching data: ", error);
    document.getElementById("tableHeader").textContent =
      "Error fetching data. Please try again.";
    return [];
  }
}
function editRow(button, rowIndex) {
  const row = button.closest("tr"); // Find the closest row
  if (!row) {
    console.error("Error: Row not found.");
    return;
  }

  const cells = row.children;
  const isEditing = row.getAttribute("data-editing") === "true";

  // Populate the form with the row data first
  document.getElementById("firstCandidate").value = cells[1].textContent;
  document.getElementById("secondCandidate").value = cells[2].textContent;
  document.getElementById("schoolName").value = cells[3].textContent;
  document.getElementById("projectTitle").value = cells[4].textContent;

  // Populate Section A, B, and C
  document.getElementById("a").value = cells[5].textContent;
  document.getElementById("b").value = cells[6].textContent;
  document.getElementById("c").value = cells[7].textContent;
  document.getElementById("av1").value = cells[8].textContent;

  document.getElementById("a2").value = cells[9].textContent;
  document.getElementById("b2").value = cells[10].textContent;
  document.getElementById("c2").value = cells[11].textContent;
  document.getElementById("av2").value = cells[12].textContent;

  document.getElementById("a3").value = cells[13].textContent;
  document.getElementById("b3").value = cells[14].textContent;
  document.getElementById("c3").value = cells[15].textContent;
  document.getElementById("av3").value = cells[16].textContent;

  // Scroll to the form
  document
    .querySelector(".form-container2")
    .scrollIntoView({ behavior: "smooth" });

  // Handle inline table editing
  if (!isEditing) {
    row.setAttribute("data-editing", "true");

    Array.from(row.children).forEach((td, cellIndex) => {
      // Skip the specified columns (second, third, fourth, and fifth)
      if (
        cellIndex < row.children.length - 1 &&
        ![0, 1, 2, 3, 4, 8, 12, 16, 17, 18, 19, 20].includes(cellIndex)
      ) {
        const cellValue = td.textContent.trim();
        const cellWidth = td.clientWidth; // Get the current width of the cell

        // Replace cell content with input and set the width to match the cell's original width
        td.innerHTML = `<input type='text' value='${cellValue}' style='width: ${cellWidth}px' data-cell-index='${cellIndex}'>`;

        // Apply the cell's original width to ensure no layout shift
        td.style.width = `${cellWidth}px`;
      }
    });

    // Change button text to "Save"
    button.textContent = "Save";
    button.onclick = function () {
      saveRow(row, rowIndex); // Call saveRow function to commit changes
    };

    // Set the click handler for the "Save" button with id="saveRowData"
    const saveButton = document.getElementById("saveRowData");
    saveButton.onclick = function () {
      saveRowData(button, rowIndex); // Save the row data
    };
  }
}

// Fetch row data for editing
function editData(rowIndex, selectedCategory) {
  const SHEET_ID = "1iR7x1U6uJhyLhkueQ0vpg6eHSMAfEnWPMCgWTWQBDHM"; // Replace with your actual Sheet ID
  const SHEET_RANGE = "A:U"; // Adjust range if necessary
  const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${selectedCategory}&range=${SHEET_RANGE}`;

  fetch(FULL_URL)
    .then((response) => response.text())
    .then((dataText) => {
      const data = JSON.parse(dataText.substr(47).slice(0, -2));
      const row = data.table.rows[rowIndex]; // Fetch the row based on the rowIndex
      console.log(row);

      if (row) {
        // Map each cell value to the corresponding form field
        document.getElementById("firstCandidate").value = row.c[1]
          ? row.c[1].v
          : "";
        document.getElementById("secondCandidate").value = row.c[2]
          ? row.c[2].v
          : "";
        document.getElementById("schoolName").value = row.c[3]
          ? row.c[3].v
          : "";
        document.getElementById("projectTitle").value = row.c[4]
          ? row.c[4].v
          : "";
        document.getElementById("category").value = selectedCategory;
        document.getElementById("a").value = row.c[5] ? row.c[5].v : "";
        document.getElementById("b").value = row.c[6] ? row.c[6].v : "";
        document.getElementById("c").value = row.c[7] ? row.c[7].v : "";
        document.getElementById("av1").value = row.c[8] ? row.c[8].v : "";
        document.getElementById("a2").value = row.c[9] ? row.c[9].v : "";
        document.getElementById("b2").value = row.c[10] ? row.c[10].v : "";
        document.getElementById("c2").value = row.c[11] ? row.c[11].v : "";
        document.getElementById("av2").value = row.c[12] ? row.c[12].v : "";
        document.getElementById("a3").value = row.c[13] ? row.c[13].v : "";
        document.getElementById("b3").value = row.c[14] ? row.c[14].v : "";
        document.getElementById("c3").value = row.c[15] ? row.c[15].v : "";
        document.getElementById("av3").value = row.c[16] ? row.c[16].v : "";
      } else {
        console.error("No matching data found for editing.");
      }
    })
    .catch((err) => {
      console.error("Error retrieving project for editing", err);
    });
}

// Save row function
function saveRow(row, rowIndex) {
  row.setAttribute("data-editing", "false");

  const updatedData = [];
  Array.from(row.children).forEach((td, cellIndex) => {
    if (cellIndex < row.children.length - 1) {
      const input = td.querySelector("input");
      const updatedValue = input.value;
      updatedData.push(updatedValue);
      td.textContent = updatedValue; // Set the updated value back to the table cell
    }
  });

  // Retrieve the currently active tab (sheetName)
  const activeTab = document.querySelector(".tablinks.active");
  const sheetName = document.getElementById("category").value;

  // Update the Google Sheet with the edited data
  const sheetRange = `${sheetName}!A${rowIndex + 3}:U${rowIndex + 3}`; // Adjust range according to your columns
  saveChanges(sheetRange, [updatedData]);

  // Revert the Edit button
  const editButton = row.querySelector(".edit-btn");
  editButton.textContent = "Edit";
  editButton.onclick = function () {
    editRow(row, rowIndex, sheetName); // Pass the sheetName when re-editing
  };
}

// Delete row function
async function deleteRow(sheetName, rowIndex) {
  try {
    // Adjust rowIndex to delete the row at rowIndex + 2
    const adjustedRowIndex = rowIndex + 1;

    console.log(
      "Deleting row from sheet:",
      sheetName,
      "Adjusted row index:",
      adjustedRowIndex
    ); // Log the adjusted index

    const response = await fetch("http://localhost:3000/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetName, rowIndex: adjustedRowIndex }), // Use the adjusted row index here
    });

    if (!response.ok) throw new Error("Failed to delete row");

    const result = await response.json();
    alert("Row deleted: " + result.message);
    fetchSheetData(sheetName); // Refresh the data after deletion
  } catch (error) {
    console.error("Error deleting row:", error);
  }
}

// Save changes to the Google Sheet
function saveChanges(sheetRange, updatedData) {
  fetch("http://localhost:3000/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheet: sheetRange, data: updatedData }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Sheet updated successfully!");
      } else {
        alert("Failed to update sheet.");
      }
    })
    .catch((error) => console.error("Error updating sheet:", error));
}

// Function to set default tab based on local storage or default to 'AGRICULTURE'
function setDefaultTab() {
  // Retrieve the selected category from localStorage, defaulting to 'AGRICULTURE' if none exists
  const selectedCategory = localStorage.getItem("Category") || "AGRICULTURE";

  // Find the corresponding tab element for the stored or default category
  const defaultTab = document.querySelector(
    `.tablinks[onclick*="${selectedCategory}"]`
  );

  if (defaultTab) {
    // If the tab exists, simulate a click event to set it as active and load data
    defaultTab.click();
  } else {
    // If no tab is found for the category, default to 'AGRICULTURE' by fetching data directly
    fetchSheetData("AGRICULTURE");
  }
}

// Ensure this function runs on page load
window.onload = setDefaultTab;

async function saveRowData(button, rowIndex) {
  const row = button.closest("tr");

  if (!row) {
    console.error("Error: Row not found.");
    return;
  }

  const cells = row.children;
  if (!cells || cells.length === 0) {
    console.error("Error: Cells not found in the row.");
    return;
  }

  // Collect data from the form inputs
  const firstCandidateInput = document.getElementById("firstCandidate").value;
  const secondCandidateInput = document.getElementById("secondCandidate").value;
  const schoolNameInput = document.getElementById("schoolName").value;
  const projectTitleInput = document.getElementById("projectTitle").value;

  // Collect data from Section A, B, and C
  const sectionA = {
    a: document.getElementById("a").value,
    b: document.getElementById("b").value,
    c: document.getElementById("c").value,
    av1: document.getElementById("av1").value,
  };
  const sectionB = {
    a2: document.getElementById("a2").value,
    b2: document.getElementById("b2").value,
    c2: document.getElementById("c2").value,
    av2: document.getElementById("av2").value,
  };
  const sectionC = {
    a3: document.getElementById("a3").value,
    b3: document.getElementById("b3").value,
    c3: document.getElementById("c3").value,
    av3: document.getElementById("av3").value,
  };

  const total =
    parseFloat(sectionA.av1 || 0) +
    parseFloat(sectionB.av2 || 0) +
    parseFloat(sectionC.av3 || 0);
  const hasValidValues =
    sectionA.av1 &&
    parseFloat(sectionA.av1) !== 0 &&
    sectionB.av2 &&
    parseFloat(sectionB.av2) !== 0 &&
    sectionC.av3 &&
    parseFloat(sectionC.av3) !== 0;
  const tickMark = hasValidValues ? "✓" : "✗";

  const sheetName = document.getElementById("category").value;

  try {
    const allProjects = await fetchSheetData(sheetName);

    // Update the specific row with new data
    allProjects[rowIndex] = {
      firstCandidate: firstCandidateInput,
      secondCandidate: secondCandidateInput,
      schoolName: schoolNameInput,
      projectTitle: projectTitleInput,
      a: sectionA.a,
      b: sectionA.b,
      c: sectionA.c,
      av1: sectionA.av1,
      a2: sectionB.a2,
      b2: sectionB.b2,
      c2: sectionB.c2,
      av2: sectionB.av2,
      a3: sectionC.a3,
      b3: sectionC.b3,
      c3: sectionC.c3,
      av3: sectionC.av3,
      total,
      tickMark,
    };

    const projectTotals = allProjects
      .map((project, index) => ({
        ...project,
        index,
        total: parseFloat(project.total) || 0,
      }))
      .sort((a, b) => b.total - a.total);

    let currentRank = 1;
    projectTotals.forEach((project, i) => {
      if (i > 0 && project.total === projectTotals[i - 1].total) {
        project.rank = projectTotals[i - 1].rank; // Same rank as the previous project if totals match
      } else {
        project.rank = currentRank;
      }
      project.points = 30 - project.rank;
      currentRank += 1;
    });

    projectTotals.forEach((project) => {
      allProjects[project.index].rank = project.rank;
      allProjects[project.index].points = project.points;
    });

    const sheetRange = `${sheetName}!A3:U${allProjects.length + 2}`;
    const sheetData = allProjects.map((project, idx) => [
      idx + 1,
      project.firstCandidate,
      project.secondCandidate,
      project.schoolName,
      project.projectTitle,
      project.a,
      project.b,
      project.c,
      project.av1,
      project.a2,
      project.b2,
      project.c2,
      project.av2,
      project.a3,
      project.b3,
      project.c3,
      project.av3,
      project.total,
      project.tickMark,
      project.rank,
      project.points,
    ]);

    saveChanges(sheetRange, sheetData);
    fetchSheetData(sheetName);
  } catch (error) {
    console.error("Failed to recalculate ranks or save changes:", error);
  }

  button.textContent = "Edit";
  button.onclick = function () {
    editRow(button, rowIndex);
  };
}

// Fetch data and set default tab on page load
document.addEventListener("DOMContentLoaded", () => {
  setDefaultTab(); // Set default tab and fetch data
});

// PDF generation function for all categories
async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  // Define headers for the PDF table
  const headers = [
    [
      "ID",
      "First Candidate",
      "Second Candidate",
      "School Name",
      "Project Title",
      "A",
      "B",
      "C",
      "Av1",
      "A2",
      "B2",
      "C2",
      "Av2",
      "A3",
      "B3",
      "C3",
      "Av3",
      "Total",
      "Mark",
      "Rank",
      "Points",
    ],
  ];

  // Loop through each category
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    // Fetch data for the current category
    const categoryData = await fetchSheetDataPdf(category);

    if (categoryData.length > 0) {
      // Add a new page for each category except the first
      if (i > 0) {
        doc.addPage();
      }

      // Add category title to PDF
      doc.text(`Category: ${category}`, 14, 15);

      // Prepare data rows, skipping the last column if it’s an action column
      const rows = categoryData.map((row) => row.slice(0));

      // Add table for the category
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 20,
        margin: { top: 20 },
      });
    } else {
      console.warn(`No data found for category: ${category}`);
    }
  }

  // Save the PDF with a generic filename
  doc.save("all_categories_project_data.pdf");
}

// Event listener for the download button
document
  .getElementById("downloadPdfBtn")
  .addEventListener("click", downloadPDF);

document
  .getElementById("downloadExcelBtn")
  .addEventListener("click", function () {
    let wb = XLSX.utils.book_new();
    let ws_data = [];

    // Add the headers
    let headers = [
      "ID",
      "First Candidate",
      "Second Candidate",
      "School Name",
      "Project Title",
      "A",
      "B",
      "C",
      "Av1",
      "A2",
      "B2",
      "C2",
      "Av2",
      "A3",
      "B3",
      "C3",
      "Av3",
      "Total",
      "Mark",
      "Rank",
      "Points",
    ];
    ws_data.push(headers);

    // Add the table data, skipping the last column (Edit/Delete actions)
    document.querySelectorAll("#projectsTable tbody tr").forEach((tr) => {
      let row = [];
      tr.querySelectorAll("td").forEach((td, index, tdArray) => {
        if (index < tdArray.length - 1) {
          // Skip the last column
          row.push(td.innerText);
        }
      });
      ws_data.push(row);
    });

    // Create worksheet and add it to the workbook
    let ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Apply styles to the header row
    headers.forEach((header, index) => {
      let cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } }, // Dark blue background
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    });

    // Apply borders to all cells
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) ws[cellAddress] = {}; // If the cell is empty, create it
        ws[cellAddress].s = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Projects");

    // Export the Excel file
    XLSX.writeFile(wb, "project_data.xlsx");
  });
// Array of all categories
const categories = [
  "AGRICULTURE",
  "BEHAVIOR SCIENCE",
  "BIOTECH",
  "CHEMISTRY",
  "COMPUTER",
  "ENERGY AND TRANSPORT",
  "ENGINEERING",
  "ENVIRONMENTAL",
  "FOOD TECHNOLOGY",
  "MATHEMATICS",
  "PHYSICS",
  "APPLIED TECH",
  "ROBOTICS",
];
