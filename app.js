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

app.use((req, res, next) => {
    const allowedOrigins = ["http://localhost:5173", "https://indiex-nu.vercel.app"];
    
    // Check if the origin matches one of the allowed origins
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  
    if (req.method === "OPTIONS") {
      return res.sendStatus(200); // Preflight request
    }
  
    next();
  });
  
// Middleware
app.use(bodyParser.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/test", testRoutes);
app.get("/", (req, res) => res.send("Express on Vercel"));

module.exports = app;
