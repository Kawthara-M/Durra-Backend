const Wishlist = require("../models/Wishlist")
const Service = require("../models/Service")
const Jewelry = require("../models/Jewelry")
const Collection = require("../models/Collection")

// tested from frontend
const getWishlist = async (req, res) => {
  try {
    const userId = res.locals.payload.id

    const wishlist = await Wishlist.findOne({ user: userId })
      .populate({
        path: "items.favouritedItem",
        populate: [
          { path: "shop", select: "name" },
          { path: "jewelry", strictPopulate: false },
        ],
      })
      .setOptions({ strictPopulate: false })

    if (!wishlist) {
      return res.status(404).json({ error: `Wishlist not found.` })
    }

    res.status(200).json({ wishlist })
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    res.status(500).json({ error: "Failed to fetch wishlist." })
  }
}

// tested from frontend
const createWishlist = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const { items, favouritedItem, favouritedItemType } = req.body

    const entries =
      items && Array.isArray(items)
        ? items
        : [{ favouritedItem, favouritedItemType }]

    for (const entry of entries) {
      if (
        !["Service", "Jewelry", "Collection"].includes(entry.favouritedItemType)
      ) {
        return res
          .status(400)
          .json({ error: `Invalid type: ${entry.favouritedItemType}` })
      }
    }

    for (const entry of entries) {
      let itemModel
      if (entry.favouritedItemType === "Service") itemModel = Service
      else if (entry.favouritedItemType === "Jewelry") itemModel = Jewelry
      else itemModel = Collection

      const found = await itemModel.findById(entry.favouritedItem)
      if (!found) {
        return res
          .status(404)
          .json({ error: `${entry.favouritedItemType} not found.` })
      }
    }

    const newWishlist = await Wishlist.create({
      user: userId,
      items: entries.map((e) => ({
        favouritedItem: e.favouritedItem,
        favouritedItemType: e.favouritedItemType,
      })),
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

// tested from frontend
const updateWishlist = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    let { items } = req.body

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items must be an array" })
    }

    const uniqueItems = []
    const seen = new Set() // Set is used to avoid duplicates

    for (const it of items) {
      const id = it.favouritedItem.toString()
      if (!seen.has(id)) {
        seen.add(id)
        uniqueItems.push(it)
      }
    }

    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $set: { items: uniqueItems } },
      { new: true }
    )

    if (!updatedWishlist) {
      return res.status(404).json({ error: "Wishlist not found" })
    }

    res.json({ wishlist: updatedWishlist })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update wishlist" })
  }
}

module.exports = {
  getWishlist,
  createWishlist,
  updateWishlist,
}
