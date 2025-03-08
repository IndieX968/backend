const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    type: { type: String, enum: ["Gig", "Game", "Asset"], required: true },
    category: { type: String, required: true },
    youtubeLink: { type: String },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    fileSize: { type: Number, required: true },
    latestVersion: { type: String, required: true },
    description: { type: String, required: true },
    technicalDetail: { type: String, required: true },
    keywords: [{ type: String }],
    earlyAccess: { type: Boolean, default: false },
    platform: { type: String, required: true },
    mobileType: { type: String }, // Optional, only for Mobile platform
    images: [{ type: String }], // Array of Cloudinary URLs
    webglDemoZip: { type: String }, // Optional Cloudinary URL for WebGL demo ZIP
    ratingAverage: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Game", gameSchema);
