const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(express.json());
app.use(cors());

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // Replace with your own credentials.json path
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const spreadsheetId = "1iR7x1U6uJhyLhkueQ0vpg6eHSMAfEnWPMCgWTWQBDHM"; // Your Google Spreadsheet ID

// Function to update sheet data
async function updateSheetData(sheetRange, updatedData) {
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });

  await googleSheets.spreadsheets.values.update({
    spreadsheetId,
    range: sheetRange,
    valueInputOption: "USER_ENTERED", // Use USER_ENTERED to handle user-formatted input
    resource: {
      values: updatedData, // Updated data in the format [ [cell1, cell2], [cell3, cell4] ]
    },
  });
}

// Function to delete a row from the sheet
async function deleteRowFromSheet(sheetName, rowIndex) {
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });

  // Fetch sheet metadata to get the sheetId
  const sheetMeta = await googleSheets.spreadsheets.get({
    spreadsheetId,
  });
  const sheet = sheetMeta.data.sheets.find(
    (s) => s.properties.title === sheetName
  );
  const sheetId = sheet.properties.sheetId;

  // Prepare the request for deleting a row
  const request = {
    spreadsheetId,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  };

  await googleSheets.spreadsheets.batchUpdate(request);
}

// Route to update the sheet
app.post("/update", async (req, res) => {
  try {
    const { sheet, data } = req.body; // Destructure sheet and data from request body
    await updateSheetData(sheet, data);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating sheet:", error);
    res.status(500).json({ error: "Failed to update sheet" });
  }
});

// Route to delete a row from the sheet with dynamic sheet name
app.post("/delete", async (req, res) => {
  try {
    const { sheetName, rowIndex } = req.body; // Get sheetName and rowIndex from request body

    if (!sheetName || !rowIndex) {
      return res
        .status(400)
        .json({ message: "Sheet name and rowIndex are required" });
    }

    await deleteRowFromSheet(sheetName, rowIndex + 1); // Call function to delete the row dynamically
    res.status(200).json({ message: "Row deleted successfully" });
  } catch (error) {
    console.error("Error deleting row:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

// Express route to handle adding a school
app.post("/add-school", async (req, res) => {
  const { schoolName, subCounty } = req.body;

  if (!schoolName || !subCounty) {
    return res
      .status(400)
      .json({ message: "School name and sub-county are required." });
  }

  try {
    const addedSchool = await addSchoolToGoogleSheet(schoolName, subCounty);
    res.status(200).json({
      message: `School '${addedSchool.schoolName}' added successfully!`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Function to add a new school to Google Sheets
async function addSchoolToGoogleSheet(schoolName, subCounty) {
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });

  // Fetch existing data to check for uniqueness and get the last index
  const sheetData = await getSheetData();

  // Validate uniqueness
  const existingSchool = sheetData.find(
    (row) => row[1]?.toLowerCase() === schoolName.toLowerCase()
  );
  if (existingSchool) {
    throw new Error(`The school '${schoolName}' already exists.`);
  }

  // Generate the new index
  const newIndex = sheetData.length ? sheetData.length + 1 : 1; // Start at 1 if the sheet is empty

  // Append the new school to the Google Sheet
  await googleSheets.spreadsheets.values.append({
    auth,
    spreadsheetId,
    range: `SCHOOLS!A:C`, // Adjust range as needed
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [[newIndex, schoolName, subCounty]],
    },
  });

  return { newIndex, schoolName, subCounty };
}

// Function to get current data from Google Sheets
async function getSheetData() {
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const response = await googleSheets.spreadsheets.values.get({
    spreadsheetId,
    range: `SCHOOLS!A:C`, // Adjust range as needed (assume A = Index, B = School Name, C = Sub County)
  });

  return response.data.values || []; // Return data or empty array
}
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
