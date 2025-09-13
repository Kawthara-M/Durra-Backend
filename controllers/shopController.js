const crypto = require("crypto")
const Shop = require("../models/Shop")
const { createUser } = require("../services/userServices.js")
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

// tested
const createShop = async (req, res) => {
  try {
    const { email, phone, role, name, cr, description } = req.body

    const user = await createUser({
      email,
      phone,
      role,
    })

    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    // Store token and expiry
    user.passwordResetToken = hashedToken
    user.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000
    await user.save()

    await Shop.create({
      user: user._id,
      name: name || "",
      cr: cr || "",
      description: description || "",
    })

    const resetLink = `http://localhost:3010/auth/set-password?token=${resetToken}`
    // uncomment later so we dont spam
    await sendEmail({
      to: email,
      subject: "Durra Account Activation",
      text: `Greetings ${name},\n\nThanks for signing up as a jeweler. You have been assigned access to Durra platform, use this link ${resetLink} to set your password. Please make sure to update your password.\n\n- Durra Team`,
    })

    return res.status(201).json({
      message: "Shop Successfully Created!",
      userId: user._id,
    })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getAllShops,
  getShop,
  createShop,
}
