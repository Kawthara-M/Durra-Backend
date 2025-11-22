const crypto = require("crypto")
const Shop = require("../models/Shop")
const User = require("../models/User")
const Jewelry = require("../models/Jewelry")
const Collection = require("../models/Collection")
const Service = require("../models/Service")
const Order = require("../models/Order")
const Address = require("../models/Address")
const Request = require("../models/Request")
const { sendEmail } = require("../services/emailService")

// tested
const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find().populate("user")

    res.status(200).json({
      shops,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching shops.",
    })
  }
}

// tested
const getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId).populate({
      path: "user",
      populate: { path: "defaultAddress" },
    })
    if (!shop) {
      return res.status(404).json({
        error: "Shop not found. It may have been deleted or does not exist.",
      })
    }

    res.status(200).json({
      shop,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching this shop.",
    })
  }
}

const getProducts = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId)
    if (!shop) {
      return res.status(404).json({
        error: "Shop not found. It may have been deleted or does not exist.",
      })
    }
    const jewelry = await Jewelry.find({
      shop: req.params.shopId,
      deleted: false,
    })
    const service = await Service.find({
      shop: req.params.shopId,
      deleted: false,
    })
    const collection = await Collection.find({
      shop: req.params.shopId,
    })

    return res.status(200).json({
      jewelry,
      service,
      collection,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching this shop's products.",
    })
  }
}

//should test
const updateShop = async (req, res) => {
  try {
    const { shopId } = req.params
    const { name, cr, description } = req.body
    const { id: userId, role } = res.locals.payload

    if (!shopId) {
      return res
        .status(400)
        .json({ error: "No Shop ID provided for deletion." })
    }

    const shop = await Shop.findById(shopId)
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }

    const isAdmin = role === "Admin"
    const isOwnerJeweler = role === "Jeweler" && shop.user.toString() === userId

    if (!isAdmin && !isOwnerJeweler) {
      return res.status(403).json({
        error: "Unauthorized: You do not have permission to update this shop.",
      })
    }

    const BASE_URL = process.env.BASE_URL

    let logo = shop.logo
    if (req.file) {
      logo = `${BASE_URL}/uploads/${req.file.filename}`
    }

    shop.name = name ?? shop.name
    shop.cr = cr ?? shop.cr
    shop.description = description ?? shop.description
    shop.logo = logo

    await shop.save()

    return res.status(200).json({
      message: "Shop updated successfully.",
      shop,
    })
  } catch (error) {
    console.error("Error editing shop:", error)
    return res.status(500).json({ error: error.message })
  }
}

// tested
const deleteShop = async (req, res) => {
  try {
    const { shopId } = req.params

    if (!shopId) {
      return res
        .status(400)
        .json({ error: "No Shop ID provided for deletion." })
    }

    const shop = await Shop.findById(shopId)
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }

    const user = await User.findById(shop.user)

    await Collection.deleteMany({ shop: shopId })
    await Jewelry.deleteMany({ shop: shopId })
    await Service.deleteMany({ shop: shopId })
    await Order.deleteMany({ shop: shopId })
    await Shop.findByIdAndDelete(shopId)

    if (user) {
      await Address.deleteMany({ user: user._id })
      await Request.deleteMany({ user: user._id })
      await User.findByIdAndDelete(user._id)

      await sendEmail({
        to: user.email,
        subject: "Your Durra Shop Has Been Removed",
        html: `
  <div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
    <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">
      
      <h2 style="color:#6f0101; font-size:1.6em; text-align:center; margin-bottom:1.3em;">
        Shop Deletion Notice
      </h2>

      <p style="font-size:1em; line-height:1.6;">
        Greetings ${user.name},
      </p>

      <p style="font-size:1em; line-height:1.6; margin-bottom:.8em;">
        Durra team would like to inform you that your shop 
        <strong>"${
          shop.name
        }"</strong> has been successfully removed from the <strong>Durra Platform</strong>.
      </p>

      <p style="font-size:1em; line-height:1.6;">
        All data related to your shop, including products, collections, services, and associated orders, have also been deleted from our system according to our platform policies.
      </p>

      <p style="font-size:1em; line-height:1.6; margin-top:1.4em;">
        If you believe this action was taken in error or would like further clarification, please do not hesitate to contact our support team.
      </p>

      <p style="font-size:1em; margin-top:2em; font-weight:bold; text-align:center;">
        Best regards,<br />
        <span style="color:#6f0101;">Durra Team</span>
      </p>

      <div style="margin-top:2.5em; text-align:center;">
        DURRA
      </div>

    </div>
  </div>
  `,
      })
    }

    return res
      .status(200)
      .json({ message: "Shop and related data deleted successfully." })
  } catch (error) {
    console.error("Error deleting shop:", error)
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getAllShops,
  getShop,
  getProducts,
  updateShop,
  deleteShop,
}
