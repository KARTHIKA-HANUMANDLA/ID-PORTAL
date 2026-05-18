const mongoose = require("mongoose");

const BookRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Issued"],
      default: "Pending",
    },
    note: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookRequest", BookRequestSchema);
