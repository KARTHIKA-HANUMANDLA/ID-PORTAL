const mongoose = require("mongoose");

const BookIssueSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: { type: String, enum: ["Issued", "Returned"], default: "Issued" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookIssue", BookIssueSchema);
