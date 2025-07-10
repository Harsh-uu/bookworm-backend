import express from "express";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";
import Book from "../models/Book.js";

const router = express.Router();

router.post("/", protectRoute, async (req, resp) => {
  try {
    const { title, caption, image, rating } = req.body;
    if (!title || !caption || !image || !rating) {
      return resp.status(400).json({ message: "All fields are required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;

    const newBook = new Book({
      title,
      caption,
      image: imageUrl,
      rating,
      user: req.user._id,
    });

    await newBook.save();

    resp.status(201).json(newBook);
  } catch (error) {
    console.log("Error in creating book", error);
    resp.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", protectRoute, async (req, resp) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalBooks = await Book.countDocuments();

    resp.send({
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil((await Book.countDocuments()) / limit),
    });
  } catch (error) {
    console.log("Error in fetching books", error);
    resp.status(500).json({ message: "Internal server error" });
  }
});

router.get("/user", protectRoute, async (req, resp) => {
    try {
        const books = await Book.find({user: req.user._id}).sort({createdAt: -1});
        resp.json(books);
    } catch (error) {
        console.log("Error in fetching user books", error);
        resp.status(500).json({ message: "Internal server error" });
    }
})

router.delete("/:id", protectRoute, async (req, resp) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return resp.status(404).json({ message: "Book not found" });
    }
    if (book.user.toString() !== req.user._id.toString()) {
      return resp
        .status(403)
        .json({ message: "You are not authorized to delete this book" });
    }

    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from Cloudinary", deleteError);
        return resp.status(500).json({
          message: "Error deleting image from Cloudinary",
        });
      }
    }

    await book.deleteOne();

    resp.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log("Error in deleting book", error);
    resp.status(500).json({ message: "Internal server error" });
  }
});

export default router;
