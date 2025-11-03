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
      deleted: { $ne: true }
    }).sort({ createdAt: -1 })

    res.json({ jewelries })
  } catch (error) {
    console.error("Error fetching jewelry by shop:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

const validateGIA = async () => {}

const createJewelry = async (req, res) => {
}

const updateJewelry = async (req, res) => {
}

const deleteJewelry = async (req, res) => {
}

module.exports = {
  getAllJewelry,
  getJewelry,
  getJewelryByShop,
  createJewelry,
  deleteJewelry,
  updateJewelry,
}