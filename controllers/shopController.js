const crypto = require("crypto")
const Shop = require("../models/Shop")
const User = require("../models/User")
const Jewelry = require("../models/Jewelry")
const Collection = require("../models/Collection")
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
    const shop = await Shop.findById(req.params.shopId).populate("user")
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

//should test
const updateShop = async (req, res) => {
  try {
    const { shopId } = req.params
    const { name, cr, description} = req.body
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
      return res
        .status(403)
        .json({
          error:
            "Unauthorized: You do not have permission to update this shop.",
        })
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      { name, cr, description },
      { new: true }
    )

    return res
      .status(200)
      .json({ message: "Shop data edited successfully.", updatedShop })
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

    await Jewelry.deleteMany({ shop: shopId })
    await Collection.deleteMany({ shop: shopId })
    await Order.deleteMany({ shop: shopId })
    await Shop.findByIdAndDelete(shopId)

    if (user) {
      await Address.deleteMany({ user: user._id })
      await Request.deleteMany({ user: user._id })
      await User.findByIdAndDelete(user._id)

      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: "Your Shop Has Been Deleted",
          text: `Greetings,

We would like to inform you that your shop "${shop.name}" has been successfully deleted from the Durra platform. All associated data, including products and orders, have also been removed.

If you have any questions or concerns, feel free to contact our support team.

Best regards,  
Durra Team`,
        })
      }
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
  updateShop,
  deleteShop,
}
