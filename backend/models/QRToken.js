const mongoose = require("mongoose");

const QRTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    nonce: { type: String, required: true, unique: true },
    expiryTime: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index to automatically delete expired tokens if needed, but we rely on explicit checks.
QRTokenSchema.index({ expiryTime: 1 }, { expireAfterSeconds: 60 });

module.exports = mongoose.model("QRToken", QRTokenSchema);
