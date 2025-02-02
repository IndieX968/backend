const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  phoneNumber: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"],
  },
  role: {
    type: String,
    enum: ["buyer", "seller"],
    required: [true, "Role is required"],
  },
  profilePic: {
    type: String,
    default: null, // Optional, defaults to null if no picture is uploaded
  },
});

module.exports = mongoose.model("User", userSchema);
