const crypto = require("crypto")
const Driver = require("../models/Driver")
const User = require("../models/User")
const Shipment = require("../models/Shipment")
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
    const { fName, lName, email, phone, licenseNo, vehiclePlateNumber } =
      req.body

    if (
      !fName ||
      !lName ||
      !email ||
      !phone ||
      !licenseNo ||
      !vehiclePlateNumber
    ) {
      return res.status(400).json({ error: "All fields are required." })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use." })
    }

    const user = await User.create({
      fName,
      lName,
      email,
      phone,
      role: "Driver",
    })

    const driver = await Driver.create({
      user: user._id,
      licenseNo,
      vehiclePlateNumber,
    })

    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    user.passwordResetToken = hashedToken
    user.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000
    await user.save()

    const activationUrl = `http://localhost:5173/set-password?token=${resetToken}`

    await sendEmail({
      to: user.email,
      subject: "Activate Your Durra Driver Account",
      html: `
  <div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
    <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">

      <h2 style="color:#000; font-size:1.5em; margin-bottom:1em;">
        Activate Your Driver Account
      </h2>

      <p style="font-size:1em; line-height:1.6;">
        Greetings ${user.fName || ""} ${user.lName || ""},
      </p>

      <p style="font-size:1em; line-height:1.6; margin-bottom:1.5em;">
        You have been registered as a driver on the <strong>Durra</strong> platform.
        Please click the button below to set your account password and complete your setup.
      </p>

      <a href="${activationUrl}" style="
        display:inline-block;
        background:#6f0101;
        color:#fff;
        padding:0.8em 1.4em;
        text-decoration:none;
        font-weight:bold;
        border-radius:0.4em;
      ">
        Set Password
      </a>

      <p style="font-size:0.9em; color:#777; margin-top:2em;">
        If you were not expecting this email or believe this was sent in error,
        please contact the Durra support team.
      </p>

      <div style="margin-top:2.5em; text-align:center;">
        DURRA
      </div>
    </div>
  </div>
      `,
    })

    return res.status(201).json({
      message: "Driver created successfully.",
      user: {
        _id: user._id,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        driver: {
          _id: driver._id,
          licenseNo: driver.licenseNo,
          vehiclePlateNumber: driver.vehiclePlateNumber,
        },
      },
    })
  } catch (error) {
    console.error("Error creating driver:", error)
    return res.status(500).json({ error: "Failed to create driver." })
  }
}

const updateDriver = async (req, res) => {
  try {
    const { driverId } = req.params
    const { fName, lName, email, phone, licenseNo, vehiclePlateNumber } =
      req.body
    if (!driverId) {
      return res
        .status(400)
        .json({ error: "No Driver ID provided for update." })
    }

    const driver = await Driver.findById(driverId)
    if (!driver) {
      return res.status(404).json({ error: "Driver not found." })
    }

    const user = await User.findById(driver.user)
    if (!user) {
      return res
        .status(404)
        .json({ error: "User associated with this driver not found." })
    }

    if (fName !== undefined) user.fName = fName
    if (lName !== undefined) user.lName = lName
    if (email !== undefined) user.email = email
    if (phone !== undefined) user.phone = phone

    if (licenseNo !== undefined) driver.licenseNo = licenseNo
    if (vehiclePlateNumber !== undefined)
      driver.vehiclePlateNumber = vehiclePlateNumber

    await user.save()
    await driver.save()

    const updatedDriver = await Driver.findById(driverId).populate({
      path: "user",
      select: "fName lName email phone role",
    })

    return res.status(200).json({
      message: "Driver updated successfully.",
      driver: updatedDriver,
    })
  } catch (error) {
    console.error("Error editing driver:", error)
    return res.status(500).json({ error: error.message })
  }
}

const deleteDriver = async (req, res) => {
  try {
    const { driverId } = req.params

    if (!driverId) {
      return res
        .status(400)
        .json({ error: "No Driver ID provided for deletion." })
    }

    const driver = await Driver.findById(driverId)
    if (!driver) {
      return res.status(404).json({ error: "Driver not found." })
    }

    const user = await User.findById(driver.user)

    await Shipment.deleteMany({ driver: driverId })
    await Driver.findByIdAndDelete(driverId)

    if (user) {
      await User.findByIdAndDelete(user._id)

      await sendEmail({
        to: user.email,
        subject: "Your Durra Driver Account Has Been Removed",
        html: `
  <div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
    <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">
      
      <h2 style="color:#6f0101; font-size:1.6em; text-align:center; margin-bottom:1.3em;">
        Driver Account Removal Notice
      </h2>

      <p style="font-size:1em; line-height:1.6;">
        Greetings ${user.fName},
      </p>

      <p style="font-size:1em; line-height:1.6; margin-bottom:.8em;">
        Durra team would like to inform you that your <strong>Driver Account</strong> on the 
        <strong>Durra Platform</strong> has been removed.
      </p>

      <p style="font-size:1em; line-height:1.6;">
        This removal includes all data associated with your driver profile, including license information,
        vehicle details, and associated delivery records.
      </p>

      <p style="font-size:1em; line-height:1.6; margin-top:1.4em;">
        If you believe this action was a mistake or need further clarification, please feel free to contact our support team.
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
      .json({ message: "Driver and related data deleted successfully." })
  } catch (error) {
    console.error("Error deleting driver:", error)
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  getAllDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
}
