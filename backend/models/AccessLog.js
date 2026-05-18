const mongoose = require("mongoose");

const AccessLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    timestamp: { type: Date, default: Date.now },
    location: { type: String, default: "Main Gate" },
    labName: { type: String, default: null },
    purpose: { type: String, enum: ["Entry", "Library", "Lab", "Event", "Exit", "Verification", "QR Scan", "Book Issue", "Book Return"], default: "Entry" },
    type: { type: String, enum: ["ENTRY", "EXIT", "VERIFICATION", "LOGIN", "FAILED_LOGIN", "BOOK_ISSUE", "BOOK_RETURN", "STUDENT_SCAN"], required: true },
    status: { type: String, enum: ["SUCCESS", "FAILED"], required: true },
    failureReason: { type: String },
    isSuspicious: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessLog", AccessLogSchema);
