const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
  type: {
    type: String,
    required: [true, "Type is required"],
    enum: ["Gig", "Game", "Asset"], // Allowed types, keeping as in Asset model
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: [
      "Graphics & Design",
      "Programming & Tech",
      "Digital Marketing",
      "Music & Audio",
      "Video & Animation",
      "Writing & Translation",
      "Photography",
      "Consulting",
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
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  packages: [
    {
      name: {
        type: String,
        required: [true, "Package name is required"],
        enum: ["Basic", "Standard", "Premium"], // Restrict to predefined package names
      },
      price: {
        type: Number,
        required: [true, "Package price is required"],
      },
      services: {
        type: String,
        required: [true, "Package services are required"],
      },
    },
  ],
  keywords: {
    type: [String], // Array of keywords
    required: [true, "Keywords are required"],
  },
  images: {
    type: [String], // Array of image URLs
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Gig = mongoose.model("Gig", gigSchema);

module.exports = Gig;
