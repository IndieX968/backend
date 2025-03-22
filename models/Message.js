const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Chat", // Reference to the Chat
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User", // Sender of the message
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User", // Receiver of the message
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false, // Track if the message has been read
  },
});

module.exports = mongoose.model("Message", messageSchema);
