const express = require('express');
const cors = require('cors');
const generateScript = require('./api/generate-script');  // Import your generate-script.js module

const app = express();

// Enable CORS to allow cross-origin requests
app.use(cors());
app.use(express.json());

// Define route for script generation
app.get('/api/generate-script', generateScript);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
