const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin)
router.get("/", protect, authorize("Admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   POST /api/users
// @desc    Create a new user
// @access  Private (Admin)
router.post("/", protect, authorize("Admin"), async (req, res) => {
  // Skipping file upload implementation for brevity in the plan, but assumes cloudinary URL is passed in req.body.photo for now.
  const { name, email, password, role, department, photo, phone, year, facultyId } = req.body;
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name, email, password: hashedPassword, role, department, photo, phone, year, facultyId
    });
    await user.save();
    
    res.status(201).json({ message: "User created successfully", user: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, role, department, status, isBlacklisted, phone, year, facultyId } = req.body;
    
    if (name) user.name = name;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (status) user.status = status;
    if (isBlacklisted !== undefined) user.isBlacklisted = isBlacklisted;
    if (phone !== undefined) user.phone = phone;
    if (year !== undefined) user.year = year;
    if (facultyId !== undefined) user.facultyId = facultyId;

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
