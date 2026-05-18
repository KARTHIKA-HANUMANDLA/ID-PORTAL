const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/qr", require("./routes/qr"));
app.use("/api/users", require("./routes/users"));
app.use("/api/logs", require("./routes/logs"));
app.use("/api/library", require("./routes/library"));
app.use("/api/library-requests", require("./routes/libraryRequests"));
app.use("/api/notifications", require("./routes/notifications"));

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campus-id")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

app.get("/", (req, res) => {
    res.send("Smart Campus API Running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});