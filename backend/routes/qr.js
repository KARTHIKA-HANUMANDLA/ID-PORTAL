const express = require("express");
const crypto = require("crypto");
const { rateLimit } = require("express-rate-limit");
const { protect, authorize } = require("../middleware/auth");
const QRToken = require("../models/QRToken");
const AccessLog = require("../models/AccessLog");
const User = require("../models/User");
const Alert = require("../models/Alert");

const router = express.Router();

// Rate limiting: max 10 requests per minute for QR generation to prevent abuse
const qrGenerateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { message: "Too many QR requests, please try again later." },
});

const generateSignature = (payload) => {
  const secret = process.env.QR_SECRET || "fallback_qr_secret";
  return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
};

// Helper to check and reset monthly limits
const checkAndResetMonthlyLimits = async (user) => {
  const now = new Date();
  const lastReset = new Date(user.lastScanResetDate);

  // If the last reset was in a previous month, reset the count
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    user.monthlyScanCount = 0;
    user.lastScanResetDate = now;
    await user.save();
  }
};

// @route   GET /api/qr/generate
// @desc    Generate a secure QR token for the logged-in user
// @access  Private
router.get("/generate", protect, qrGenerateLimiter, async (req, res) => {
  try {
    const user = req.user;

    // Check monthly limits early
    await checkAndResetMonthlyLimits(user);
    if (user.monthlyScanCount >= 3) {
      return res.status(403).json({ 
        message: "Scan limit exceeded. Physical ID required." 
      });
    }

    const nonce = crypto.randomBytes(16).toString("hex");
    const expiryTime = new Date(Date.now() + 60 * 1000); // Expires in 60s

    const payload = {
      userId: user._id.toString(),
      nonce,
      timestamp: Date.now(),
    };

    const tokenHash = generateSignature(payload);

    const qrToken = new QRToken({
      userId: user._id,
      tokenHash,
      nonce,
      expiryTime,
    });

    await qrToken.save();

    res.json({
      payload,
      signature: tokenHash,
      expiryTime,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Time-Based Access Constants
const ALLOWED_HOURS = {
  "Lab": { start: 8, end: 18 }, // 8 AM to 6 PM
  "Library": { start: 7, end: 22 }, // 7 AM to 10 PM
  "Main Gate": { start: 6, end: 23 }, // 6 AM to 11 PM
};

// Helper to create Alert
const createAlert = async (userId, message, severity = "Warning") => {
  await new Alert({ userId, message, severity }).save();
};

// @route   POST /api/qr/verify
// @desc    Verify QR token and log entry/exit
// @access  Private (Security Staff, Admin, Faculty)
router.post("/verify", protect, authorize("Admin", "Security Staff", "Faculty"), async (req, res) => {
  const { payload, signature, location = "Main Gate", purpose = "Entry" } = req.body;
  
  let logEntry = new AccessLog({
    userId: payload ? payload.userId : null,
    scannedBy: req.user._id,
    location,
    labName: req.user.role === "Faculty" ? location : null,
    purpose,
    type: "VERIFICATION", // Will be updated to ENTRY/EXIT
    status: "FAILED",
    failureReason: "Unknown Error",
    isSuspicious: false
  });

  try {
    if (!payload || !signature) {
      logEntry.failureReason = "Invalid payload or signature";
      logEntry.isSuspicious = true;
      await logEntry.save();
      return res.status(400).json({ success: false, message: logEntry.failureReason });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      logEntry.failureReason = "User not found";
      logEntry.isSuspicious = true;
      await logEntry.save();
      return res.status(404).json({ success: false, message: logEntry.failureReason });
    }

    logEntry.userId = user._id;

    if (user.status !== "active") {
      logEntry.failureReason = "User account inactive";
      logEntry.isSuspicious = true;
      await logEntry.save();
      await createAlert(user._id, "Inactive user attempted access", "Warning");
      return res.status(403).json({ success: false, message: logEntry.failureReason, user });
    }

    if (user.isBlacklisted) {
      logEntry.failureReason = "User is blacklisted";
      logEntry.isSuspicious = true;
      await logEntry.save();
      await createAlert(user._id, "Blacklisted user attempted access", "Critical");
      return res.status(403).json({ success: false, message: logEntry.failureReason, user });
    }

    // Time-based check
    const currentHour = new Date().getHours();
    let isTimeAllowed = true;
    
    // Check specific location bounds or check generic rules based on purpose
    const ruleKey = location.includes("Lab") ? "Lab" : location.includes("Library") ? "Library" : "Main Gate";
    const bounds = ALLOWED_HOURS[ruleKey];
    
    if (bounds && (currentHour < bounds.start || currentHour >= bounds.end)) {
      isTimeAllowed = false;
      logEntry.failureReason = `Outside allowed hours for ${ruleKey} (${bounds.start}:00 - ${bounds.end}:00)`;
      logEntry.isSuspicious = true;
      await logEntry.save();
      await createAlert(user._id, `Attempted access to ${location} outside allowed hours.`, "Warning");
      return res.status(403).json({ success: false, message: logEntry.failureReason, user });
    }

    // Verify Monthly Limit
    await checkAndResetMonthlyLimits(user);
    if (user.monthlyScanCount >= 3) {
      logEntry.failureReason = "Scan limit exceeded (Max 3/month)";
      await logEntry.save();
      await createAlert(user._id, "Scan limit exceeded attempt.", "Warning");
      return res.status(403).json({ success: false, message: "Scan limit exceeded. Physical ID required.", user });
    }

    // Verify Signature
    const expectedSignature = generateSignature(payload);
    if (expectedSignature !== signature) {
      logEntry.failureReason = "Signature mismatch / Data tampered";
      logEntry.isSuspicious = true;
      await logEntry.save();
      await createAlert(user._id, "QR Signature mismatch / Data tampered.", "Critical");
      return res.status(400).json({ success: false, message: logEntry.failureReason, user });
    }

    // Check DB for Token
    const qrToken = await QRToken.findOne({ nonce: payload.nonce });
    if (!qrToken) {
      logEntry.failureReason = "Token not found in system";
      logEntry.isSuspicious = true;
      await logEntry.save();
      return res.status(400).json({ success: false, message: logEntry.failureReason, user });
    }

    if (qrToken.isUsed) {
      logEntry.failureReason = "Token already used (Replay Attack)";
      logEntry.isSuspicious = true;
      await logEntry.save();
      await createAlert(user._id, "Replay attack detected (used token).", "Critical");
      return res.status(400).json({ success: false, message: logEntry.failureReason, user });
    }

    if (new Date() > qrToken.expiryTime) {
      logEntry.failureReason = "QR Token Expired";
      await logEntry.save();
      return res.status(400).json({ success: false, message: logEntry.failureReason, user });
    }

    // Suspicious Activity Logic: Trying to ENTER when already Inside
    const isMainGate = location.toLowerCase().includes("gate");
    let scanType = "VERIFICATION";
    
    if (isMainGate) {
       scanType = user.currentStatus === "Inside" ? "EXIT" : "ENTRY";
    } else {
       scanType = purpose === "Exit" ? "EXIT" : "ENTRY";
    }

    if (scanType === "ENTRY" && user.currentStatus === "Inside" && isMainGate) {
        logEntry.isSuspicious = true;
        await createAlert(user._id, "Entry attempt when user is already marked 'Inside'.", "Warning");
        // We still allow it but flag it
    }

    // --- SUCCESS PATH ---
    
    // Invalidate token immediately
    qrToken.isUsed = true;
    await qrToken.save();

    // Toggle user status
    if (scanType === "ENTRY" && isMainGate) user.currentStatus = "Inside";
    if (scanType === "EXIT" && isMainGate) user.currentStatus = "Outside";

    user.monthlyScanCount += 1;
    await user.save();

    // Log success
    logEntry.type = scanType;
    logEntry.status = "SUCCESS";
    logEntry.failureReason = undefined;
    await logEntry.save();

    res.json({
      success: true,
      message: `Successfully verified: ${scanType} for ${purpose}`,
      type: scanType,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        photo: user.photo,
        currentStatus: user.currentStatus,
        monthlyScanCount: user.monthlyScanCount,
        remainingScans: 3 - user.monthlyScanCount,
        status: user.status
      }
    });

  } catch (error) {
    console.error(error);
    logEntry.failureReason = "Server Exception during verification";
    await logEntry.save();
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @route   POST /api/qr/log-scanner-usage
// @desc    Log student scanner usage
// @access  Private (Student)
router.post("/log-scanner-usage", protect, async (req, res) => {
  try {
    await new AccessLog({
      userId: req.user._id,
      type: "STUDENT_SCAN",
      status: "SUCCESS",
      purpose: "QR Scan",
      location: "App"
    }).save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
