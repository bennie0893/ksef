const db = new PouchDB('school_data');
const db2 = new PouchDB('projects_db');

// Display projects in a table format in a specific div
function displayschools(targetElementId) {
    const previewDiv = document.getElementById(targetElementId);
    previewDiv.innerHTML = '<p>Displaying schools registered...</p>';
    
    // Add logic to fetch and display results per category
}

// Display projects registered
function displayProjectsByCategory(targetElementId) {
    const previewDiv = document.getElementById(targetElementId);
    previewDiv.innerHTML = '<p>Displaying projects registered...</p>';
    
    // Add logic to fetch and display projects registered from PouchDB
    // Example content rendering logic...
      // Or any other specific logic for this link
}


// Display results by categories
function displayResultsByCategories(targetElementId) {
    const previewDiv = document.getElementById(targetElementId);
    previewDiv.innerHTML = '<p>Displaying results per categories...</p>';
    
    // Add logic to fetch and display results per category
}

// Display overall school results
function displayOverallResults(targetElementId) {
    const previewDiv = document.getElementById(targetElementId);
    previewDiv.innerHTML = '<p>Displaying overall school results...</p>';
    
    // Add logic to fetch and display overall school results
}

// Display top three projects
function displayTopThreeProjects(targetElementId) {
    const previewDiv = document.getElementById(targetElementId);
    previewDiv.innerHTML = '<p>Displaying top three projects...</p>';
    
    // Add logic to fetch and display top three projects
}
