const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    severity: { type: String, enum: ["Warning", "Critical"], default: "Warning" },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", AlertSchema);
