const Shop = require("../models/Shop")
const User = require("../models/User")
const Order = require("../models/Order")
const Jewelry = require("../models/Jewelry")
const Collection = require("../models/Collection")
const Service = require("../models/Service")
const Shipment = require("../models/Shipment")
const Driver = require("../models/Driver")
const crypto = require("crypto")

const { sendEmail } = require("../services/emailService")


const orderPopulateConfig = [
  {
    path: "jewelryOrder.item",
    strictPopulate: false, // because of refPath
    populate: {
      path: "jewelry", // this exists only on Collection
      model: "Jewelry",
      strictPopulate: false,
    },
  },
  {
    path: "serviceOrder.service",
    strictPopulate: false,
  },
  { path: "shop", strictPopulate: false },
  { path: "user", strictPopulate: false },
]

// test again
const getAllOrders = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const role = res.locals.payload.role

    let orders = []

    if (role === "Customer") {
      orders = await Order.find({ user: userId }).populate(orderPopulateConfig)
    } else if (role === "Jeweler") {
      const shop = await Shop.findOne({ user: userId })
      if (!shop) {
        return res.status(404).json({ error: "Shop not found." })
      }

      orders = await Order.find({
        shop: shop._id,
        status: { $nin: ["pending", "cancelled"] },
      })
        .populate("user")
        .populate({
          path: "jewelryOrder.item",
        })

        .populate({
          path: "serviceOrder",
          populate: {
            path: "service",
            model: "Service",
          },
        })
    } else if (role === "Admin") {
      orders = await Order.find()
        .populate("user")
        .populate("jewelryOrder")
        .populate("serviceOrder")
        .populate("shop")
      console.log(orders.length)
    } else if (role === "Driver") {
      orders = await Order.find().populate("user")
    } else {
      return res.status(403).json({ message: "Access denied" })
    }

    res.status(200).json({ orders })
  } catch (error) {
    console.error("Error fetching all orders:", error)
    res.status(500).json({ message: "Failed to fetch orders" })
  }
}

const getPendingOrder = async (req, res) => {
  try {
    const userId = res.locals.payload.id

    const order = await Order.findOne({
      user: userId,
      status: "pending",
    })
      .populate({
        path: "jewelryOrder.item",
        strictPopulate: false, // because of refPath (Jewelry | Collection)
        populate: {
          path: "jewelry", // only exists on Collection
          model: "Jewelry",
          strictPopulate: false,
        },
      })
      .populate({
        path: "serviceOrder.service",
        strictPopulate: false,
      })
      .populate("shop")
      .populate("user")

    return res.status(200).json(order || null)
  } catch (err) {
    console.error("Error fetching order:", err)
    return res.status(500).json({ message: "Failed to fetch pending order" })
  }
}

// tested,
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      orderPopulateConfig
    )

    const userId = res.locals.payload.id
    const userRole = res.locals.payload.role

    if (!order) {
      return res.status(404).json({ error: "Order not found." })
    }
    if (
      userRole !== "Admin" &&
      userRole !== "Jeweler" &&
      order.user._id.toString() !== userId
    ) {
      return res.status(403).json({ error: "Unauthorized to view this Order." })
    }

    res.status(200).json({
      order,
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({ message: "Failed to fetch order" })
  }
}

// tested
const createOrder = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const {
      jewelryOrder = [],
      serviceOrder = [],
      totalPrice,
      collectionMethod,
    } = req.body

    let { address } = req.body

    if (jewelryOrder.length === 0 && serviceOrder.length === 0) {
      return res.status(400).json({ message: "Order cannot be empty." })
    }

    if (!address) {
      const user = await User.findById(userId).select("defaultAddress")
      if (!user.defaultAddress) {
        address = ""
      }
      address = user.defaultAddress
    }

    let shopId
    if (jewelryOrder.length > 0) {
      for (const orderItem of jewelryOrder) {
        const { item, itemModel, quantity } = orderItem

        if (!item || !itemModel) {
          return res
            .status(400)
            .json({ message: "Missing item or itemModel in jewelryOrder." })
        }

        if (itemModel === "Jewelry") {
          const jewelryDoc = await Jewelry.findById(item)
          if (!jewelryDoc) {
            return res.status(404).json({ message: "Jewelry not found." })
          }

          if (quantity > jewelryDoc.limitPerOrder) {
            return res.status(400).json({
              message: `Quantity for jewelry '${jewelryDoc.name}' exceeds limit (${jewelryDoc.limitPerOrder}).`,
            })
          }

          shopId = jewelryDoc.shop
        }

        if (itemModel === "Collection") {
          const collectionDoc = await Collection.findById(item)
          if (!collectionDoc) {
            return res.status(404).json({ message: "Collection not found." })
          }

          if (quantity > collectionDoc.limitPerOrder) {
            return res.status(400).json({
              message: `Quantity for collection '${collectionDoc.name}' exceeds limit (${collectionDoc.limitPerOrder}).`,
            })
          }

          shopId = collectionDoc.shop
        }
      }
    } else if (serviceOrder.length > 0) {
      for (const serviceItem of serviceOrder) {
        const serviceDoc = await Service.findById(serviceItem.service)

        if (!serviceDoc) {
          return res.status(404).json({ message: "Service not found." })
        }

        if (
          !Array.isArray(serviceItem.jewelry) ||
          serviceItem.jewelry.length > serviceDoc.limitPerOrder
        ) {
          return res.status(400).json({
            message: `Too many jewelry items for service '${serviceDoc.name}'. Limit is ${serviceDoc.limitPerOrder}.`,
          })
        }

        shopId = serviceDoc.shop
      }
    }

    const newOrder = new Order({
      user: userId,
      shop: shopId,
      jewelryOrder,
      serviceOrder,
      totalPrice,
      collectionMethod,
      status: "pending",
      notes: "",
      address,
    })

    await newOrder.save()

    res.status(201).json({
      message: "Order created successfully.",
      order: newOrder,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ message: "Failed to create order" })
  }
}

// tested: using insomnia
const VAT_RATE = 0.1
const DELIVERY_FLAT = 2

const updateOrder = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const { orderId } = req.params

    const hasJewelryOrder = Object.prototype.hasOwnProperty.call(
      req.body,
      "jewelryOrder"
    )
    const hasServiceOrder = Object.prototype.hasOwnProperty.call(
      req.body,
      "serviceOrder"
    )

    let order = await Order.findOne({ _id: orderId, user: userId })
      .populate("jewelryOrder.item")
      .populate("serviceOrder.service")
      .populate("shop")

    if (!order) {
      return res.status(404).json({ message: "Order not found." })
    }

    let newJewelryOrder = order.jewelryOrder || []
    let newServiceOrder = order.serviceOrder || []

    if (hasJewelryOrder) {
      const incomingJewelry = Array.isArray(req.body.jewelryOrder)
        ? req.body.jewelryOrder
        : []

      newJewelryOrder = incomingJewelry.map((entry) => ({
        item:
          typeof entry.item === "object" && entry.item !== null
            ? entry.item._id
            : entry.item,
        itemModel: entry.itemModel,
        quantity: entry.quantity ?? 1,
        totalPrice: Number(entry.totalPrice || 0),
        ...(entry.size ? { size: entry.size } : {}),
      }))
    }

    if (hasServiceOrder) {
      const incomingService = Array.isArray(req.body.serviceOrder)
        ? req.body.serviceOrder
        : []

      newServiceOrder = incomingService.map((s) => ({
        _id: s._id,
        service:
          typeof s.service === "object" && s.service !== null
            ? s.service._id
            : s.service,
        totalPrice: Number(s.totalPrice || 0),
        jewelry: (s.jewelry || []).map((j) => ({
          name: j.name || "",
          material: j.material || "",
          type: j.type || "",
          details: j.details || "",
        })),
      }))
    }

    const subtotalJewelry = newJewelryOrder.reduce(
      (sum, j) => sum + Number(j.totalPrice || 0),
      0
    )
    const subtotalServices = newServiceOrder.reduce(
      (sum, s) => sum + Number(s.totalPrice || 0),
      0
    )

    const subtotal = subtotalJewelry + subtotalServices

    const { collectionMethod, paymentMethod, address, notes, shop } = req.body

    const isCheckoutStep = Boolean(paymentMethod || collectionMethod || address)

    let finalCollectionMethod =
      collectionMethod || order.collectionMethod || "delivery"

    let finalTotalPrice = subtotal

    if (isCheckoutStep) {
      const vatAmount = subtotal * VAT_RATE
      const deliveryFee =
        finalCollectionMethod === "at-shop-collection" ? 0 : DELIVERY_FLAT

      finalTotalPrice = subtotal + vatAmount + deliveryFee
    }

    order.jewelryOrder = newJewelryOrder
    order.serviceOrder = newServiceOrder
    order.totalPrice = finalTotalPrice

    if (typeof notes !== "undefined") {
      order.notes = notes
    }

    if (typeof shop !== "undefined") {
      order.shop =
        typeof shop === "object" && shop !== null ? shop._id || shop : shop
    }

    if (isCheckoutStep) {
      order.collectionMethod = finalCollectionMethod
      if (paymentMethod) order.paymentMethod = paymentMethod
      if (address) order.address = address
    }

    const updated = await order.save()

    const populated = await Order.findById(updated._id)
      .populate("jewelryOrder.item")
      .populate("serviceOrder.service")
      .populate("shop")

    return res.status(200).json({ order: populated })
  } catch (error) {
    console.error("Error updating order:", error)
    return res.status(500).json({ message: "Failed to update order." })
  }
}

const activeTimers = new Map()

const startJewelerTimeout = (orderId, minutes = 2) => {
  if (activeTimers.has(orderId)) {
    clearTimeout(activeTimers.get(orderId))
  }

  const timer = setTimeout(async () => {
    try {
      const order = await Order.findById(orderId)

      if (order && order.status === "submitted") {
        order.status = "pending"
        await order.save()
        console.log(
          ` Order ${orderId} reverted back to pending (jeweler timeout).`
        )
      }
    } catch (err) {
      console.error("Timeout revert failed:", err)
    } finally {
      activeTimers.delete(orderId)
    }
  }, minutes * 60 * 1000)

  activeTimers.set(orderId, timer)
}

const formatAddress = (addr) => {
  if (!addr) return "Address not available"
  const parts = []

  if (addr.governante || addr.governorate) {
    parts.push(`${addr.governante || addr.governorate} Governorate`)
  }
  if (addr.area) parts.push(addr.area)
  if (addr.road) parts.push(`Road ${addr.road}`)
  if (addr.block) parts.push(`Block ${addr.block}`)
  if (addr.house) parts.push(`House / Apartment ${addr.house}`)
  return parts.filter(Boolean).join(", ")
}

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params
    const { status: newStatus } = req.body
    const userId = res.locals.payload.id
    const role = res.locals.payload.role

    if (!newStatus) {
      return res.status(400).json({ message: "New status is required." })
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "shop",
        populate: {
          path: "user",
          populate: { path: "defaultAddress", model: "Address" },
        },
      })
      .populate("user")
      .populate("address")

    if (!order) {
      return res.status(404).json({ message: "Order not found." })
    }

    const currentStatus = order.status

    const statusTransitions = {
      Customer: {
        pending: ["submitted"],
        submitted: ["pending"],
      },
      Jeweler: {
        submitted: ["accepted", "rejected"],
        accepted: ["processing"],
        processing: ["pickup", "ready"],
        ready: ["out"],
        pickup: ["picked-up"],
      },
      Driver: {
        pickup: ["delivered"],
      },
    }

    const allowedTransitions = statusTransitions[role]?.[currentStatus] || []

    if (!allowedTransitions.includes(newStatus)) {
      return res.status(403).json({
        message: `${role} cannot change order from '${currentStatus}' to '${newStatus}'`,
      })
    }

    if (role === "Customer") {
      if (order.user._id.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this order." })
      }
    } else if (role === "Jeweler") {
      const shop = await Shop.findOne({ user: res.locals.payload.id })
      console.log(order.shop)
      if (!shop || order.shop._id.toString() !== shop._id.toString()) {
        return res
          .status(403)
          .json({ message: "Unauthorized: Not your order." })
      }
    } else if (role === "Driver") {
      if (order.driver?.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized: Not assigned to this order." })
      }
    }

    // update status
    order.status = newStatus
    await order.save()

    if (newStatus === "submitted") {
      startJewelerTimeout(orderId, 2)
    }

    // assign shipment to driver, update them, and update customer
    if (newStatus === "ready" && order.collectionMethod === "delivery") {
      const drivers = await User.find({ role: "Driver" })
      if (drivers.length === 0) {
        throw new Error("No delivery men available")
      }

      const randomIndex = Math.floor(Math.random() * drivers.length)
      const assignedDriverUser = drivers[randomIndex]

      const driver = await Driver.findOne({
        user: assignedDriverUser._id,
      }).populate("user")

      if (!driver) {
        throw new Error("Selected driver profile not found")
      }

      const securityKey = crypto.randomInt(100000, 999999).toString()

      const pickupAddress = order.shop?.user?.defaultAddress || null
      const deliveryAddress = order.address || null

      const pickupAddressText = formatAddress(pickupAddress)
      const deliveryAddressText = formatAddress(deliveryAddress)

      const shipment = new Shipment({
        order: orderId,
        driver: driver._id,
        pickedUpAt: null,
        deliveredAt: null,
        currentLocation: null,
        securityKey,
        status: "atShop",
      })

      await shipment.save()

      await sendEmail({
        to: driver.user.email,
        subject: "New Delivery Assigned - Durra",
        html: `
        <div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
          <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">
            <h2 style="color:#000; font-size:1.5em; margin-bottom:1em;">New Delivery Assigned</h2>
            <p style="font-size:1em; line-height:1.6;">
              Greetings ${driver.user.fName || "Driver"},
            </p>
            <p style="font-size:1em; line-height:1.6;">
              A new order (<strong>#${
                order._id
              }</strong>) has been assigned to you for delivery.
            </p>

            <p style="font-size:1em; line-height:1.6;">
              <strong>Pickup From:</strong><br/>
              ${order.shop?.name || "Shop"}<br/>
              ${pickupAddressText}
            </p>

            <p style="font-size:1em; line-height:1.6; margin-bottom:1em;">
              <strong>Deliver To:</strong><br/>
              ${order.user?.fName || ""} ${order.user?.lName || ""}<br/>
              ${deliveryAddressText}
            </p>

            <p style="font-size:0.95em; line-height:1.6; margin-bottom:1.5em;">
              When you reach the customer, please ask them for their <strong>secret delivery code</strong>
              and enter it in the driver portal to confirm delivery. This code is sent only to the customer.
            </p>

            <p style="font-size:0.9em; color:#777; margin-top:2em;">
              If you have any issues accessing the delivery details, please contact Durra support.
            </p>

            <div style="margin-top:2.5em; text-align:center;">
            DURRA
            </div>
          </div>
        </div>
        `,
      })

      await sendEmail({
        to: order.user.email,
        subject: "Your Order is Ready for Delivery - Durra",
        html: `
        <div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
          <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">
            <h2 style="color:#000; font-size:1.5em; margin-bottom:1em;">Your Order is Ready</h2>

            <p style="font-size:1em; line-height:1.6;">
              Greetings ${order.user.fName || ""} ${order.user.lName || ""},
            </p>

            <p style="font-size:1em; line-height:1.6;">
              Your order (<strong>#${
                order._id
              }</strong>) is ready and a driver has been assigned to deliver it to you.
            </p>

            <p style="font-size:1em; line-height:1.6; margin-top:1.2em;">
              <strong>Delivery Address:</strong><br/>
              ${deliveryAddressText}
            </p>

            <p style="font-size:0.95em; color:#555; line-height:1.6; margin-top:1.2em;">
              Another email will be send when your order is <strong>out for delivery</strong>, including a secret delivery code
              that you must give to the driver when you receive your items.
            </p>

            <p style="font-size:0.9em; color:#777; margin-top:2em;">
              If you did not place this order or believe this is a mistake, please contact Durra support immediately.
            </p>

            <div style="margin-top:2.5em; text-align:center;">
            DURRA
            </div>
          </div>
        </div>
        `,
      })
    }

    // update customer that their order is ready for colletion
    if (
      newStatus === "pickup" &&
      order.collectionMethod === "at-shop-collection"
    ) {
      const pickupAddress = order.shop?.user?.defaultAddress || null
      const pickupAddressText = formatAddress(pickupAddress)

      await sendEmail({
        to: order.user.email,
        subject: "Your Order is Ready for Pick-up - Durra",
        html: `
        <div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
          <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">
            <h2 style="color:#000; font-size:1.5em; margin-bottom:1em;">Your Order is Ready</h2>

            <p style="font-size:1em; line-height:1.6;">
              Greetings ${order.user.fName || ""} ${order.user.lName || ""},
            </p>

            <p style="font-size:1em; line-height:1.6;">
              Your order (<strong>#${
                order._id
              }</strong>) is ready for at shop collection.
            </p>

            <p style="font-size:1em; line-height:1.6; margin-top:1.2em;">
              <strong>Pickup Address:</strong><br/>
              ${pickupAddressText}
            </p>

            <p style="font-size:0.9em; color:#777; margin-top:2em;">
              If you did not place this order or believe this is a mistake, please contact Durra support immediately.
            </p>

            <div style="margin-top:2.5em; text-align:center;">
            DURRA
            </div>
          </div>
        </div>
        `,
      })
    }

    if (newStatus === "out" && order.collectionMethod === "delivery") {
      const shipment = await Shipment.findOne({ order: orderId })

      if (!shipment) {
        return res
          .status(404)
          .json({ message: "Shipment not found for this order." })
      }

      shipment.pickedUpAt = new Date()
      shipment.status = "out-for-shipping"
      await shipment.save()

      const pickupAddress = order.shop?.user?.defaultAddress || null
      const deliveryAddress = order.address || null

      const pickupAddressText = formatAddress(pickupAddress)
      const deliveryAddressText = formatAddress(deliveryAddress)

      await sendEmail({
        to: order.user.email,
        subject: "Your Order is Out for Delivery - Durra",
        html: `
        <div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
          <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">
            <h2 style="color:#000; font-size:1.5em; margin-bottom:1em;">Your Order is Out for Delivery</h2>

            <p style="font-size:1em; line-height:1.6;">
              Greetings ${order.user.fName || ""} ${order.user.lName || ""},
            </p>

            <p style="font-size:1em; line-height:1.6;">
              Your order (<strong>#${
                order._id
              }</strong>) has been picked up by our driver and is now <strong>out for delivery</strong>.
            </p>

            <p style="font-size:1em; line-height:1.6; margin-top:1.2em;">
              <strong>From:</strong><br/>
              ${order.shop?.name || "Shop"}<br/>
              ${pickupAddressText}
            </p>

            <p style="font-size:1em; line-height:1.6; margin-top:0.8em;">
              <strong>To:</strong><br/>
              ${deliveryAddressText}
            </p>

            <p style="font-size:1em; line-height:1.6; margin-top:1.2em;">
              To protect your order, please only share the following <strong>secret code</strong> with the driver
              after you receive your items:
            </p>

            <p style="font-size:1.6em; font-weight:bold; color:#6f0101; margin:0.8em 0;">
              ${shipment.securityKey}
            </p>

            <p style="font-size:0.95em; color:#555; line-height:1.6;">
              The driver will enter this code through their portal to confirm that the delivery is complete.
              Do not share this code with anyone before the order arrives.
            </p>

            <p style="font-size:0.9em; color:#777; margin-top:2em;">
              If you experience any issues with your delivery, please contact Durra support.
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
      message: `Order status updated to '${newStatus}'.`,
      order,
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({ message: "Failed to update order status" })
  }
}

const payOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    const { paymentMethod = "Card", amount } = req.body || {}
    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (String(order.user) !== String(res.locals.payload.id)) {
      return res.status(403).json({ message: "Not allowed" })
    }

    if (order.status === "cancelled" || order.status === "pending") {
      return res
        .status(400)
        .json({ message: "You cannot pay for this order at this stage." })
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Order already paid." })
    }

    // verification
    // if (amount != null) {
    //   const jewelrySubtotal = (order.jewelryOrder || []).reduce(
    //     (sum, j) => sum + (j.totalPrice || 0),
    //     0
    //   )
    //   const serviceSubtotal = (order.serviceOrder || []).reduce(
    //     (sum, s) => sum + (s.totalPrice || 0),
    //     0
    //   )
    //   const baseSubtotal = jewelrySubtotal + serviceSubtotal

    //   const VAT_RATE = 0.1
    //   const DELIVERY_FLAT_RATE = 2
    //   const deliveryFee =
    //     order.collectionMethod === "delivery" ? DELIVERY_FLAT_RATE : 0
    //   const vatAmount = baseSubtotal * VAT_RATE
    //   const expectedTotal = baseSubtotal + vatAmount + deliveryFee

    //   const diff = Math.abs(Number(amount) - Number(expectedTotal))
    //   if (diff > 0.005) {
    //     return res.status(400).json({
    //       message: "Payment amount mismatch.",
    //       expectedTotal: expectedTotal.toFixed(3),
    //     })
    //   }
    // }

    order.paymentStatus = "Paid"
    order.paymentMethod = paymentMethod

    await order.save()

    return res.json({
      message: "Payment successful.",
      order,
    })
  } catch (err) {
    console.error("payForOrder error:", err)
    return res.status(500).json({ message: "Server error processing payment." })
  }
}

// tested
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
    const userId = res.locals.payload.id

    if (!order) {
      return res.status(404).json({ error: "Order not found." })
    }
    if (order.status !== "pending" && order.status !== "submitted") {
      return res.status(400).json({
        error: "Cannot cancel an order that has been accepted/rejected.",
      })
    }
    if (order.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to cancel this order." })
    }
    await Order.findByIdAndDelete(req.params.orderId)

    res.status(200).send({ msg: "Order successfully Cancelled" })
  } catch (error) {
    console.error("Error canceling order:", error)
    res.status(500).json({ message: "Failed to cancel order" })
  }
}

module.exports = {
  getAllOrders,
  getOrder,
  getPendingOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  payOrder,
  cancelOrder,
}
