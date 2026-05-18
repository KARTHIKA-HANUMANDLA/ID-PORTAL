const mongoose = require("mongoose");

const FineSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
    overdueDays: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fine", FineSchema);
