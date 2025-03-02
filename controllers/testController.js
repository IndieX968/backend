const uploadToCloudinary = require("../middlewares/uploadToCloudinary");
const Test = require("../models/Test");

// @desc    Create a test entry
// @route   POST /api/test
// @access  Public
exports.createTest = async (req, res) => {
  try {
    const { name, age } = req.body;
    const test = new Test({ name, age });
    await test.save();
    res.status(201).json({ message: "Test created successfully", data: test });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
exports.testUploadZip = async (req, res) => {
  try {
    const fileBuffer = req.file.buffer;
    const fileFormat = req.file.originalname.split(".").pop(); // e.g., 'zip'

    const result = await uploadToCloudinary(fileBuffer, fileFormat);
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to upload ZIP file", error: error.message });
  }
};
