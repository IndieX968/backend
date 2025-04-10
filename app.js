const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const testRoutes = require("./routes/testRoutes");
const cors = require("cors");
dotenv.config();
connectDB();

const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  
// Handle preflight requests for all routes
app.options("*", cors());
  
// Middleware
app.use(bodyParser.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/test", testRoutes);
app.get("/", (req, res) => res.send("Express on Vercel"));

module.exports = app;
