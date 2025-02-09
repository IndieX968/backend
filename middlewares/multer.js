const multer = require("multer");

// Use memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
