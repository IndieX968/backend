const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Store = require("../models/storeSchema");
const uploadToCloudinary = require("../middlewares/uploadToCloudinary");
const Asset = require("../models/Asset");
const Gig = require("../models/gigSchema");

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

exports.createAsset = async (req, res) => {
  try {
    const {
      storeId,
      type,
      category,
      youtubeLink,
      productName,
      price,
      discount,
      fileSize,
      latestVersion,
      description,
      keywords,
    } = req.body;
    console.log(req.body);
    // Validate storeId
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Validate type
    if (!["Gig", "Game", "Asset"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    // Get uploaded image URLs
    const imageUrls = [];
    if (req.files.images) {
      for (const image of req.files.images) {
        const result = await uploadToCloudinary(
          image.buffer,
          image.originalname.split(".").pop()
        );
        imageUrls.push(result.secure_url);
      }
    }

    // Get uploaded ZIP file URL
    let zipFileUrl = null;
    if (req.files.zipFile) {
      const zipFile = req.files.zipFile[0];
      const result = await uploadToCloudinary(
        zipFile.buffer,
        zipFile.originalname.split(".").pop()
      );
      zipFileUrl = result.secure_url;
    }

    if (!zipFileUrl) {
      return res.status(400).json({ message: "ZIP file is required" });
    }

    // Create new asset
    const newAsset = new Asset({
      store: storeId,
      type,
      category,
      youtubeLink,
      productName,
      price,
      discount,
      fileSize,
      latestVersion,
      description,
      keywords: keywords.split(",").map((kw) => kw.trim()), // Convert comma-separated string to array
      images: imageUrls,
      zipFile: zipFileUrl,
    });

    await newAsset.save();

    res
      .status(201)
      .json({ message: "Asset created successfully", asset: newAsset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAssetsByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    // Find assets owned by the store
    const assets = await Asset.find({ store: storeId }).select(
      "images productName store ratingAverage totalRating type price discount"
    );

    if (!assets || assets.length === 0) {
      return res
        .status(404)
        .json({ message: "No assets found for this store." });
    }
    const assetsWithStore = await Promise.all(
      assets.map(async (asset) => {
        const store = await Store.findById(asset.store); // Fetch store details using the store ID
        return {
          ...asset.toObject(), // Convert Mongoose document to a plain JavaScript object
          store: store || null, // Attach the store details (or null if store not found)
        };
      })
    );
    res.status(200).json({ assets: assetsWithStore });
  } catch (error) {
    console.error("Error fetching store assets:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllAssets = async (req, res) => {
  try {
    // Find all assets
    const assets = await Asset.find().select(
      "images productName store ratingAverage totalRating type price discount"
    );

    if (!assets || assets.length === 0) {
      return res.status(404).json({ message: "No assets found." });
    }

    // Fetch store details for each asset
    const assetsWithStore = await Promise.all(
      assets.map(async (asset) => {
        const store = await Store.findById(asset.store); // Fetch store details using the store ID
        return {
          ...asset.toObject(), // Convert Mongoose document to a plain JavaScript object
          store: store || null, // Attach the store details (or null if store not found)
        };
      })
    );

    res.status(200).json({ assets: assetsWithStore });
  } catch (error) {
    console.error("Error fetching all assets:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAssetDetails = async (req, res) => {
  try {
    const { assetId } = req.params;

    // Find the asset by ID
    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({ message: "Asset not found." });
    }
    const store = await Store.findById(asset.store);
    res.status(200).json({
      ...asset.toObject(), // Convert Mongoose document to a plain JavaScript object
      store: store || null,
    });
  } catch (error) {
    console.error("Error fetching asset details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createGig = async (req, res) => {
  try {
    const {
      storeId,
      type,
      category,
      youtubeLink,
      productName,
      description,
      packages, // Expecting JSON string or array of { name, price, services }
      keywords,
    } = req.body;

    console.log(req.body);

    // Validate storeId
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Validate type
    if (!["Gig", "Game", "Asset"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    // Validate packages (ensure it's an array with 3 valid packages)
    let parsedPackages;
    try {
      parsedPackages =
        typeof packages === "string" ? JSON.parse(packages) : packages;
      if (!Array.isArray(parsedPackages) || parsedPackages.length !== 3) {
        return res.status(400).json({
          message: "Exactly 3 packages (Basic, Standard, Premium) are required",
        });
      }
      const validPackageNames = ["Basic", "Standard", "Premium"];
      for (const pkg of parsedPackages) {
        if (
          !validPackageNames.includes(pkg.name) ||
          !pkg.price ||
          !pkg.services
        ) {
          return res.status(400).json({
            message:
              "Each package must have a valid name (Basic, Standard, Premium), price, and services",
          });
        }
      }
    } catch (error) {
      return res.status(400).json({ message: "Invalid packages format" });
    }

    // Get uploaded image URLs
    const imageUrls = [];
    if (req.files && req.files.images) {
      for (const image of req.files.images) {
        const result = await uploadToCloudinary(
          image.buffer,
          image.originalname.split(".").pop()
        );
        imageUrls.push(result.secure_url);
      }
    }

    if (imageUrls.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    // Create new gig
    const newGig = new Gig({
      store: storeId,
      type,
      category,
      youtubeLink,
      productName,
      description: description, // Placeholder description
      packages: parsedPackages,
      keywords: keywords.split(",").map((kw) => kw.trim()), // Convert comma-separated string to array
      images: imageUrls,
    });

    await newGig.save();

    res.status(201).json({ message: "Gig created successfully", gig: newGig });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getGigsByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Find gigs owned by the store
    const gigs = await Gig.find({ store: storeId }).select(
      "images productName store type packages category"
    );

    if (!gigs || gigs.length === 0) {
      return res.status(404).json({ message: "No gigs found for this store." });
    }

    const gigsWithStore = await Promise.all(
      gigs.map(async (gig) => {
        const store = await Store.findById(gig.store); // Fetch store details using the store ID
        return {
          ...gig.toObject(), // Convert Mongoose document to a plain JavaScript object
          store: store || null, // Attach the store details (or null if store not found)
        };
      })
    );

    res.status(200).json({ gigs: gigsWithStore });
  } catch (error) {
    console.error("Error fetching store gigs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getAllGigs = async (req, res) => {
  try {
    // Find all gigs
    const gigs = await Gig.find().select(
      "images productName store type packages category"
    );

    if (!gigs || gigs.length === 0) {
      return res.status(404).json({ message: "No gigs found." });
    }

    // Fetch store details for each gig
    const gigsWithStore = await Promise.all(
      gigs.map(async (gig) => {
        const store = await Store.findById(gig.store); // Fetch store details using the store ID
        return {
          ...gig.toObject(), // Convert Mongoose document to a plain JavaScript object
          store: store || null, // Attach the store details (or null if store not found)
        };
      })
    );

    res.status(200).json({ gigs: gigsWithStore });
  } catch (error) {
    console.error("Error fetching all gigs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getGigDetails = async (req, res) => {
  try {
    const { gigId } = req.params;

    // Find the gig by ID
    const gig = await Gig.findById(gigId);

    if (!gig) {
      return res.status(404).json({ message: "Gig not found." });
    }

    const store = await Store.findById(gig.store);
    res.status(200).json({
      ...gig.toObject(), // Convert Mongoose document to a plain JavaScript object
      store: store || null,
    });
  } catch (error) {
    console.error("Error fetching gig details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
