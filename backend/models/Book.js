const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String },
    quantity: { type: Number, default: 1 },
    availableQuantity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["Available", "Issued"],
      default: "Available",
    },
    issuedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    issueDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    returnDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", BookSchema);
