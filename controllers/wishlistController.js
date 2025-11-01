const Wishlist = require("../models/Wishlist")
const Service = require("../models/Service")
const Jewelry = require("../models/Jewelry")

// not tested
const getWishlist = async (req, res) => {
  try {
    const userId = res.locals.payload.id

    const wishlist = await Wishlist.findOne({ user: userId })

    if (!wishlist) {
      return res.status(404).json({ error: `Wishlist not found.` })
    }

    res.status(200).json({ wishlist })
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    res.status(500).json({ error: "Failed to fetch wishlist." })
  }
}

// not tested
const createWishlist = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const { favouritedItem, favouritedItemType } = req.body

    if (!["Service", "Jewelry", "Collection"].includes(favouritedItemType)) {
      return res.status(400).json({ error: "Invalid Type." })
    }

    let item
    if (favouritedItemType === "Service") {
      item = await Service.findById(favouritedItem)
    } else if (favouritedItemType === "Jewelry") {
      item = await Jewelry.findById(favouritedItem)
    } else {
      item = await Collection.findById(favouritedItem)
    }

    if (!item) {
      return res.status(404).json({ error: `${favouritedItemType} not found.` })
    }

    const newWishlist = await Wishlist.create({
      user: userId,
      favouritedItem,
      favouritedItemType,
    })

    res.status(201).json({
      message: "Wishlist created successfully.",
      wishlist: newWishlist,
    })
  } catch (error) {
    console.error("Error creating wishlist:", error)
    res.status(500).json({ error: "Failed to create wishlist." })
  }
}

// not tested
const updateWishlist = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const newItems = req.body.items 

    if (!Array.isArray(newItems)) {
      return res.status(400).json({ error: "items must be an array" })
    }

    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $set: { items: newItems } },
    )

    return res.json({
      wishlist: updatedWishlist,
    })
  } catch (error) {
    console.error("Update Wishlist Error:", error)
    res.status(500).json({ error: "Failed to update wishlist" })
  }
}

module.exports = {
  getWishlist,
  createWishlist,
  updateWishlist,
}
