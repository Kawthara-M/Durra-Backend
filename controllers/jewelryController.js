const Jewelry = require("../models/Jewelry")
const Shop = require("../models/Shop")

// total price of precious jewelry should be calculated again in front-end after they receive jewelry, I should - the precious total and recalculate it based on karatCost and then add it again
// tested
const getAllJewelry = async (req, res) => {
  try {
    const jewelry = await Jewelry.find({ deleted: false }).populate("shop")

    res.status(200).json({
      jewelry,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching jewelry.",
    })
  }
}

// tested!
const getJewelry = async (req, res) => {
  try {
    const jewelry = await Jewelry.findOne({
      _id: req.params.jewelryId,
      deleted: false,
    }).populate("shop")
    if (!jewelry) {
      return res.status(404).json({
        error: "Jewelry not found. It may have been deleted or does not exist.",
      })
    }

    res.status(200).json({
      jewelry,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching this jewelry.",
    })
  }
}

const createJewelry = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const {
      name,
      description,
      type,
      mainMaterial,
      totalWeight,
      originPrice,
      productionCost,
      totalPrice,
      limitPerOrder,
      preciousMaterials,
      pearls,
      diamonds,
      otherMaterials,
      certifications,
      shopId,
    } = req.body

    const shop = await Shop.findById(shopId)
    if (!shop) {
      return res.status(404).json({
        error: "Shop not found.",
      })
    }

    if (shop.user.toString() !== userId) {
      return res.status(403).json({
        error:
          "Unauthorized: You do not have permission to create a jewelry for this shop.",
      })
    }

    const images = req.files?.map((file) => `/uploads/${file.filename}`) || []

    // check here if certifications are valid or not

    const newJewelry = await Jewelry.create({
      shop: shop._id,
      name,
      description,
      type,
      mainMaterial,
      totalWeight,
      productionCost,
      originPrice,
      totalPrice,
      limitPerOrder,
      images,
      preciousMaterials,
      pearls,
      diamonds,
      otherMaterials,
      certifications,
    })

    res.status(201).json({
      message: "jewelry created successfully.",
      newJewelry,
    })
  } catch (error) {
    console.error("Error creating jewelry:", error)
    res.status(500).json({ message: "Failed to create jewelry" })
  }
}

const updateJewelry = async (req, res) => {
  try {
    const { jewelryId } = req.params
    const { id: userId, role } = res.locals.payload
    const {
      name,
      description,
      type,
      mainMaterial,
      totalWeight,
      originPrice,
      productionCost,
      totalPrice,
      limitPerOrder,
      images,
      preciousMaterials,
      pearls,
      diamonds,
      otherMaterials,
      certifications,
    } = req.body

    const jewelry = await Jewelry.findOne({
      _id: jewelryId,
      shop: shop._id,
      deleted: false,
    })
    if (!jewelry) {
      return res.status(404).json({ error: "jewelry not found." })
    }

    const shop = await Shop.findById(jewelry.shop)
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }

    const isOwnerJeweler = role === "Jeweler" && shop.user.toString() === userId

    if (!isOwnerJeweler) {
      return res.status(403).json({
        error:
          "Unauthorized: You do not have permission to update this jewelry.",
      })
    }

    if (req.files && req.files.length > 0) {
      jewelry.images = req.files.map((file) => `/uploads/${file.filename}`)
    }

    jewelry.name = name ?? jewelry.name
    jewelry.description = description ?? jewelry.description
    jewelry.type = type ?? jewelry.type
    jewelry.mainMaterial = mainMaterial ?? jewelry.mainMaterial
    jewelry.totalWeight = totalWeight ?? jewelry.totalWeight
    jewelry.productionCost = productionCost ?? jewelry.productionCost
    jewelry.originPrice = originPrice ?? jewelry.originPrice
    jewelry.totalPrice = totalPrice ?? jewelry.totalPrice
    jewelry.limitPerOrder = limitPerOrder ?? jewelry.limitPerOrder
    jewelry.preciousMaterials = preciousMaterials ?? jewelry.preciousMaterials
    jewelry.pearls = pearls ?? jewelry.pearls
    jewelry.diamonds = diamonds ?? jewelry.diamonds
    jewelry.otherMaterials = otherMaterials ?? jewelry.otherMaterials

    // validate certifications
    jewelry.certifications = certifications ?? jewelry.certifications

    await jewelry.save()

    return res.status(200).json({
      message: "Jewelry updated successfully.",
      jewelry,
    })
  } catch (error) {
    console.error("Error updating jewelry:", error)
    return res.status(500).json({ error: error.message })
  }
}

const deleteJewelry = async (req, res) => {
  try {
    const { jewelryId } = req.params
    const { id: userId, role } = res.locals.payload

    const jewelry = await Jewelry.findById(jewelryId)
    if (!jewelry) {
      return res.status(404).json({ error: "Jewelry not found." })
    }

    const shop = await Shop.findById(jewelry.shop)
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }
    const isAdmin = role === "Admin"
    const isOwnerJeweler = role === "Jeweler" && shop.user.toString() === userId

    if (!isAdmin && !isOwnerJeweler) {
      return res.status(403).json({
        error:
          "Unauthorized: You do not have permission to delete this jewelry.",
      })
    }

    // soft delete
    await Jewelry.findByIdAndUpdate(jewelryId, { deleted: true })

    return res.status(200).json({ message: "Jewelry deleted successfully." })
  } catch (error) {
    console.error("Error deleting jewelry:", error)
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getAllJewelry,
  getJewelry,
  createJewelry,
  deleteJewelry,
  updateJewelry,
}
