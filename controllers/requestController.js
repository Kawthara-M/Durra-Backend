const crypto = require("crypto")
const Request = require("../models/Request")
const User = require("../models/User")
const Shop = require("../models/Shop")
const { sendEmail } = require("../services/emailService")
const { createUser } = require("../services/userServices")

// tested!
const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find().populate("user")

    res.status(200).json({ requests })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching requests.",
    })
  }
}

// tested!
const getRequest = async (req, res) => {
  try {
    const { requestId } = req.params

    const request = await Request.findById(requestId).populate("user")
    if (!request) {
      return res.status(404).json({ error: "Request not found." })
    }

    res.status(200).json({
      request,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching this request.",
    })
  }
}

const getAllRequestsByShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId)
    if (!shop) return res.status(404).json({ error: "Shop not found." })

    const requests = await Request.find({ user: shop.user }).populate("user")

    res.status(200).json({
      requests,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching requests for this shop",
    })
  }
}

// requires testing with each logic added
const updateRequest = async (req, res) => {
  try {
    const { requestId } = req.params
    const { status, adminNote } = req.body

    const userRole = res.locals.payload.role

    const request = await Request.findById(requestId)
    if (!request) {
      return res.status(404).json({ error: "Request not found." })
    }

    if (userRole === "Admin") {
      if (!["approved", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Invalid status. Must be 'approved' or 'rejected'." })
      }

      if (request.status === status) {
        return res.status(400).json({ error: `Request is already ${status}.` })
      }

      // should test
      if (status === "approved") {
        const parsedDetails =
          typeof request.details === "string" ? JSON.parse(request.details) : request.details
        const { email, name, cr, description } = parsedDetails

        const user = await User.findById(request.user)

        if (!user) {
          return res.status(404).json({ error: "User not found." })
        }

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

        const resetLink = `http://localhost:5173/set-password?token=${resetToken}`
        // uncomment later so we dont spam
        await sendEmail({
          to: email,
          subject: "Durra Account Activation",
          text: `Greetings ${name},\n\nThanks for signing up as a jeweler. You have been assigned access to Durra platform, use this link ${resetLink} to set your password.\nThis link will expire in 24 hours. If you do not activate your account in time, please contact support to resend the invitation.\n\n- Durra Team`,
        })

        return res.status(201).json({
          message: "Shop Successfully Created!",
          userId: user._id,
        })
      }

      if (status === "rejected") {
        const user = await User.findById(request.user)

        if (!user) {
          return res.status(404).json({ error: "User not found." })
        }

        await sendEmail({
          to: user.email,
          subject: "Durra Account",
          text: `Greetings ${
            user.name
          },\n\nThanks for signing up as a jeweler, unfortunately your request have been declined.${
            adminNote ? adminNote : null
          }\n\n- Durra Team`,
        })

        await User.findByIdAndDelete(user._id)
      }

      request.status = status
      request.adminNote = adminNote || ""
      await request.save()

      return res
        .status(200)
        .json({ message: `Request ${status} successfully.` })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to update request." })
  }
}

// test again
const createRequest = async (req, res) => {
  try {
    let { details } = req.body
    if (typeof details === "string") {
      try {
        details = JSON.parse(details)
      } catch (err) {
        return res.status(400).json({ error: "Invalid JSON in details field." })
      }
    }

    if (!details) {
      return res.status(400).json({ error: "Missing required fields." })
    }

    const { email, phone, address } = details
    console.log(req.body)

    const user = await createUser({
      email,
      phone,
      role: "Jeweler",
      address,
    })
    const newRequest = await Request.create({
      user: user._id,
      details,
      status: "pending",
    })

    await newRequest.save()

    return res
      .status(201)
      .json({ message: "Request created successfully.", request: newRequest })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to create request." })
  }
}

module.exports = {
  getAllRequests,
  getRequest,
  getAllRequestsByShop,
  updateRequest,
  createRequest,
}
