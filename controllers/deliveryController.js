const crypto = require("crypto")
const Driver = require("../models/Driver")
const { createUser } = require("../services/userServices.js")
const { sendEmail } = require("../services/emailService")

const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().populate("user")

    res.status(200).json({
      drivers,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching delivery providers.",
    })
  }
}

const getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate("user")
    if (!driver) {
      return res.status(404).json({
        error: "Driver not found",
      })
    }

    res.status(200).json({
      driver,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching this driver.",
    })
  }
}

const createDriver = async (req, res) => {
  try {
    const { fName, lName, address, email, phone, role, licenseNo, vehiclePlateNumber } = req.body

    const user = await createUser({
      fName,
      lName,
      address,
      email,
      phone,
      role,
    })

    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    user.passwordResetToken = hashedToken
    user.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000
    await user.save()

    await Driver.create({
      user: user._id,
      licenseNo: licenseNo || "",
      vehiclePlateNumber: vehiclePlateNumber || "",
    })

    const resetLink = `http://localhost:3010/auth/set-password?token=${resetToken}`
    // uncomment later so we dont spam
    await sendEmail({
      to: email,
      subject: "Durra Account Activation",
      text: `Greetings ${fName} ${lName},\n\nThanks for signing up as a Delivery provider. You have been assigned access to Durra platform, use this link ${resetLink} to set your password. Please make sure to update your password.\n\n- Durra Team`,
    })

    return res.status(201).json({
      message: "DeliveryMan Successfully Created!",
      userId: user._id,
    })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getAllDrivers,
  getDriver,
  createDriver,
}
