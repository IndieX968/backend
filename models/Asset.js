const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
  type: {
    type: String,
    required: [true, "Type is required"],
    enum: ["Gig", "Game", "Asset"], // Allowed types
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: [
      "3D Animation",
      "3D Models",
      "2D Animation",
      "2D Models",
      "Music",
      "Sound FX",
      "Particles",
      "Shaders",
    ],
  },
  youtubeLink: {
    type: String,
    default: "",
  },
  productName: {
    type: String,
    required: [true, "Product Name is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
  },
  discount: {
    type: Number,
    default: 0,
  },
  fileSize: {
    type: Number,
    required: [true, "File Size is required"],
  },
  latestVersion: {
    type: String,
    required: [true, "Latest Version is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  keywords: {
    type: [String], // Array of keywords
    required: [true, "Keywords are required"],
  },
  images: {
    type: [String], // Array of image URLs
    default: [],
  },
  zipFile: {
    type: String, // URL for the ZIP file
    required: [true, "ZIP file is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Asset = mongoose.model("Asset", assetSchema);

module.exports = Asset;
