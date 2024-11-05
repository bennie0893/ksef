// Auto-load sheet data on page load
window.addEventListener("DOMContentLoaded", function () {
  showSection("ranking-sec"); // Loads the default section
});
document.addEventListener("DOMContentLoaded", function () {
  const lastSection = sessionStorage.getItem("lastSection");
  if (lastSection) {
    showSection(lastSection);
  }

  document.querySelectorAll("[data-section]").forEach((link) => {
    link.addEventListener("click", function () {
      const section = this.getAttribute("data-section");
      sessionStorage.setItem("lastSection", section);
      showSection(section);
    });
  });
});

// Include Fuse.js if using Node.js, otherwise this is unnecessary
// const Fuse = require("fuse.js");
function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".content-sec");
  sections.forEach((section) => {
    section.style.display = "none";
  });

  // Show the selected section
  const sectionToShow = document.getElementById(sectionId);
  if (sectionToShow) {
    sectionToShow.style.display = "block";
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar.style.display === "none" || sidebar.style.display === "") {
    sidebar.style.display = "block";
  } else {
    sidebar.style.display = "none";
  }
}
const SHEET_ID = "1iR7x1U6uJhyLhkueQ0vpg6eHSMAfEnWPMCgWTWQBDHM";
const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?`;
let schoolData = {};
let sortedSchoolData = []; // Global variable to store sorted data

// Define the subjects to fetch data for
const subjects = [
  "Agriculture",
  "Behavior Science",
  "Biotech",
  "Chemistry",
  "Computer",
  "Energy and Transport",
  "Engineering",
  "Environmental",
  "Food Technology",
  "Mathematics",
  "Physics",
  "Applied Tech",
  "Robotics",
];

// Fetch school data and subject data
async function fetchAllData() {
  await fetchSchoolData(); // Fetch the ID, School, Sub County from "SCHOOLS"

  // Then fetch data from each subject sheet and populate points
  let promises = subjects.map(fetchSubjectData);
  await Promise.all(promises);

  displaySchoolRanking();
}

// Fetch school data from the "SCHOOLS" sheet
async function fetchSchoolData() {
  const query = encodeURIComponent("SELECT A, B, C"); // A: ID, B: School, C: Sub County
  const url = `${BASE_URL}sheet=SCHOOLS&tq=${query}`;

  try {
    const response = await fetch(url);
    const data = await response.text();
    const rows = JSON.parse(data.substring(47).slice(0, -2)).table.rows;

    rows.forEach((row) => {
      const data = row.c.map((cell) => (cell ? cell.v : ""));
      const schoolId = data[0].toString().trim().toUpperCase(); // Standardize ID
      const schoolName = data[1].trim().toUpperCase(); // Standardize School Name
      const subCounty = data[2].trim(); // Sub County

      // Initialize schoolData with basic info and points for subjects
      schoolData[schoolId] = {
        id: schoolId,
        name: schoolName,
        subCounty: subCounty,
        points: subjects.reduce((acc, subject) => {
          acc[subject] = 0;
          return acc;
        }, {}),
      };
    });

    // Debug to verify schoolData structure
  } catch (error) {
    console.error("Error fetching school data:", error);
  }
}

// Fetch points from each subject sheet and update schoolData
async function fetchSubjectData(sheetName) {
  const query = encodeURIComponent("SELECT D, U"); // D: School ID/Name, U: Points
  const url = `${BASE_URL}sheet=${sheetName}&tq=${query}`;

  try {
    const response = await fetch(url);
    const data = await response.text();
    const rows = JSON.parse(data.substring(47).slice(0, -2)).table.rows;

    // Create a list of school names for fuzzy matching
    const schoolNames = Object.values(schoolData).map((school) => school.name);

    // Use Fuse.js for fuzzy searching
    const fuse = new Fuse(schoolNames, { includeScore: true });

    // Process rows, skipping the first two rows (0 and 1)
    rows.slice(2).forEach((row) => {
      const data = row.c.map((cell) => (cell ? cell.v : ""));
      const schoolName = data[0] || ""; // Get the school name directly (no standardization)
      const points = parseFloat(data[1]) || 0; // Points column

      // Attempt matching using fuzzy search
      const result = fuse.search(schoolName);

      if (result.length > 0) {
        const matchedSchoolName = result[0].item;
        const matchedSchoolId = Object.keys(schoolData).find(
          (id) => schoolData[id].name === matchedSchoolName
        );
        if (matchedSchoolId) {
          // Check if points already exist, if so, sum them
          if (schoolData[matchedSchoolId].points[sheetName]) {
            schoolData[matchedSchoolId].points[sheetName] += points; // Add points for the subject
          } else {
            schoolData[matchedSchoolId].points[sheetName] = points; // Assign points for the subject if not present
          }
        }
      } else {
        console.warn(`School "${schoolName}" not found in schoolData.`);
      }
    });
  } catch (error) {
    console.error(`Error fetching data for ${sheetName}:`, error);
  }
}

// Display school ranking with all subjects and calculated total
function displaySchoolRanking() {
  const schoolTable = document.getElementById("schoolTable");

  // Calculate total points for each school and store with their data
  const schoolDataWithTotal = Object.values(schoolData).map((school) => {
    const totalPoints = subjects.reduce(
      (acc, subject) => acc + school.points[subject],
      0
    );
    return { ...school, totalPoints };
  });

  // Sort schools by total points in descending order for ranking
  sortedSchoolData = schoolDataWithTotal.sort(
    (a, b) => b.totalPoints - a.totalPoints
  );

  // Add rank to each school
  sortedSchoolData.forEach((school, index) => {
    school.rank = index + 1; // Rank starts at 1
  });

  // Build table header
  const headerRow = `
        <tr>
          <th>Rank</th>
          <th>School Name</th>
          <th>Sub County</th>
          ${subjects.map((subject) => `<th>${subject}</th>`).join("")}
          <th>Total Points</th>
        </tr>
      `;

  // Build table body with ranked schools
  const bodyRows = sortedSchoolData
    .map(
      (school) => `
          <tr>
            <td>${school.rank}</td>
            <td>${school.name}</td>
            <td>${school.subCounty}</td>
            ${subjects
              .map((subject) => `<td>${school.points[subject]}</td>`)
              .join("")}
            <td>${school.totalPoints}</td>
          </tr>
        `
    )
    .join("");

  // Construct full table and inject into the DOM
  schoolTable.innerHTML = `
        <table>
          <thead>${headerRow}</thead>
          <tbody>${bodyRows}</tbody>
        </table>
      `;
}

// Download functionalities can be added here as needed

function exportToPDF() {
  const schoolTable = document.getElementById("schoolTable");

  const options = {
    margin: 1,
    filename: "School_Ranking_Table.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "pt", format: "a4", orientation: "landscape" },
  };

  html2pdf().set(options).from(schoolTable).save();
}
function exportToExcel() {
  const schoolTable = document.getElementById("schoolTable");

  // Initialize a workbook and add worksheet from table
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.table_to_sheet(schoolTable);

  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "School Ranking");

  // Export the workbook to an Excel file
  XLSX.writeFile(workbook, "School_Ranking_Table.xlsx");
}

let projectsData = {}; // Store project details organized by subject

// Fetch data for all subjects
async function fetchAllSubjectData() {
  for (const subject of subjects) {
    const query = encodeURIComponent("SELECT B, C, D, E, U"); // Assuming columns correspond to data needed
    const url = `${BASE_URL}sheet=${subject}&tq=${query}`;

    try {
      const response = await fetch(url);
      const data = await response.text();
      const rows = JSON.parse(data.substring(47).slice(0, -2)).table.rows;

      if (!projectsData[subject]) projectsData[subject] = []; // Initialize subject in projectsData

      rows.slice(2).forEach((row) => {
        const rowData = row.c.map((cell) => (cell ? cell.v : ""));
        const name1 = rowData[0] || ""; // First candidate name
        const name2 = rowData[1] || ""; // Second candidate name
        const schoolName = rowData[2] || ""; // School name
        const projectName = rowData[3] || ""; // Project name
        const points = parseFloat(rowData[4]) || 0; // Score points

        // Add project data to the specific subject category
        projectsData[subject].push({
          name1,
          name2,
          schoolName,
          projectName,
          points,
        });
      });
    } catch (error) {
      console.error(`Error fetching data for ${subject}:`, error);
    }
  }
}

// Display the top three projects for each subject
function displayTopThreeProjects() {
  const top3Table = document.getElementById("top3Table");

  let tableContent = `
    <table>
      <thead>
        <tr>
          <th colspan="6" style="text-align:center; font-size: 1.5em; padding: 10px;">KENYA SCIENCE AND ENGINEERING FAIR 2025</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Process each subject to get top three projects
  for (const subject in projectsData) {
    // Add an empty row, subject header row, and column headers for each subject
    tableContent += `
      <tr><td colspan="6"></td></tr>
      <tr><td colspan="6"><strong>${subject}</strong></td></tr>
      <tr>
        <th>Rank</th>
        <th>Name1</th>
        <th>Name2</th>
        <th>School</th>
        <th>Project Name</th>
        <th>Score</th>
      </tr>
    `;

    // Sort projects by score in descending order and get the top three
    const sortedProjects = projectsData[subject].sort(
      (a, b) => b.points - a.points
    );
    const topThree = sortedProjects.slice(0, 3);

    // Add the top three rows for the current subject
    topThree.forEach((project, index) => {
      tableContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${project.name1}</td>
          <td>${project.name2}</td>
          <td>${project.schoolName}</td>
          <td>${project.projectName}</td>
          <td>${project.points}</td>
        </tr>
      `;
    });
  }

  tableContent += `</tbody></table>`;
  top3Table.innerHTML = tableContent;
}
function displayTopFourProjects() {
  const top4Table = document.getElementById("top4Table");

  let tableContent = `
    <table>
      <thead>
        <tr>
          <th colspan="6" style="text-align:center; font-size: 1.5em; padding: 10px;">KENYA SCIENCE AND ENGINEERING FAIR 2025</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Process each subject to get top four projects
  for (const subject in projectsData) {
    // Add an empty row, subject header row, and column headers for each subject
    tableContent += `
      <tr><td colspan="6"></td></tr>
      <tr><td colspan="6"><strong>${subject}</strong></td></tr>
      <tr>
        <th>Rank</th>
        <th>Name1</th>
        <th>Name2</th>
        <th>School</th>
        <th>Project Name</th>
        <th>Score</th>
      </tr>
    `;

    // Sort projects by score in descending order and get the top four
    const sortedProjects = projectsData[subject].sort(
      (a, b) => b.points - a.points
    );
    const topFour = sortedProjects.slice(0, 4); // Get top four projects

    // Add the top four rows for the current subject
    topFour.forEach((project, index) => {
      tableContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${project.name1}</td>
          <td>${project.name2}</td>
          <td>${project.schoolName}</td>
          <td>${project.projectName}</td>
          <td>${project.points}</td>
        </tr>
      `;
    });
  }

  tableContent += `</tbody></table>`;
  top4Table.innerHTML = tableContent;
}

// Run the data fetch and display functions
async function loadAndDisplayTopProjects() {
  await fetchAllSubjectData();
  displayTopThreeProjects();
  displayTopFourProjects();
}

// Call loadAndDisplayTopProjects() when the page is ready or on button click
document.addEventListener("DOMContentLoaded", loadAndDisplayTopProjects);

function downloadAsPDF() {
  const top3Table = document.getElementById("top3Table");

  const options = {
    margin: 1,
    filename: "Top_Three_Projects_By_Category.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "pt", format: "a4", orientation: "landscape" },
  };

  html2pdf().set(options).from(top3Table).save();
}
function downloadAsExcel() {
  const top3Table = document.getElementById("top3Table");

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.table_to_sheet(top3Table);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Top 3 Projects");
  XLSX.writeFile(workbook, "Top_Three_Projects_By_Category.xlsx");
}
function downloadTop4AsPDF() {
  const top4Table = document.getElementById("top4Table");

  const options = {
    margin: 1,
    filename: "Top_Four_Projects_By_Category.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "pt", format: "a4", orientation: "landscape" },
  };

  html2pdf().set(options).from(top4Table).save();
}

function downloadTop4AsExcel() {
  const top4Table = document.getElementById("top4Table");

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.table_to_sheet(top4Table);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Top 4 Projects");
  XLSX.writeFile(workbook, "Top_Four_Projects_By_Category.xlsx");
}
