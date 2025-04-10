// const app = require("./app");
// const http = require("http");
// const { Server } = require("socket.io"); // Import Server from socket.io
// const Message = require("./models/Message"); // Adjust path
// const Gig = require("./models/gigSchema"); // Adjust path
// const Store = require("./models/storeSchema");
// const Chat = require("./models/Chat");

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Adjust to your frontend URL
//     methods: ["GET", "POST"],
//   },
// });

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   // Join a room based on gigId
//   socket.on("joinChat", (gigId) => {
//     socket.join(gigId);
//     console.log(`User ${socket.id} joined chat for gig ${gigId}`);
//   });

//   // Handle sending a message
//   socket.on("sendMessage", async (data, callback) => {
//     const { gigId, content, senderId, chat_Id } = data;
//     console.log("Message received:", data);
//     try {
//       // Validate input
//       if (!gigId || !content || !senderId) {
//         return callback({
//           status: "error",
//           message: "Missing required fields",
//         });
//       }

//       const gig = await Gig.findById(gigId);
//       if (!gig) {
//         return callback({ status: "error", message: "Gig not found" });
//       }
//       const store = await Store.findById(gig.store);
//       const receiverId = store.user; // Adjust based on your Store schema
//       if (!receiverId) {
//         return callback({ status: "error", message: "Store owner not found" });
//       }

//       let chat;
//       if (!chat_Id) {
//         // Create a new chat if it doesn't exist
//         chat = new Chat({
//           gigId,
//           initiatorId: senderId,
//           gigOwnerId: receiverId,
//         });
//         await chat.save();
//       }
//       console.log("Chat found or created:", chat);
//       // Use chat._id for the message if chat exists
//       const chatId = chat ? chat._id : chat_Id;
//       if (!chatId) {
//         // If no chat exists (e.g., sender is receiver), still allow message but tie to gigId temporarily
//         // This is optional; you could also reject this case
//         return callback({
//           status: "error",
//           message: "No chat available for this message",
//         });
//       }

//       // Create and save message with chatId
//       const message = new Message({
//         chatId,
//         sender: senderId,
//         receiver: receiverId,
//         content,
//       });
//       await message.save();

//       // Emit message to the room (still using gigId for room consistency with frontend)
//       io.to(gigId).emit("receiveMessage", {
//         ...message.toObject(),
//         sender: { _id: senderId },
//         receiver: { _id: receiverId },
//       });

//       // Notify both sender and receiver to update chat list
//       io.to(senderId).emit("updateChatList", { gigId });
//       io.to(receiverId).emit("updateChatList", { gigId });

//       callback({ status: "success", message: "Message sent" });
//     } catch (error) {
//       console.error("Error sending message:", error);
//       callback({ status: "error", message: "Server error" });
//     }
//   });

//   // Handle disconnection
//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
