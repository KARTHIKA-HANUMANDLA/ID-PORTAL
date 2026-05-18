const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const AccessLog = require("../models/AccessLog");
const Alert = require("../models/Alert");

const router = express.Router();

// @route   GET /api/logs
// @desc    Get access logs
// @access  Private (Admin, Security Staff)
router.get("/", protect, authorize("Admin", "Security Staff"), async (req, res) => {
  try {
    const logs = await AccessLog.find()
      .populate("userId", "name email role department")
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/logs/analytics
// @desc    Get basic analytics
// @access  Private (Admin)
router.get("/analytics", protect, authorize("Admin"), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const totalEntriesToday = await AccessLog.countDocuments({
      type: "ENTRY",
      status: "SUCCESS",
      timestamp: { $gte: startOfDay }
    });

    const totalExitsToday = await AccessLog.countDocuments({
      type: "EXIT",
      status: "SUCCESS",
      timestamp: { $gte: startOfDay }
    });

    const unauthorizedAttemptsToday = await AccessLog.countDocuments({
      status: "FAILED",
      timestamp: { $gte: startOfDay }
    });

    res.json({
      totalEntriesToday,
      totalExitsToday,
      unauthorizedAttemptsToday
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/logs/faculty/analytics
// @desc    Get faculty analytics
// @access  Private (Faculty)
router.get("/faculty/analytics", protect, authorize("Faculty"), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const totalScanned = await AccessLog.countDocuments({ scannedBy: req.user._id });
    const dailyScanCount = await AccessLog.countDocuments({ scannedBy: req.user._id, timestamp: { $gte: startOfDay } });
    const invalidScanAttempts = await AccessLog.countDocuments({ scannedBy: req.user._id, status: "FAILED" });
    const recentHistory = await AccessLog.find({ scannedBy: req.user._id }).populate("userId", "name department status").sort({ timestamp: -1 }).limit(10);

    res.json({
      totalScanned,
      dailyScanCount,
      invalidScanAttempts,
      recentHistory
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/logs/student/analytics
// @desc    Get student analytics
// @access  Private (Student)
router.get("/student/analytics", protect, async (req, res) => {
  try {
    const booksTaken = await AccessLog.countDocuments({ userId: req.user._id, type: "BOOK_ISSUE", status: "SUCCESS" });
    const booksReturned = await AccessLog.countDocuments({ userId: req.user._id, type: "BOOK_RETURN", status: "SUCCESS" });
    const qrScannerUsageCount = await AccessLog.countDocuments({ userId: req.user._id, type: "STUDENT_SCAN", status: "SUCCESS" });
    const logs = await AccessLog.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(20);

    res.json({
      booksTaken,
      booksReturned,
      qrScannerUsageCount,
      logs
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/logs/me
// @desc    Get access logs for current user
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const logs = await AccessLog.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/alerts
// @desc    Get system alerts
// @access  Private (Admin, Security Staff)
router.get("/alerts", protect, authorize("Admin", "Security Staff"), async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate("userId", "name email role")
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;

