const Review = require("../models/Review")
const Service = require("../models/Service")
const Jewelry = require("../models/Jewelry")

// not tested
const getReviews = async (req, res) => {
  try {
    const { reviewedItemType, reviewedItemId } = req.params

    if (!["Service", "Jewelry"].includes(reviewedItemType)) {
      return res.status(400).json({
        error: "Invalid Type. Must be 'Service' or 'Jewelry'.",
      })
    }

    let item
    if (reviewedItemType === "Service") {
      item = await Service.findById(reviewedItemId)
    } else if (reviewedItemType === "Jewelry") {
      item = await Jewelry.findById(reviewedItemId)
    }

    if (!item) {
      return res.status(404).json({ error: `${reviewedItemType} not found.` })
    }

    const reviews = await Review.find({
      reviewedItem: reviewedItemId,
      reviewedItemType,
    }).populate("user", "fName lName email")

    res.status(200).json({ reviews })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    res.status(500).json({ error: "Failed to fetch reviews." })
  }
}

// not tested
const createReview = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const { reviewedItem, reviewedItemType, comment } = req.body

    if (!comment) {
      return res.status(400).json({ error: "Comment is required." })
    }

    if (!["Service", "Jewelry"].includes(reviewedItemType)) {
      return res.status(400).json({ error: "Invalid Type." })
    }

    let item
    if (reviewedItemType === "Service") {
      item = await Service.findById(reviewedItem)
    } else if (reviewedItemType === "Jewelry") {
      item = await Jewelry.findById(reviewedItem)
    }

    if (!item) {
      return res.status(404).json({ error: `${reviewedItemType} not found.` })
    }

    // check if user is has ordered this jewelry/service

    const newReview = await Review.create({
      user: userId,
      reviewedItem,
      reviewedItemType,
      comment,
    })

    res
      .status(201)
      .json({ message: "Review created successfully.", review: newReview })
  } catch (error) {
    console.error("Error creating review:", error)
    res.status(500).json({ error: "Failed to create review." })
  }
}

// not tested
const updateReview = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const { reviewId } = req.params
    const { comment } = req.body

    if (!comment) {
      return res.status(400).json({ error: "Comment is required." })
    }

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({ error: "Review not found." })
    }

    if (review.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this review." })
    }

    review.comment = comment
    await review.save()

    res.status(200).json({ message: "Review updated successfully.", review })
  } catch (error) {
    console.error("Error updating review:", error)
    res.status(500).json({ error: "Failed to update review." })
  }
}

// not tested
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params
    const { id: userId, role } = res.locals.payload

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({ error: "Review not found." })
    }

    if (review.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this review." })
    }

    if (review.user.toString() !== userId && role !== "Admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this review." })
    }

    await Review.findByIdAndDelete(reviewId)

    res.status(200).json({ message: "Review deleted successfully." })
  } catch (error) {
    console.error("Error deleting review:", error)
    res.status(500).json({ error: "Failed to delete review." })
  }
}

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
}
