const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const testRoutes = require("./routes/testRoutes");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();
connectDB();

const app = express();

app.use(bodyParser.json());
app.use("/api/test", testRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
