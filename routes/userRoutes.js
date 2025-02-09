const express = require("express");
const {
  signUpUser,
  signInUser,
  updateUserRole,
  createStore,
  editStore,
  updateUserProfile,
} = require("../controllers/userController");
const tokenValidator = require("../middlewares/errorHandler");
const upload = require("../middlewares/multer");

const router = express.Router();

// Signup route
router.post("/signup", signUpUser);

router.post("/signin", signInUser);

router.put("/update-role", tokenValidator, updateUserRole);

router.post("/store", tokenValidator, upload.single("image"), createStore);

router.put("/update-store", tokenValidator, upload.single("image"), editStore);

router.put(
  "/update-profile",
  tokenValidator,
  upload.single("image"),
  updateUserProfile
);

module.exports = router;
