const Shipment = require("../models/Shipment")
const Driver = require("../models/Driver")

const getShipments = async (req, res) => {
  try {
    const { id: userId } = res.locals.payload

    const driver = await Driver.findOne({ user: userId })
    if (!driver) {
      return res.status(404).json({ error: "Driver profile not found." })
    }

    const shipments = await Shipment.find({ driver: driver._id }).populate({
      path: "order",
      populate: [
        {
          path: "shop",
          populate: {
            path: "user",
            populate: { path: "defaultAddress", model: "Address" },
          },
        },
        { path: "user" },
        { path: "address" },
      ],
    })

    res.status(200).json({ shipments })
  } catch (error) {
    console.error("Error fetching shipments:", error)
    return res.status(500).json({
      error: "Failure encountered while fetching shipments.",
    })
  }
}

const getShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).populate({
      path: "order",
      populate: [
        {
          path: "shop",
          populate: {
            path: "user",
            populate: { path: "defaultAddress", model: "Address" },
          },
        },
        { path: "user" },
        { path: "address" },
      ],
    })

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found." })
    }

    res.status(200).json({ shipment })
  } catch (error) {
    console.error("Error fetching shipment:", error)
    return res.status(500).json({
      error: "Failure encountered while fetching shipment.",
    })
  }
}

const formatAddress = (address) => {
  if (!address) return "Address not available"

  const parts = [
    address.governante && `${address.governante} Governorate`,
    address.area,
    address.road && `Road ${address.road}`,
    address.block && `Block ${address.block}`,
    address.house && `House ${address.house}`,
  ].filter(Boolean)

  return parts.join(", ")
}

const updateShipment = async (req, res) => {
  try {
    const { id } = req.params
    const { securityKey } = req.body
    const { id: userId, role } = res.locals.payload

    if (!securityKey) {
      return res.status(400).json({
        error: "Security key is required to update shipment.",
      })
    }

    const shipment = await Shipment.findById(id)
      .populate({
        path: "driver",
        populate: { path: "user" },
      })
      .populate({
        path: "order",
        populate: [
          { path: "user" },
          { path: "address" },
          {
            path: "shop",
            populate: {
              path: "user",
              populate: { path: "defaultAddress", model: "Address" },
            },
          },
        ],
      })

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found." })
    }

    if (!shipment.driver || !shipment.driver.user) {
      return res.status(403).json({
        error: "No driver assigned to this shipment.",
      })
    }

    if (shipment.driver.user._id.toString() !== userId) {
      return res.status(403).json({
        error: "You are not assigned to this shipment.",
      })
    }

    if (shipment.status !== "out-for-shipping") {
      return res.status(400).json({
        error: `Cannot mark shipment as delivered from status '${shipment.status}'.`,
      })
    }

    if (shipment.securityKey !== securityKey.trim()) {
      return res.status(400).json({
        error: "Invalid security key. Please verify with the customer.",
      })
    }

    shipment.status = "delivered"
    shipment.deliveredAt = new Date()
    shipment.securityKey = undefined

    const order = shipment.order
    if (order) {
      order.status = "delivered"
      await order.save()
    }

    await shipment.save()

    if (order && order.user && order.user.email) {
      const deliveryAddressText = formatAddress(order.address)

      await sendEmail({
        to: order.user.email,
        subject: "Your Order Has Been Delivered - Durra",
        html: `
        <div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
          <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">

            <h2 style="color:#000; font-size:1.5em; margin-bottom:1em;">Your Order Has Been Delivered</h2>

            <p style="font-size:1em; line-height:1.6;">
              Greetings ${order.user.fName || ""} ${order.user.lName || ""},
            </p>

            <p style="font-size:1em; line-height:1.6;">
              Your order (<strong>#${
                order._id
              }</strong>) has been successfully delivered.
            </p>

            <p style="font-size:1em; line-height:1.6; margin-top:1.2em;">
              <strong>Delivered To:</strong><br/>
              ${deliveryAddressText}
            </p>

            <p style="font-size:0.95em; color:#555; line-height:1.6; margin-top:1.5em;">
              DURRA hopes you are satisfied with your experience. Hearing your feedback
              about the delivery and the items you received would be highly appreciated.
            </p>

            <p style="font-size:0.95em; color:#555; line-height:1.6; margin-top:0.5em;">
              You can share your feedback by replying to this email or leaving a review within the reviews section of th each item.
            </p>

            <p style="font-size:0.9em; color:#777; margin-top:2em;">
              Thank you for using Durra.
            </p>

            <div style="margin-top:2.5em; text-align:center;">
              DURRA
            </div>
          </div>
        </div>
        `,
      })
    }

    return res.status(200).json({
      message: "Shipment marked as delivered and customer notified.",
      shipment,
    })
  } catch (error) {
    console.error("Error updating shipment:", error)
    return res.status(500).json({
      error: "Failure encountered while updating shipment.",
    })
  }
}

module.exports = {
  getShipments,
  getShipment,
  updateShipment,
}
