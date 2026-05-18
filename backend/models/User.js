const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["Admin", "Security Staff", "Student", "Faculty", "Librarian", "Non-Teaching Staff"],
      default: "Student",
    },
    department: { type: String },
    year: { type: String }, // For students
    facultyId: { type: String }, // For faculty
    photo: { type: String }, // Cloudinary URL
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    currentStatus: { type: String, enum: ["Inside", "Outside"], default: "Outside" },
    isBlacklisted: { type: Boolean, default: false },
    monthlyScanCount: { type: Number, default: 0 },
    lastScanResetDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
