document.getElementById("toggleButton").addEventListener("click", function () {
  var sidebar = document.getElementById("sidebar");

  sidebar.classList.toggle("hidden");
});

// Global variable to track the selected sheet name
let tableData = [];
let sheetName = "";

// Auto-load sheet data on page load
window.addEventListener("DOMContentLoaded", function () {
  loadCategories();
  fetchSheetData(); // Loads the default sheet if available
  // Call the function to populate the school list when the page loads
  fetchSchools();
});

// Event listener for category change
document
  .getElementById("categoryFilter")
  .addEventListener("change", function () {
    const selectedCategory = document.getElementById("categoryFilter").value;
    if (selectedCategory) {
      sheetName = selectedCategory; // Store the selected category as the sheet name
      fetchSheetData(); // Fetch data for the selected category
    } else {
      document.getElementById("tableHeader").textContent =
        "Please select a category.";
    }
  });

// Function to fetch and display the sheet data
function fetchSheetData() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  if (!selectedCategory) {
    document.getElementById("tableHeader").textContent =
      "Please select a category.";
    return;
  }

  const SHEET_ID = "1iR7x1U6uJhyLhkueQ0vpg6eHSMAfEnWPMCgWTWQBDHM";
  const SHEET_TITLE = selectedCategory;
  const SHEET_RANGE = "A:E";
  const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}&range=${SHEET_RANGE}`;

  fetch(FULL_URL)
    .then((res) => res.text())
    .then((rep) => {
      const data = JSON.parse(rep.substr(47).slice(0, -2));

      const tableHeader = document.getElementById("tableHeader");
      const tableBody = document.getElementById("projectList");

      // Clear previous content
      tableHeader.innerHTML = "";
      tableBody.innerHTML = "";

      // Populate table headers dynamically if available
      if (data.table.cols && data.table.cols.length > 0) {
        data.table.cols.forEach((col) => {
          const th = document.createElement("th");
          th.textContent = col.label ? col.label : ""; // Use col label if available
          tableHeader.appendChild(th);
        });
      }

      // Adding the "Action" header
      const thAction = document.createElement("th");
      thAction.textContent = "Actions";
      tableHeader.appendChild(thAction);

      // Populate table body
      data.table.rows.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");

        row.c.forEach((cell, cellIndex) => {
          const td = document.createElement("td");
          td.textContent = cell ? cell.v : "";
          td.setAttribute("data-cell-index", cellIndex);
          tr.appendChild(td);
        });

        // Action buttons
        const actionTd = document.createElement("td");
        actionTd.innerHTML = `
                <button class="edit-btn" onclick="editRow(this, ${rowIndex})"><span class="icon-edit"></span> </button>
                <button class="delete-btn" onclick="deleteRow('${sheetName}', ${rowIndex})"><span class="icon-delete"></span> </button>
             `;
        tr.appendChild(actionTd);

        tableBody.appendChild(tr);
      });
    })
    .catch((error) => {
      console.error("Error fetching data: ", error);
      document.getElementById("tableHeader").textContent =
        "Error fetching data. Please try again.";
    });
}

// Edit row function
function editRow(button, rowIndex) {
  const row = button.closest("tr");
  const isEditing = row.getAttribute("data-editing") === "true";

  if (!isEditing) {
    row.setAttribute("data-editing", "true");
    Array.from(row.children).forEach((td, cellIndex) => {
      if (cellIndex < row.children.length - 1) {
        const cellValue = td.textContent;
        td.innerHTML = `<input type='text' value='${cellValue}' data-cell-index='${cellIndex}'>`;
      }
    });

    button.textContent = "Save";
    button.onclick = function () {
      saveRow(row, rowIndex);
    };
  }
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
      td.textContent = updatedValue;
    }
  });

  // Update the sheet with the edited data
  const sheetRange = `${sheetName}!A${rowIndex + 2}:E${rowIndex + 2}`;
  saveChanges(sheetRange, [updatedData]);

  row.querySelector(".edit-btn").textContent = "Edit";
  row.querySelector(".edit-btn").onclick = function () {
    editRow(row, rowIndex);
  };
}

// Delete row function
async function deleteRow(sheetName, rowIndex) {
  try {
    console.log("Deleting row from sheet:", sheetName, "Row index:", rowIndex); // Log the values

    const response = await fetch("https://ksef-10.onrender.com/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetName, rowIndex }), // Include sheetName and rowIndex in the request body
    });

    if (!response.ok) throw new Error("Failed to delete row");

    const result = await response.json();
    alert("Row deleted: " + result.message);
    fetchSheetData(); // Refresh the data after deletion
  } catch (error) {
    console.error("Error deleting row:", error);
  }
}

// Save changes to the Google Sheet
function saveChanges(sheetRange, updatedData) {
  fetch("https://ksef-10.onrender.com/update", {
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

// Load categories into the filter dropdown
function loadCategories() {
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

  const categorySelect = document.getElementById("categoryFilter");
  categorySelect.innerHTML = '<option value="">-- Select Category --</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Function to show the form
function showForm() {
  document.getElementById("form-container").style.display = "block";
}

// Function to hide the form
function hideForm() {
  document.getElementById("form-container").style.display = "none";
}

// Event listeners for the buttons
document.getElementById("showFormButton").addEventListener("click", showForm);
document.getElementById("hideFormButton").addEventListener("click", hideForm);

// Fetch schools using Google Sheets API
async function fetchSchools() {
  try {
    const SHEET_ID = "1iR7x1U6uJhyLhkueQ0vpg6eHSMAfEnWPMCgWTWQBDHM";
    const API_KEY = "AIzaSyAxja5zlmfH7rSHSLTmo88cjRV0MKetEJM"; // Replace with your Google Sheets API key
    const RANGE = "SCHOOLS!A:B"; // Adjust range as needed

    const FULL_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    const response = await fetch(FULL_URL);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error.message);
    }

    const rows = data.values;
    const schoolList = document.getElementById("school-list");

    // Clear existing options
    schoolList.innerHTML = '<option value="">-- Select a School --</option>';

    // Populate dropdown with schools
    rows.forEach((row, index) => {
      if (index > 0) {
        // Skip the header row
        const schoolName = row[1]; // Adjust based on your column
        if (schoolName) {
          const option = document.createElement("option");
          option.value = schoolName;
          option.text = schoolName;
          schoolList.appendChild(option);
        }
      }
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
  }
}

// Handle form submission to add a project
document
  .getElementById("registrationForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form from reloading the page

    const firstCandidate = document.getElementById("firstCandidate").value;
    const secondCandidate = document.getElementById("secondCandidate").value;
    const schoolName = document.getElementById("school-list").value;
    const projectTitle = document.getElementById("projectTitle").value;
    const category = document.getElementById("category").value;

    if (!schoolName || !projectTitle || !category) {
      alert("Please fill all required fields.");
      return;
    }

    // Prepare project data to send
    const projectData = {
      firstCandidate,
      secondCandidate,
      schoolName,
      projectTitle,
      category,
    };

    try {
      const response = await fetch("https://ksef-10.onrender.com/add-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error("Failed to add project");
      }

      const result = await response.json();
      fetchSheetData();
      alert("Project added: " + result.message);

      // Clear the form after submission
    } catch (error) {
      console.error("Error adding project:", error);
    }
  });

// Handle file upload for Excel
document.getElementById("uploadButton").addEventListener("click", function () {
  const fileInput = document.getElementById("excelFileInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file first");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  fetch("https://ksef-10.onrender.com/upload-excel", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to upload Excel");
      }
      return response.json();
    })
    .then((result) => {
      alert("Excel file uploaded: " + result.message);
    })
    .catch((error) => {
      console.error("Error uploading Excel:", error);
    });
});

// Handle downloading the Excel template
document
  .getElementById("downloadTemplateButton")
  .addEventListener("click", function () {
    window.location.href = "https://ksef-10.onrender.com/download-template"; // URL to download the template from the backend
  });
