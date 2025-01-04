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
