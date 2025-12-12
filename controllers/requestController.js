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

// I dont think we're using
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
          typeof request.details === "string"
            ? JSON.parse(request.details)
            : request.details
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

        user.passwordResetToken = hashedToken
        user.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000
        await user.save()

        await Shop.create({
          user: user._id,
          name: name || "",
          cr: cr || "",
          description: description || "",
        })

        const activationUrl = `http://localhost:5173/set-password?token=${resetToken}`

        await sendEmail({
          to: email,
          subject: "Durra Account Activation",
          html: `
  <div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
    <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">

      <h2 style="color:#000; font-size:1.5em; margin-bottom:1em;">Activate Your Durra Account</h2>

      <p style="font-size:1em; line-height:1.6;">
        Greetings ${name || user.fName || user.name || "Valued Jeweler"},
      </p>

      <p style="font-size:1em; line-height:1.6; margin-bottom:1.5em;">
        Thank you for signing up as a jeweler. Your request has been approved and you have been granted access to the Durra platform.
        Click the button below to set your password and activate your account.
      </p>

      <a href="${activationUrl}" style="
        display:inline-block;
        background:#6f0101;
        color:#fff;
        padding:0.8em 1.4em;
        text-decoration:none;
        font-weight:bold;
        border-radius:0.4em;
      ">Set Password</a>

      <p style="font-size:0.9em; color:#777; margin-top:2em;">
        This link will expire in 24 hours. If it expires before you activate your account, please contact support to resend the invitation.
      </p>

      <div style="margin-top:2.5em; text-align:center;">
        DURRA
      </div>
    </div>
  </div>
      `,
        })

        request.status = status
        request.adminNote = adminNote || ""
        await request.save()

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
          subject: "Durra Account Request Update",
          html: `
  <div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
    <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">

      <h2 style="color:#000; font-size:1.5em; margin-bottom:1em;">Account Request Declined</h2>

      <p style="font-size:1em; line-height:1.6;">
        Greetings ${user.name || "Applicant"},
      </p>

      <p style="font-size:1em; line-height:1.6; margin-bottom:1.5em;">
        Thank you for your interest in joining the Durra platform as a jeweler.
        After reviewing your request, it is regret to inform you that it has been declined at this time.
      </p>

      ${
        adminNote
          ? `
      <div style="margin:1.5em 0; padding:1em; background:#f9f1f1; border-left:0.25em solid #6f0101;">
        <p style="font-size:0.95em; margin:0;">
          <strong>Admin Note:</strong><br/>
          ${adminNote}
        </p>
      </div>
      `
          : ""
      }

      <p style="font-size:0.95em; line-height:1.6; color:#555;">
        If you believe this was a mistake or would like to provide additional information, please contact Durra support for further assistance.
      </p>

      <div style="margin-top:2.5em; text-align:center; ont-family:'Playfair Display','Times New Roman'">
        DURRA
      </div>
    </div>
  </div>
      `,
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
