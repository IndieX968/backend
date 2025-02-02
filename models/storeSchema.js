const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, "Store name is required"],
  },
  description: {
    type: String,
    required: [true, "Store description is required"],
  },
  image: {
    type: String, // URL or Base64 string for store image
    default: null,
  },
});

const Store = mongoose.model("Store", storeSchema);

module.exports = Store;
