const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Store = require("../models/storeSchema");
const uploadToCloudinary = require("../middlewares/uploadToCloudinary");
const Asset = require("../models/Asset");
const Gig = require("../models/gigSchema");
const Cart = require("../models/Cart");
const Game = require("../models/Game");
const Review = require("../models/Review");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
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
      "images productName store type price discount"
    );

    if (!assets || assets.length === 0) {
      return res
        .status(404)
        .json({ message: "No assets found for this store." });
    }

    // Fetch store details and calculate rating stats for each asset
    const assetsWithStoreAndRatings = await Promise.all(
      assets.map(async (asset) => {
        const store = await Store.findById(asset.store); // Fetch store details

        // Calculate rating stats from reviews
        const ratingStats = await Review.aggregate([
          {
            $match: {
              itemId: new mongoose.Types.ObjectId(asset._id), // Match reviews for this asset
              itemType: "asset",
            },
          },
          {
            $group: {
              _id: null,
              ratingAverage: { $avg: "$rating" }, // Average rating out of 5
              totalRating: { $sum: 1 }, // Total number of ratings
            },
          },
        ]);

        const ratingAverage =
          ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
        const totalRating =
          ratingStats.length > 0 ? ratingStats[0].totalRating : 0;

        return {
          ...asset.toObject(), // Convert Mongoose document to plain JS object
          store: store || null, // Attach store details (or null if not found)
          ratingAverage: parseFloat(ratingAverage.toFixed(1)), // Average rating out of 5
          totalRating, // Total number of ratings
        };
      })
    );

    res.status(200).json({ assets: assetsWithStoreAndRatings });
  } catch (error) {
    console.error("Error fetching store assets:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getAllAssets = async (req, res) => {
  try {
    // Find all assets
    const assets = await Asset.find().select(
      "images productName store type price discount"
    );

    if (!assets || assets.length === 0) {
      return res.status(404).json({ message: "No assets found." });
    }

    // Fetch store details and calculate rating stats for each asset
    const assetsWithStoreAndRatings = await Promise.all(
      assets.map(async (asset) => {
        const store = await Store.findById(asset.store); // Fetch store details

        // Calculate rating stats from reviews
        const ratingStats = await Review.aggregate([
          {
            $match: {
              itemId: new mongoose.Types.ObjectId(asset._id), // Match reviews for this asset
              itemType: "asset",
            },
          },
          {
            $group: {
              _id: null,
              ratingAverage: { $avg: "$rating" }, // Average rating out of 5
              totalRating: { $sum: 1 }, // Total number of ratings
            },
          },
        ]);

        const ratingAverage =
          ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
        const totalRating =
          ratingStats.length > 0 ? ratingStats[0].totalRating : 0;
        return {
          ...asset.toObject(), // Convert Mongoose document to plain JS object
          store: store || null, // Attach store details (or null if not found)
          ratingAverage: parseFloat(ratingAverage.toFixed(1)), // Average rating out of 5
          totalRating, // Total number of ratings
        };
      })
    );

    res.status(200).json({ assets: assetsWithStoreAndRatings });
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

    // Fetch store details
    const store = await Store.findById(asset.store);

    // Calculate rating stats from reviews
    const ratingStats = await Review.aggregate([
      {
        $match: {
          itemId: new mongoose.Types.ObjectId(assetId), // Match reviews for this asset
          itemType: "asset",
        },
      },
      {
        $group: {
          _id: null,
          ratingAverage: { $avg: "$rating" }, // Average rating out of 5
          totalRating: { $sum: 1 }, // Total number of ratings
        },
      },
    ]);

    const ratingAverage =
      ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
    const totalRating = ratingStats.length > 0 ? ratingStats[0].totalRating : 0;

    // Return asset details with store and calculated ratings
    res.status(200).json({
      ...asset.toObject(), // Convert Mongoose document to plain JS object
      store: store || null, // Attach store details (or null if not found)
      ratingAverage: parseFloat(ratingAverage.toFixed(1)), // Average rating out of 5
      totalRating, // Total number of ratings
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

    // Fetch store details and calculate rating stats for each gig
    const gigsWithStoreAndRatings = await Promise.all(
      gigs.map(async (gig) => {
        const store = await Store.findById(gig.store); // Fetch store details

        // Calculate rating stats from reviews
        const ratingStats = await Review.aggregate([
          {
            $match: {
              itemId: new mongoose.Types.ObjectId(gig._id), // Match reviews for this gig
              itemType: "gig",
            },
          },
          {
            $group: {
              _id: null,
              ratingAverage: { $avg: "$rating" }, // Average rating out of 5
              totalRating: { $sum: 1 }, // Total number of ratings
            },
          },
        ]);

        const ratingAverage =
          ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
        const totalRating =
          ratingStats.length > 0 ? ratingStats[0].totalRating : 0;

        return {
          ...gig.toObject(), // Convert Mongoose document to plain JS object
          store: store || null, // Attach store details (or null if not found)
          ratingAverage: parseFloat(ratingAverage.toFixed(1)), // Average rating out of 5
          totalRating, // Total number of ratings
        };
      })
    );

    res.status(200).json({ gigs: gigsWithStoreAndRatings });
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

    // Fetch store details and calculate rating stats for each gig
    const gigsWithStoreAndRatings = await Promise.all(
      gigs.map(async (gig) => {
        const store = await Store.findById(gig.store); // Fetch store details

        // Calculate rating stats from reviews
        const ratingStats = await Review.aggregate([
          {
            $match: {
              itemId: new mongoose.Types.ObjectId(gig._id), // Match reviews for this gig
              itemType: "gig",
            },
          },
          {
            $group: {
              _id: null,
              ratingAverage: { $avg: "$rating" }, // Average rating out of 5
              totalRating: { $sum: 1 }, // Total number of ratings
            },
          },
        ]);

        const ratingAverage =
          ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
        const totalRating =
          ratingStats.length > 0 ? ratingStats[0].totalRating : 0;

        return {
          ...gig.toObject(), // Convert Mongoose document to plain JS object
          store: store || null, // Attach store details (or null if not found)
          ratingAverage: parseFloat(ratingAverage.toFixed(1)), // Average rating out of 5
          totalRating, // Total number of ratings
        };
      })
    );

    res.status(200).json({ gigs: gigsWithStoreAndRatings });
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

    // Fetch store details
    const store = await Store.findById(gig.store);

    // Calculate rating stats from reviews
    const ratingStats = await Review.aggregate([
      {
        $match: {
          itemId: new mongoose.Types.ObjectId(gigId), // Match reviews for this gig
          itemType: "gig",
        },
      },
      {
        $group: {
          _id: null,
          ratingAverage: { $avg: "$rating" }, // Average rating out of 5
          totalRating: { $sum: 1 }, // Total number of ratings
        },
      },
    ]);

    const ratingAverage =
      ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
    const totalRating = ratingStats.length > 0 ? ratingStats[0].totalRating : 0;

    // Return gig details with store and calculated ratings
    res.status(200).json({
      ...gig.toObject(), // Convert Mongoose document to plain JS object
      store: store || null, // Attach store details (or null if not found)
      ratingAverage: parseFloat(ratingAverage.toFixed(1)), // Average rating out of 5
      totalRating, // Total number of ratings
    });
  } catch (error) {
    console.error("Error fetching gig details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { userId, itemId, type } = req.body;

    if (!userId || !itemId || !type) {
      return res
        .status(400)
        .json({ message: "User ID, Item ID, and Type are required" });
    }
    if (!["Asset", "Game"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Invalid item type. Must be 'Asset' or 'Game'" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.itemId.toString() === itemId && item.type === type
    );

    if (existingItemIndex !== -1) {
      return res.status(400).json({ message: "Item already in cart" });
    }

    cart.items.push({ itemId, type });
    await cart.save();

    res.status(200).json({ message: "Item added to cart successfully", cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch the cart without initial population
    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
      return res
        .status(200)
        .json({ message: "Cart is empty", cart: { items: [] } });
    }

    // Manually populate items based on their type
    const populatedItems = await Promise.all(
      cart.items.map(async (cartItem) => {
        let item;
        if (cartItem.type === "Asset") {
          item = await Asset.findById(cartItem.itemId)
            .select("images productName store price discount")
            .populate("store", "name");
        } else if (cartItem.type === "Game") {
          item = await Game.findById(cartItem.itemId)
            .select("images productName store price discount")
            .populate("store", "name");
        }

        // Return the populated item with quantity and type
        return item
          ? {
              itemId: item,
              quantity: cartItem.quantity,
              type: cartItem.type,
            }
          : null;
      })
    );

    // Filter out null items (e.g., if item was deleted or type is invalid)
    const filteredItems = populatedItems.filter((item) => item !== null);

    // Construct the response cart object
    const populatedCart = {
      ...cart.toObject(),
      items: filteredItems,
    };

    res.status(200).json({
      message: "Cart retrieved successfully",
      cart: populatedCart,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { userId, itemId, type } = req.body;

    if (!userId || !itemId || !type) {
      return res
        .status(400)
        .json({ message: "User ID, Item ID, and Type are required" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => !(item.itemId.toString() === itemId && item.type === type)
    );
    await cart.save();

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createGame = async (req, res) => {
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
      technicalDetail,
      keywords,
      earlyAccess,
      platform,
      mobileType,
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

    // Validate platform
    if (!["Mobile", "Desktop", "WebGL"].includes(platform)) {
      return res.status(400).json({ message: "Invalid platform" });
    }

    // Validate mobileType if platform is Mobile
    if (
      platform === "Mobile" &&
      !["iOS", "Android", "Both"].includes(mobileType)
    ) {
      return res.status(400).json({ message: "Invalid mobile type" });
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

    // Get uploaded WebGL demo ZIP file URL (optional)
    let webglDemoZipUrl = null;
    if (platform === "WebGL" && req.files && req.files.webglDemoZip) {
      const zipFile = req.files.webglDemoZip[0];
      const result = await uploadToCloudinary(
        zipFile.buffer,
        zipFile.originalname.split(".").pop()
      );
      webglDemoZipUrl = result.secure_url;
    }

    // Create new game
    const newGame = new Game({
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
      technicalDetail,
      keywords: keywords.split(",").map((kw) => kw.trim()), // Convert comma-separated string to array
      earlyAccess: earlyAccess === "true" || earlyAccess === true, // Handle string "true" from form
      platform,
      mobileType: platform === "Mobile" ? mobileType : undefined,
      images: imageUrls,
      webglDemoZip: webglDemoZipUrl,
    });

    await newGame.save();

    res
      .status(201)
      .json({ message: "Game created successfully", game: newGame });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getGamesByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Find games owned by the store
    const games = await Game.find({ store: storeId }).select(
      "images productName store type price discount"
    );

    if (!games || games.length === 0) {
      return res
        .status(404)
        .json({ message: "No games found for this store." });
    }

    // Fetch store details and calculate rating stats for each game
    const gamesWithStoreAndRatings = await Promise.all(
      games.map(async (game) => {
        const store = await Store.findById(game.store); // Fetch store details

        // Calculate rating stats from reviews
        const ratingStats = await Review.aggregate([
          {
            $match: {
              itemId: new mongoose.Types.ObjectId(game._id), // Match reviews for this game
              itemType: "game",
            },
          },
          {
            $group: {
              _id: null,
              ratingAverage: { $avg: "$rating" }, // Average rating out of 5
              totalRating: { $sum: 1 }, // Total number of ratings
            },
          },
        ]);

        const ratingAverage =
          ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
        const totalRating =
          ratingStats.length > 0 ? ratingStats[0].totalRating : 0;

        return {
          ...game.toObject(), // Convert Mongoose document to plain JS object
          store: store || null, // Attach store details (or null if not found)
          ratingAverage: parseFloat(ratingAverage.toFixed(1)), // Average rating out of 5
          totalRating, // Total number of ratings
        };
      })
    );

    res.status(200).json({ games: gamesWithStoreAndRatings });
  } catch (error) {
    console.error("Error fetching store games:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllGames = async (req, res) => {
  try {
    // Find all games
    const games = await Game.find().select(
      "images productName store type price discount"
    );

    if (!games || games.length === 0) {
      return res.status(404).json({ message: "No games found." });
    }

    // Fetch store details and calculate rating stats for each game
    const gamesWithStoreAndRatings = await Promise.all(
      games.map(async (game) => {
        const store = await Store.findById(game.store); // Fetch store details

        // Calculate rating stats from reviews
        const ratingStats = await Review.aggregate([
          {
            $match: {
              itemId: new mongoose.Types.ObjectId(game._id), // Match reviews for this game
              itemType: "game",
            },
          },
          {
            $group: {
              _id: null,
              ratingAverage: { $avg: "$rating" }, // Average rating out of 5
              totalRating: { $sum: 1 }, // Total number of ratings
            },
          },
        ]);

        const ratingAverage =
          ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
        const totalRating =
          ratingStats.length > 0 ? ratingStats[0].totalRating : 0;

        return {
          ...game.toObject(), // Convert Mongoose document to plain JS object
          store: store || null, // Attach store details (or null if not found)
          ratingAverage: parseFloat(ratingAverage.toFixed(1)), // Average rating out of 5
          totalRating, // Total number of ratings
        };
      })
    );

    res.status(200).json({ games: gamesWithStoreAndRatings });
  } catch (error) {
    console.error("Error fetching all games:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getGameDetails = async (req, res) => {
  try {
    const { gameId } = req.params;

    // Find the game by ID
    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(404).json({ message: "Game not found." });
    }

    // Fetch store details
    const store = await Store.findById(game.store);

    // Calculate rating stats from reviews
    const ratingStats = await Review.aggregate([
      {
        $match: {
          itemId: new mongoose.Types.ObjectId(gameId), // Match reviews for this game
          Frankensteined: true,
          itemType: "game",
        },
      },
      {
        $group: {
          _id: null,
          ratingAverage: { $avg: "$rating" }, // Average rating out of 5
          totalRating: { $sum: 1 }, // Total number of ratings
        },
      },
    ]);

    const ratingAverage =
      ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
    const totalRating = ratingStats.length > 0 ? ratingStats[0].totalRating : 0;

    // Return game details with store and calculated ratings
    res.status(200).json({
      ...game.toObject(), // Convert Mongoose document to plain JS object
      store: store || null, // Attach store details (or null if not found)
      ratingAverage: parseFloat(ratingAverage.toFixed(1)), // Average rating out of 5
      totalRating, // Total number of ratings
    });
  } catch (error) {
    console.error("Error fetching game details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getItemsByTypeAndCategory = async (req, res) => {
  try {
    const { type, category } = req.params; // e.g., /Assets/3D Models
    const { price, sort, page = 1, limit = 10 } = req.query; // Removed rating filter

    let query = category ? { category } : {};
    let Model;
    let selectFields = "images productName store price discount type _id";
    let itemType;

    // Select model and adjust fields based on type
    switch (type.toLowerCase()) {
      case "assets":
        Model = Asset;
        itemType = "asset";
        break;
      case "gigs":
        Model = Gig;
        selectFields += " packages";
        itemType = "gig";
        break;
      case "games":
        Model = Game;
        itemType = "game";
        break;
      default:
        return res.status(400).json({ message: "Invalid type" });
    }

    // Price filter
    if (price) {
      if (price === "Free") query.price = 0;
      else if (price === "Under £10") query.price = { $lte: 10 };
      else if (price === "Under £20") query.price = { $lte: 20 };
      else if (price === "Under £50") query.price = { $lte: 50 };
    }

    // Sorting (ratingAverage removed from sort options)
    let sortOption = {};
    if (sort === "Price: Low to High") sortOption.price = 1;
    else if (sort === "Price: High to Low") sortOption.price = -1;
    // Default sort by creation date or another field if rating isn’t available
    else sortOption.createdAt = -1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Fetch items
    const items = await Model.find(query)
      .populate("store", "name")
      .select(selectFields)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalItems = await Model.countDocuments(query);

    // Calculate ratings for each item
    const itemsWithRatings = await Promise.all(
      items.map(async (item) => {
        const ratingStats = await Review.aggregate([
          {
            $match: {
              itemId: new mongoose.Types.ObjectId(item._id),
              itemType,
            },
          },
          {
            $group: {
              _id: null,
              ratingAverage: { $avg: "$rating" },
              totalRating: { $sum: 1 },
            },
          },
        ]);

        const ratingAverage =
          ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
        const totalRating =
          ratingStats.length > 0 ? ratingStats[0].totalRating : 0;

        return {
          ...item.toObject(),
          ratingAverage: parseFloat(ratingAverage.toFixed(1)),
          totalRating,
        };
      })
    );

    if (!itemsWithRatings || itemsWithRatings.length === 0) {
      return res.status(200).json({
        message: "No items found",
        items: [],
        totalItems: 0,
        currentPage: pageNum,
        totalPages: 0,
      });
    }

    res.status(200).json({
      message: "Items retrieved successfully",
      items: itemsWithRatings,
      totalItems,
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
    });
  } catch (error) {
    console.error("Error fetching items by type and category:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch all items by type with filters, sorting, and pagination
exports.getItemsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { price, sort, page = 1, limit = 10 } = req.query; // Removed rating filter

    let query = {};
    let Model;
    let selectFields = "images productName store price discount type _id";
    let itemType;

    // Select model and adjust fields based on type
    switch (type.toLowerCase()) {
      case "assets":
        Model = Asset;
        itemType = "asset";
        break;
      case "gigs":
        Model = Gig;
        selectFields += " packages";
        itemType = "gig";
        break;
      case "games":
        Model = Game;
        itemType = "game";
        break;
      default:
        return res.status(400).json({ message: "Invalid type" });
    }

    // Price filter
    if (price) {
      if (price === "Free") query.price = 0;
      else if (price === "Under £10") query.price = { $lte: 10 };
      else if (price === "Under £20") query.price = { $lte: 20 };
      else if (price === "Under £50") query.price = { $lte: 50 };
    }

    // Sorting (ratingAverage removed from sort options)
    let sortOption = {};
    if (sort === "Price: Low to High") sortOption.price = 1;
    else if (sort === "Price: High to Low") sortOption.price = -1;
    // Default sort by creation date or another field if rating isn’t available
    else sortOption.createdAt = -1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Fetch items
    const items = await Model.find(query)
      .populate("store", "name")
      .select(selectFields)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalItems = await Model.countDocuments(query);

    // Calculate ratings for each item
    const itemsWithRatings = await Promise.all(
      items.map(async (item) => {
        const ratingStats = await Review.aggregate([
          {
            $match: {
              itemId: new mongoose.Types.ObjectId(item._id),
              itemType,
            },
          },
          {
            $group: {
              _id: null,
              ratingAverage: { $avg: "$rating" },
              totalRating: { $sum: 1 },
            },
          },
        ]);

        const ratingAverage =
          ratingStats.length > 0 ? ratingStats[0].ratingAverage : 0;
        const totalRating =
          ratingStats.length > 0 ? ratingStats[0].totalRating : 0;

        return {
          ...item.toObject(),
          ratingAverage: parseFloat(ratingAverage.toFixed(1)),
          totalRating,
        };
      })
    );

    if (!itemsWithRatings || itemsWithRatings.length === 0) {
      return res.status(200).json({
        message: "No items found",
        items: [],
        totalItems: 0,
        currentPage: pageNum,
        totalPages: 0,
      });
    }

    res.status(200).json({
      message: "Items retrieved successfully",
      items: itemsWithRatings,
      totalItems,
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
    });
  } catch (error) {
    console.error("Error fetching items by type:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { itemId, itemType } = req.params;
    const { page = 1, limit = 10 } = req.query;
    console.log(itemId, itemType);
    if (!["asset", "gig", "game"].includes(itemType.toLowerCase())) {
      return res.status(400).json({ message: "Invalid item type" });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({
      itemId,
      itemType: itemType.toLowerCase(),
    })
      .populate("user", "username profilePic") // Populate username
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments({
      itemId,
      itemType: itemType.toLowerCase(),
    });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      {
        $match: {
          itemId: new mongoose.Types.ObjectId(itemId), // Use 'new' here
          itemType: itemType.toLowerCase(),
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 },
        },
      },
    ]);

    const avgRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 0;
    const totalRating = ratingStats.length > 0 ? ratingStats[0].total : 0;

    res.status(200).json({
      message: "Reviews retrieved successfully",
      reviews,
      totalReviews,
      currentPage: pageNum,
      totalPages: Math.ceil(totalReviews / limitNum),
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalRating,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Submit a new review
exports.createReview = async (req, res) => {
  try {
    const { itemId, itemType, rating, comment } = req.body;
    const userId = req.user.id; // Assuming auth middleware sets req.user

    if (!["asset", "gig", "game"].includes(itemType.toLowerCase())) {
      return res.status(400).json({ message: "Invalid item type" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Check if item exists
    let Model;
    switch (itemType.toLowerCase()) {
      case "asset":
        Model = Asset;
        break;
      case "gig":
        Model = Gig;
        break;
      case "game":
        Model = Game;
        break;
    }
    const item = await Model.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check if user already reviewed this item
    const existingReview = await Review.findOne({
      user: userId,
      itemId,
      itemType: itemType.toLowerCase(),
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this item" });
    }

    const review = new Review({
      user: userId,
      itemId,
      itemType: itemType.toLowerCase(),
      rating,
      comment,
    });

    await review.save();

    // Update item's rating stats
    const ratingStats = await Review.aggregate([
      {
        $match: {
          itemId: new mongoose.Types.ObjectId(itemId), // Add 'new' here
          itemType: itemType.toLowerCase(),
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 },
        },
      },
    ]);

    item.ratingAverage =
      ratingStats.length > 0 ? ratingStats[0].avgRating : rating;
    item.totalRating = ratingStats.length > 0 ? ratingStats[0].total : 1;
    await item.save();

    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { gigId, content } = req.body;
    const senderId = req.user.id; // Assuming user ID from auth middleware

    // Validate input
    if (!gigId || !content) {
      return res
        .status(400)
        .json({ message: "Gig ID and message content are required." });
    }

    // Find the gig to get the store owner (receiver)
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: "Gig not found." });
    }

    const store = await Store.findById(gig.store);
    const receiverId = store.user; // Adjust based on your Store schema
    if (!receiverId) {
      return res.status(400).json({ message: "Store owner not found" });
    }

    // Prevent sending message to self
    if (senderId === receiverId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot send message to yourself." });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({ gigId, initiatorId: senderId });
    if (!chat) {
      // Create a new chat if it doesn't exist
      chat = new Chat({
        gigId,
        initiatorId: senderId,
        gigOwnerId: receiverId,
      });
      await chat.save();
    }

    // Create new message with chatId
    const message = new Message({
      chatId: chat._id,
      sender: senderId,
      receiver: receiverId,
      content,
    });

    await message.save();

    res
      .status(201)
      .json({ message: "Message sent successfully", data: message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params; // Changed from gigId to chatId
    const userId = req.user.id; // Assuming user ID from auth middleware

    // Find messages for the specific chatId where the user is either sender or receiver
    const messages = await Message.find({
      chatId,
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "username profilePic") // Populate sender's username
      .populate("receiver", "username profilePic") // Populate receiver's username
      .sort({ timestamp: 1 }); // Sort by timestamp ascending
    if (!messages || messages.length === 0) {
      return res
        .status(200)
        .json({ message: "No chat history found.", messages: [] });
    }

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserChatList = async (req, res) => {
  try {
    const userId = req.user.id;

    const chatThreads = await Chat.find({
      $or: [{ initiatorId: userId }, { gigOwnerId: userId }],
    })
      .populate("gigId", "productName")
      .populate("initiatorId", "username profilePic")
      .populate("gigOwnerId", "username profilePic")
      .sort({ createdAt: -1 });

    const threadsWithLastMessage = await Promise.all(
      chatThreads.map(async (chat) => {
        const lastMessage = await Message.findOne({ gigId: chat.gigId })
          .sort({ timestamp: -1 })
          .select("content timestamp isRead sender");
        return {
          gigId: chat.gigId._id,
          gigName: chat.gigId.productName || "Unknown Gig",
          initiator: {
            id: chat.initiatorId._id,
            username: chat.initiatorId.username || "Unknown User",
            profilePic: chat.initiatorId.profilePic || "defaultImageUrl",
          },
          gigOwner: {
            id: chat.gigOwnerId._id,
            username: chat.gigOwnerId.username || "Unknown User",
            profilePic: chat.gigOwnerId.profilePic || "defaultImageUrl",
          },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                timestamp: lastMessage.timestamp,
                isRead: lastMessage.isRead,
                sender: lastMessage.sender,
              }
            : null,
          _id: chat._id,
        };
      })
    );

    res.status(200).json({ threads: threadsWithLastMessage });
  } catch (error) {
    console.error("Error fetching chat list:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.search = async (req, res) => {
  const { q } = req.query; // Search query from frontend

  if (!q || q.trim() === "") {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    // Case-insensitive regex for searching
    const searchRegex = new RegExp(q, "i");

    // Search Assets
    const assets = await Asset.find({
      $or: [
        { productName: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { keywords: searchRegex }, // Search within keywords array
      ],
    })
      .populate("store", "name") // Populate store name for display
      .limit(10); // Limit for performance

    // Search Gigs
    const gigs = await Gig.find({
      $or: [
        { productName: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { keywords: searchRegex },
      ],
    })
      .populate("store", "name")
      .limit(10);

    // Search Games
    const games = await Game.find({
      $or: [
        { productName: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { keywords: searchRegex },
      ],
    })
      .populate("store", "name")
      .limit(10);

    // Return combined results
    res.status(200).json({
      assets,
      gigs,
      games,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error during search" });
  }
};
