const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AccessLog = require("../models/AccessLog");
const { protect } = require("../middleware/auth");

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "1d",
  });
};

// Helper for logging
const logLogin = async (userId, status, failureReason) => {
  if (userId) {
    await new AccessLog({
      userId,
      type: "LOGIN",
      status,
      purpose: "Entry", // using as default for login logs
      location: "App",
      failureReason,
    }).save();
  }
};

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const formattedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: formattedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status !== "active") {
      await logLogin(user._id, "FAILED", "Account is inactive");
      return res.status(401).json({ message: "Account is inactive" });
    }

    if (user.isBlacklisted) {
      await logLogin(user._id, "FAILED", "Account is blacklisted");
      return res.status(403).json({ message: "Account is blacklisted" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await logLogin(user._id, "FAILED", "Invalid password");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await logLogin(user._id, "SUCCESS");

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    // req.user is already fetched in protect middleware
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
