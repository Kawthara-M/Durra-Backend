const Jewelry = require("../models/Jewelry")
const Shop = require("../models/Shop")
const mongoose = require("mongoose") 
const { verifyDanatReport } = require("../services/certificationServices.js")

// tested
const getAllJewelry = async (req, res) => {
  try {
    const payload = res.locals.payload
    let jewelry

    if (payload && payload.role === "Jeweler") {
      const shop = await Shop.findOne({ user: payload.id })
      if (!shop) {
        return res
          .status(404)
          .json({ error: "Shop not found for this jeweler." })
      }

      jewelry = await Jewelry.find({
        shop: shop._id,
        deleted: false,
      }).populate("shop")
    } else {
      jewelry = await Jewelry.find({ deleted: false }).populate("shop")
    }

    res.status(200).json({ jewelry })
  } catch (error) {
    console.error("Error fetching jewelry:", error)
    return res.status(500).json({
      error: "Failure encountered while fetching jewelry.",
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
    console.log("here")
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
const getJewelryByShop = async (req, res) => {
  try {
    const { shopId } = req.params

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: "Invalid shop ID" })
    }

    const jewelries = await Jewelry.find({
      shop: shopId,
      deleted: { $ne: true },
    }).sort({ createdAt: -1 })

    res.json({ jewelries })
  } catch (error) {
    console.error("Error fetching jewelry by shop:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

const validateGIA = async () => {}

const createJewelry = async (req, res) => {
  try {
    const userId = res.locals.payload.id

    const parseArrayField = (field) => {
      try {
        return field ? JSON.parse(field) : []
      } catch (err) {
        console.error(`Failed to parse ${field}:`, err)

        return []
      }
    }

    const {
      name,

      description,

      type,

      mainMaterial,

      totalWeight,

      originPrice,

      productionCost,

      limitPerOrder,
    } = req.body

    const preciousMaterials = parseArrayField(req.body.preciousMaterials)

    const pearls = parseArrayField(req.body.pearls)

    const diamonds = parseArrayField(req.body.diamonds)

    const otherMaterials = parseArrayField(req.body.otherMaterials)

    const certifications = parseArrayField(req.body.certifications)

    const shop = await Shop.findOne({ user: userId })

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

    const BASE_URL = process.env.BASE_URL

    const images =
      req.files?.map((file) => `${BASE_URL}/uploads/${file.filename}`) || []

    // check here if certifications are valid or not

    for (let cert of certifications) {
      if (cert.name.toLowerCase() === "danat") {
        const result = await verifyDanatReport(
          cert.reportNumber,

          cert.reportDate
        )

        if (result.success) {
          cert.isVerified = true
        } else {
          cert.isVerified = false
        }
      }
    }

    const newJewelry = await Jewelry.create({
      shop: shop._id,

      name,

      description,

      type,

      mainMaterial,

      totalWeight,

      productionCost,

      originPrice,

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

      limitPerOrder,

      preciousMaterials,

      pearls,

      diamonds,

      otherMaterials,

      certifications,
    } = req.body

    const jewelry = await Jewelry.findOne({
      _id: jewelryId,

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

    jewelry.images = [...existingImages, ...newImageUrls]

    jewelry.name = name ?? jewelry.name

    jewelry.description = description ?? jewelry.description

    jewelry.type = type ?? jewelry.type

    jewelry.mainMaterial = mainMaterial ?? jewelry.mainMaterial

    jewelry.totalWeight = totalWeight ?? jewelry.totalWeight

    jewelry.productionCost = productionCost ?? jewelry.productionCost

    jewelry.originPrice = originPrice ?? jewelry.originPrice

    jewelry.limitPerOrder = limitPerOrder ?? jewelry.limitPerOrder

    jewelry.preciousMaterials = preciousMaterials
      ? JSON.parse(preciousMaterials)
      : jewelry.preciousMaterials

    jewelry.pearls = pearls ? JSON.parse(pearls) : jewelry.pearls

    jewelry.diamonds = diamonds ? JSON.parse(diamonds) : jewelry.diamonds

    jewelry.otherMaterials = otherMaterials
      ? JSON.parse(otherMaterials)
      : jewelry.otherMaterials

    // validate certifications

    jewelry.certifications = certifications
      ? JSON.parse(certifications)
      : jewelry.certifications

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
  getJewelryByShop,
  getJewelryByShop,
  createJewelry,
  deleteJewelry,
  updateJewelry,
}