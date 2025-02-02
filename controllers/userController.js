const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Store = require("../models/storeSchema");
// @desc    Sign up a user
// @route   POST /api/users/signup
// @access  Public
exports.signUpUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      phoneNumber: null, // Optional: If no phoneNumber is provided, set it to null
      profilePic: null, // Optional: If no profilePic is provided, set it to null
      role: "buyer",
    });

    await user.save();
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const store = await Store.findOne({ user: user._id });
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic,
      },
      token,
      store,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.signInUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const store = await Store.findOne({ user: user._id });
    res.status(200).json({
      message: "Sign in successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic,
      },
      token,
      store,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;

    // Validate the new role
    const validRoles = ["buyer", "seller"];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Update the user's role
    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User role updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createStore = async (req, res) => {
  const { userId, name, description, image } = req.body;
  if (!userId || !name || !description) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const { userId, name, description, image } = req.body;
    const store = new Store({ user: userId, name, description, image });
    await store.save();
    res.status(201).json({ message: "Store created successfully", store });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.editStore = async (req, res) => {
  try {
    const { storeId, name, description, image } = req.body;
    if (!storeId) {
      return res.status(400).json({ message: "Store ID is required" });
    }
    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      { name, description, image },
      { new: true }
    );
    if (!updatedStore) {
      return res.status(404).json({ message: "Store not found" });
    }
    res
      .status(200)
      .json({ message: "Store updated successfully", store: updatedStore });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
