const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const Book = require("../models/Book");
const BookIssue = require("../models/BookIssue");
const User = require("../models/User");
const AccessLog = require("../models/AccessLog");
const Fine = require("../models/Fine");

const router = express.Router();

const FINE_RATE_PER_DAY = 1; // $1 per day overdue as per user request

// Helper to calculate fine
const calculateFine = (dueDate) => {
  if (!dueDate) return 0;
  const now = new Date();
  if (now > dueDate) {
    const diffTime = Math.abs(now - dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays * FINE_RATE_PER_DAY;
  }
  return 0;
};

// @route   GET /api/library/my-books
// @desc    Get logged in user's issued books with calculated fines
// @access  Private
router.get("/my-books", protect, async (req, res) => {
  try {
    const issues = await BookIssue.find({ userId: req.user._id, status: "Issued" }).populate("bookId");
    
    const issuesWithFines = issues.map((issue) => {
      const fine = calculateFine(issue.dueDate);
      return {
        ...issue._doc,
        fine,
        isOverdue: fine > 0
      };
    });

    res.json(issuesWithFines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/library/inventory
// @desc    Get all books
// @access  Private (Librarian, Admin, Student, Faculty)
router.get("/inventory", protect, async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/library/issued
// @desc    Get all issued books across the system
// @access  Private (Librarian, Admin)
router.get("/issued", protect, authorize("Librarian", "Admin"), async (req, res) => {
  try {
    const issues = await BookIssue.find({ status: "Issued" })
      .populate("bookId")
      .populate("userId", "name email");
    
    const issuesWithFines = issues.map((issue) => {
      const fine = calculateFine(issue.dueDate);
      return {
        ...issue._doc,
        fine,
        isOverdue: fine > 0
      };
    });

    res.json(issuesWithFines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   POST /api/library/add
// @desc    Add a new book
// @access  Private (Librarian, Admin)
router.post("/add", protect, authorize("Librarian", "Admin"), async (req, res) => {
  try {
    const { title, author, isbn, quantity } = req.body;
    const qty = quantity || 1;
    const newBook = new Book({ 
      title, 
      author, 
      isbn, 
      quantity: qty, 
      availableQuantity: qty,
      status: qty > 0 ? "Available" : "Issued" 
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   PUT /api/library/:id
// @desc    Update a book
// @access  Private (Librarian, Admin)
router.put("/:id", protect, authorize("Librarian", "Admin"), async (req, res) => {
  try {
    const { title, author, isbn, quantity, availableQuantity } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (title) book.title = title;
    if (author) book.author = author;
    if (isbn) book.isbn = isbn;
    if (quantity !== undefined) book.quantity = quantity;
    if (availableQuantity !== undefined) {
      book.availableQuantity = availableQuantity;
      book.status = availableQuantity > 0 ? "Available" : "Issued";
    }

    await book.save();
    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   DELETE /api/library/:id
// @desc    Delete a book
// @access  Private (Librarian, Admin)
router.delete("/:id", protect, authorize("Librarian", "Admin"), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    
    const activeIssues = await BookIssue.countDocuments({ bookId: book._id, status: "Issued" });
    if (activeIssues > 0) return res.status(400).json({ message: "Cannot delete a book that is currently issued" });
    
    await book.deleteOne();
    res.json({ message: "Book removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   POST /api/library/issue
// @desc    Issue a book to a user
// @access  Private (Librarian, Admin)
router.post("/issue", protect, authorize("Librarian", "Admin"), async (req, res) => {
  try {
    const { bookId, userId, days = 14 } = req.body;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.availableQuantity <= 0) return res.status(400).json({ message: "No available copies of this book" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Set due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    const issue = new BookIssue({
      bookId: book._id,
      userId: user._id,
      dueDate
    });
    await issue.save();

    book.availableQuantity -= 1;
    if (book.availableQuantity === 0) book.status = "Issued";
    await book.save();

    // Log the event
    await new AccessLog({
      userId: user._id,
      type: "BOOK_ISSUE",
      status: "SUCCESS",
      purpose: "Book Issue",
      location: "Library"
    }).save();

    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   POST /api/library/return
// @desc    Return an issued book
// @access  Private (Librarian, Admin)
router.post("/return", protect, authorize("Librarian", "Admin"), async (req, res) => {
  try {
    const { issueId } = req.body;

    const issue = await BookIssue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue record not found" });
    if (issue.status === "Returned") return res.status(400).json({ message: "Book is already returned" });

    const book = await Book.findById(issue.bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const fineAmount = calculateFine(issue.dueDate);
    if (fineAmount > 0) {
      const diffTime = Math.abs(new Date() - issue.dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      const newFine = new Fine({
        studentId: issue.userId,
        bookId: issue.bookId,
        amount: fineAmount,
        overdueDays: diffDays
      });
      await newFine.save();
    }

    issue.status = "Returned";
    issue.returnDate = new Date();
    await issue.save();

    book.availableQuantity += 1;
    book.status = "Available";
    await book.save();

    // Log the event
    await new AccessLog({
      userId: issue.userId,
      type: "BOOK_RETURN",
      status: "SUCCESS",
      purpose: "Book Return",
      location: "Library"
    }).save();

    res.json({ message: "Book returned successfully", fineAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   GET /api/library/fines
// @desc    Get all fines (or specific user's fines)
// @access  Private
router.get("/fines", protect, async (req, res) => {
  try {
    let filter = {};
    if (["Student", "Faculty"].includes(req.user.role)) {
      filter.studentId = req.user._id;
    } else if (req.query.userId) {
      filter.studentId = req.query.userId;
    }

    const fines = await Fine.find(filter)
      .populate("studentId", "name email")
      .populate("bookId", "title");
    res.json(fines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
