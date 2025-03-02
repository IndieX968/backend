const express = require("express");
const { createTest, testUploadZip } = require("../controllers/testController");
const upload = require("../middlewares/multer");

const router = express.Router();

router.post("/", createTest);

router.post("/upload-zip", upload.single("file"), testUploadZip);

module.exports = router;
