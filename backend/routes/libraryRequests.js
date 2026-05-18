const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const BookRequest = require("../models/BookRequest");
const Book = require("../models/Book");
const Notification = require("../models/Notification");

const router = express.Router();

// @route   POST /api/library-requests
// @desc    Student requests a book
// @access  Private (Student)
router.post("/", protect, async (req, res) => {
  try {
    const { bookId, note } = req.body;
    
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const request = new BookRequest({
      studentId: req.user._id,
      bookId,
      note
    });

    await request.save();
    
    // Create a notification for Librarians
    const notification = new Notification({
      userId: req.user._id, // Ideally should be broadcasted to Librarians, setting system-wide for now
      message: `New book request for "${book.title}" from ${req.user.name}`,
      type: "Library"
    });
    await notification.save();

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/library-requests
// @desc    Get all requests
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "Student") {
      filter.studentId = req.user._id;
    }

    const requests = await BookRequest.find(filter)
      .populate("studentId", "name email phone")
      .populate("bookId", "title author availableQuantity")
      .sort({ createdAt: -1 });
      
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   PUT /api/library-requests/:id
// @desc    Update request status
// @access  Private (Librarian, Admin)
router.put("/:id", protect, authorize("Librarian", "Admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const request = await BookRequest.findById(req.params.id);
    
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = status;
    await request.save();

    // Notify student
    await new Notification({
      userId: request.studentId,
      message: `Your book request has been ${status.toLowerCase()}`,
      type: "Library"
    }).save();

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
