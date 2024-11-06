require("dotenv").config();
const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const spreadsheetId = process.env.SPREADSHEET_ID;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(express.json());
app.use(cors({
  origin: 'https://bennie0893.github.io',  // Your frontend URL
}));
// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getGoogleSheetsClient() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

// Routes

// Update Sheet Data
app.post("/update", async (req, res) => {
  const { sheet, data } = req.body;
  if (!sheet || !data) return res.status(400).json({ error: "Invalid input." });
  
  try {
    const sheets = await getGoogleSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: sheet,
      valueInputOption: "USER_ENTERED",
      resource: { values: data },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating sheet:", error);
    res.status(500).json({ error: "Failed to update sheet" });
  }
});

// Delete Row
app.post("/delete", async (req, res) => {
  const { sheetName, rowIndex } = req.body;
  if (!sheetName || rowIndex == null) return res.status(400).json({ error: "Sheet name and row index required." });
  
  try {
    const sheets = await getGoogleSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = meta.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) return res.status(404).json({ error: "Sheet not found." });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{ deleteDimension: { range: { sheetId: sheet.properties.sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 }}}],
      },
    });
    res.json({ message: "Row deleted successfully" });
  } catch (error) {
    console.error("Error deleting row:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add School
app.post("/add-school", async (req, res) => {
  const { schoolName, subCounty } = req.body;
  if (!schoolName || !subCounty) return res.status(400).json({ error: "School name and sub-county are required." });

  try {
    const sheets = await getGoogleSheetsClient();
    const sheetData = await sheets.spreadsheets.values.get({ spreadsheetId, range: `SCHOOLS!A:C` });
    const existingSchool = sheetData.data.values.find(row => row[1]?.toLowerCase() === schoolName.toLowerCase());

    if (existingSchool) return res.status(400).json({ error: "School already exists." });

    const newIndex = sheetData.data.values.length + 1;
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `SCHOOLS!A:C`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [[newIndex, schoolName, subCounty]] },
    });
    res.json({ message: "School added successfully" });
  } catch (error) {
    console.error("Error adding school:", error);
    res.status(500).json({ error: "Failed to add school" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
