const express = require('express');
const app = express();
const path = require('path');

// Set the static folder
app.use(express.static(path.join(__dirname, 'public')));

// Get all the data from the body of the request
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
