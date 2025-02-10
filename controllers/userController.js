const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Store = require("../models/storeSchema");
const uploadToCloudinary = require("../middlewares/uploadToCloudinary");

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

  const fileBuffer = req.file.buffer; // Access the file buffer from memory
  const fileFormat = req.file.mimetype.split("/")[1]; // Get the file format (e.g., 'jpg', 'png')
  console.log(fileBuffer, fileFormat);
  if (fileBuffer || fileFormat) {
    let imageUrl;
    try {
      // Upload the buffer directly to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(
        fileBuffer,
        fileFormat
      );

      if (!cloudinaryResponse) {
        return res
          .status(500)
          .json({ message: "Error uploading file to Cloudinary" });
      }
      imageUrl = cloudinaryResponse.secure_url;
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Error uploading file: ${error.message}` });
    }
  }

  if (!userId || !name || !description) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const { userId, name, description } = req.body;
    const store = new Store({
      user: userId,
      name,
      description,
      image: imageUrl,
    });
    await store.save();
    res.status(201).json({ message: "Store created successfully", store });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.editStore = async (req, res) => {
  try {
    const { storeId, name, description, image } = req.body;
    const fileBuffer = req.file.buffer; // Access the file buffer from memory
    const fileFormat = req.file.mimetype.split("/")[1]; // Get the file format (e.g., 'jpg', 'png')
    if (fileBuffer || fileFormat) {
      let imageUrl;
      try {
        // Upload the buffer directly to Cloudinary
        const cloudinaryResponse = await uploadToCloudinary(
          fileBuffer,
          fileFormat
        );
        if (!cloudinaryResponse) {
          return res
            .status(500)
            .json({ message: "Error uploading file to Cloudinary" });
        }
        imageUrl = cloudinaryResponse.secure_url;

        if (!storeId) {
          return res.status(400).json({ message: "Store ID is required" });
        }

        console.log(storeId, name, description, imageUrl);
        const updatedStore = await Store.findByIdAndUpdate(
          storeId,
          { name, description, image: imageUrl },
          { new: true }
        );
        console.log(updatedStore);
        if (!updatedStore) {
          return res.status(404).json({ message: "Store not found" });
        }
        res
          .status(200)
          .json({ message: "Store updated successfully", store: updatedStore });
      } catch (error) {
        return res
          .status(500)
          .json({ message: `Error uploading file: ${error.message}` });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { userId, username, email, phoneNumber, role } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields
    user.username = username || user.username;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.role = role || user.role;
    // Handle profile picture upload
    if (req.file) {
      const fileBuffer = req.file.buffer; // Access the file buffer from memory
      const fileFormat = req.file.mimetype.split("/")[1]; // Get the file format (e.g., 'jpg', 'png')
      // Upload the image to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(
        fileBuffer,
        fileFormat
      );
      if (!cloudinaryResponse) {
        return res
          .status(500)
          .json({ message: "Error uploading profile picture" });
      }

      // Save the Cloudinary URL to the user's profile
      user.profilePic = cloudinaryResponse.secure_url;
    }

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
