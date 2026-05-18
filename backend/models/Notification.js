const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    type: { type: String, enum: ["Library", "System"], default: "System" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
