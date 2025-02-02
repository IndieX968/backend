const express = require("express");
const {
  signUpUser,
  signInUser,
  updateUserRole,
  createStore,
} = require("../controllers/userController");
const tokenValidator = require("../middlewares/errorHandler");

const router = express.Router();

// Signup route
router.post("/signup", signUpUser);

router.post("/signin", signInUser);

router.put("/update-role", tokenValidator, updateUserRole);

router.post("/store", tokenValidator, createStore);

module.exports = router;
