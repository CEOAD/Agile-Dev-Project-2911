const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;

const app = express();

// Get all the data from the body of the request
app.get('/', (req, res) => {
    //TODO: be careful, if u run this on a server, the path will be different for all imports
    res.sendFile(path.join(__dirname, '..', '..', 'Pages', 'MainPage', 'MainPage.html'));
});

// Start the server
app.listen(PORT);
