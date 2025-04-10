const app = require("../app");
const http = require("http");
const { Server } = require("socket.io"); // Import Server from socket.io
const Message = require("../models/Message"); // Adjust path
const Gig = require("../models/gigSchema"); // Adjust path
const Store = require("../models/storeSchema");
const Chat = require("../models/Chat");

const app = require("../app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
