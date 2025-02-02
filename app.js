const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
dotenv.config();
connectDB();

const app = express();
app.use(cors());
// Middleware
app.use(bodyParser.json());

// Routes
app.use("/api/users", userRoutes);
app.get("/", (req, res) => res.send("Express on Vercel"));

module.exports = app;
