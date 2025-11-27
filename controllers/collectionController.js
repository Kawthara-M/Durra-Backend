const Collection = require("../models/Collection")
const Shop = require("../models/Shop")
const Jewelry = require("../models/Jewelry")

// tested
const getAllCollections = async (req, res) => {
  try {
    const payload = res.locals.payload
    let collections
    console.log(payload)
    if (payload && payload.role === "Jeweler") {
      const shop = await Shop.findOne({ user: payload.id })
      if (!shop) {
        return res
          .status(404)
          .json({ error: "Shop not found for this jeweler." })
      }
      console.log(shop)
      collections = await Collection.find({ shop: shop._id })
        .populate("shop")
        .populate("jewelry")
    } else {
      collections = await Collection.find().populate("shop").populate("jewelry")
    }

    res.status(200).json({ collections })
  } catch (error) {
    console.error("Error fetching collections:", error)
    return res.status(500).json({
      error: "Failure encountered while fetching collections.",
    })
  }
}

const getCollectionForJeweler = async (req, res) => {
  try {
    const payload = res.locals.payload

    const shop = await Shop.findOne({ user: payload.id })
    if (!shop) {
      return res.status(404).json({ error: "Shop not found for this jeweler." })
    }
    const collections = await Collection.find({
      shop: shop._id,
      deleted: false,
    }).populate("shop")

    return res.status(200).json({ collections })
  } catch (error) {
    console.error("Error fetching jeweler's jewelry:", error)
    return res
      .status(500)
      .json({ error: "Failed to fetch collections for jeweler." })
  }
}

// tested
const getCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.collectionId)
      .populate("shop")
      .populate("jewelry")
    if (!collection) {
      return res.status(404).json({
        error:
          "Collection not found. It may have been deleted or does not exist.",
      })
    }

    res.status(200).json({
      collection,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching this collection.",
    })
  }
}

const createCollection = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    let { name, description, limitPerOrder, originPrice, jewelry } = req.body

    if (typeof jewelry === "string") {
      try {
        jewelry = JSON.parse(jewelry)
      } catch (e) {
        return res.status(400).json({
          error: "Invalid jewelry data format.",
        })
      }
    }

    const shop = await Shop.findOne({ user: userId })
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }

    if (shop.user.toString() !== userId) {
      return res.status(403).json({
        error:
          "Unauthorized: You do not have permission to create a collection for this shop.",
      })
    }

    const foundJewelry = await Jewelry.find({
      _id: { $in: jewelry },
      shop: shop._id,
    })

    if (foundJewelry.length !== jewelry.length) {
      return res.status(400).json({
        error:
          "Some jewelry items were not found or do not belong to this shop.",
      })
    }

    const BASE_URL = process.env.BASE_URL
    const images =
      req.files?.map((file) => `${BASE_URL}/uploads/${file.filename}`) || []

    const newCollection = await Collection.create({
      shop: shop._id,
      name,
      description,
      jewelry,
      images,
      limitPerOrder,
      originPrice,
    })

    res.status(201).json({
      message: "Collection created successfully.",
      newCollection,
    })
  } catch (error) {
    console.error("Error creating collection:", error)
    res.status(500).json({ message: "Failed to create collection" })
  }
}

const updateCollection = async (req, res) => {
  try {
    const { collectionId } = req.params
    const { id: userId, role } = res.locals.payload
    const { name, description } = req.body
    const jewelryArray = JSON.parse(req.body.jewelry)

    const collection = await Collection.findById(collectionId)
    if (!collection) {
      return res.status(404).json({ error: "Collection not found." })
    }

    const shop = await Shop.findById(collection.shop)
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }

    const isOwnerJeweler = role === "Jeweler" && shop.user.toString() === userId

    if (!isOwnerJeweler) {
      return res.status(403).json({
        error:
          "Unauthorized: You do not have permission to update this collection.",
      })
    }

    const duplicate = await Collection.findOne({
      _id: { $ne: collectionId },
      shop: shop._id,
      name: { $regex: `^${name}$`, $options: "i" },
    })

    if (duplicate) {
      return res.status(400).json({
        error:
          "Another collection with the same name already exists for this shop.",
      })
    }

    const validJewelry = await Jewelry.find({
      _id: { $in: jewelryArray },
      shop: shop._id,
    })

    if (validJewelry.length !== jewelryArray.length) {
      return res.status(400).json({
        error:
          "One or more jewelry items are invalid or do not belong to this shop.",
      })
    }

    const BASE_URL = process.env.BASE_URL

    let existingImages = []
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages)
      } catch (e) {
        console.error("Failed to parse existingImages:", e)
      }
    }

    const newImageUrls =
      req.files?.map((file) => `${BASE_URL}/uploads/${file.filename}`) || []

    collection.images = [...existingImages, ...newImageUrls]

    collection.name = name ?? collection.name
    collection.description = description ?? collection.description
    collection.jewelry = jewelry ?? collection.jewelry

    await collection.save()

    return res.status(200).json({
      message: "Collection updated successfully.",
      collection,
    })
  } catch (error) {
    console.error("Error updating collection:", error)
    return res.status(500).json({ error: error.message })
  }
}

// should test
const deleteCollection = async (req, res) => {
  try {
    const { collectionId } = req.params
    const { id: userId, role } = res.locals.payload

    const collection = await Collection.findById(collectionId)
    if (!collection) {
      return res.status(404).json({ error: "Collection not found." })
    }

    const shop = await Shop.findById(collection.shop)
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }

    const isAdmin = role === "Admin"
    const isOwnerJeweler = role === "Jeweler" && shop.user.toString() === userId

    if (!isAdmin && !isOwnerJeweler) {
      return res.status(403).json({
        error:
          "Unauthorized: You do not have permission to delete this collection.",
      })
    }

    await Collection.findByIdAndDelete(collectionId)

    // soft delete
    // await Collection.findByIdAndUpdate(collectionId, { deleted: true })

    return res.status(200).json({ message: "Collection deleted successfully." })
  } catch (error) {
    console.error("Error deleting collection:", error)
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getAllCollections,
  getCollection,
  getCollectionForJeweler,
  createCollection,
  updateCollection,
  deleteCollection,
}
