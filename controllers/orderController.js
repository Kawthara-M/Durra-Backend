const Shop = require("../models/Shop")
const User = require("../models/User")
const Order = require("../models/Order")
const Jewelry = require("../models/Jewelry")
const Collection = require("../models/Collection")
const Service = require("../models/Service")
const Shipment = require("../models/Shipment")
const Driver = require("../models/Driver")

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
    console.log(order.user)
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
const updateOrder = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const { orderId } = req.params

    console.log(req.body)

    const hasJewelryOrder = req.body.hasOwnProperty("jewelryOrder")
    const hasServiceOrder = req.body.hasOwnProperty("serviceOrder")

    const updatedJewelryFromClient = req.body.jewelryOrder || []
    const updatedServicesFromClient = req.body.serviceOrder || []
    const { notes, shop } = req.body

    if (!hasJewelryOrder && !hasServiceOrder) {
      console.log("hh")
      return res.status(400).json({ message: "No valid order data provided." })
    }

    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: "Order not found." })

    if (order.user.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized." })
    // if (order.status !== "pending" && order.status !== "accepted")
    //   return res
    //     .status(400)
    //     .json({ message: "Only pending orders can be updated." })
    if (hasJewelryOrder) {
      const newJewelryOrder = []

      for (const entry of updatedJewelryFromClient) {
        const { item, itemModel, quantity, totalPrice, size } = entry

        if (!itemModel) continue
        if (!quantity || quantity <= 0) continue

        let doc
        if (itemModel === "Jewelry") doc = await Jewelry.findById(item)
        if (itemModel === "Collection") doc = await Collection.findById(item)
        if (!doc)
          return res
            .status(404)
            .json({ message: `${itemModel} not found: ${item}` })

        if (quantity > doc.limitPerOrder)
          return res.status(400).json({
            message: `Quantity exceeds limit for '${doc.name}'.`,
          })

        newJewelryOrder.push({
          item,
          itemModel,
          quantity,
          totalPrice,
          ...(size ? { size } : {}),
        })
      }

      order.jewelryOrder = newJewelryOrder
    }

    if (hasServiceOrder) {
      const newServiceOrder = []

      for (const s of updatedServicesFromClient) {
        const { _id, service, jewelry = [], totalPrice } = s

        const serviceDoc = await Service.findById(service)
        if (!serviceDoc)
          return res
            .status(404)
            .json({ message: `Service not found: ${service}` })

        if (jewelry.length > serviceDoc.limitPerOrder)
          return res.status(400).json({
            message: `Too many jewelry items for service '${serviceDoc.name}'. Limit ${serviceDoc.limitPerOrder}.`,
          })

        const jewelryObjects = jewelry.map((j) => ({
          name: j.name || "",
          material: j.material || "",
          type: j.type || "",
          details: j.details || "",
        }))

        newServiceOrder.push({
          _id,
          service,
          jewelry: jewelryObjects,
          totalPrice,
        })
      }

      order.serviceOrder = newServiceOrder
    }

    if (shop) {
      order.shop = shop
    }
    const finalJewelry = order.jewelryOrder
    const finalServices = order.serviceOrder

    order.totalPrice =
      finalJewelry.reduce((sum, i) => sum + (i.totalPrice || 0), 0) +
      finalServices.reduce((sum, s) => sum + (s.totalPrice || 0), 0)

    if (notes !== undefined) order.notes = notes

    await order.save()

    const populatedOrder = await Order.findById(order._id).populate(
      orderPopulateConfig
    )

    res.status(200).json({
      message: "Order updated successfully",
      order: populatedOrder,
    })
  } catch (error) {
    console.error("Error updating order:", error)
    res.status(500).json({ message: "Failed to update order" })
  }
}

// not tested yet
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

// tested until processing
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params

    // we name it newStatus because we refer to status in code, so this is to distinguish between current and new status
    const { status: newStatus } = req.body
    const userId = res.locals.payload.id
    const role = res.locals.payload.role

    if (!newStatus) {
      return res.status(400).json({ message: "New status is required." })
    }

    const order = await Order.findById(orderId)
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

    // to get the allowed status transitions based on the user role and current status of the order
    const allowedTransitions = statusTransitions[role]?.[currentStatus] || []

    if (!allowedTransitions.includes(newStatus)) {
      console.log(newStatus)
      return res.status(403).json({
        message: `${role} cannot change order from '${currentStatus}' to '${newStatus}'`,
      })
    }

    if (role === "Customer") {
      if (order.user.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this order." })
      }
    } else if (role === "Jeweler") {
      const shop = await Shop.findOne({ user: res.locals.payload.id })
      if (order.shop.toString() !== shop._id.toString()) {
        console.log("issue here")
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
    order.status = newStatus

    await order.save()

    if (newStatus === "submitted") {
      startJewelerTimeout(orderId, 2)
    }

    // not tested
    if (newStatus === "ready" && order.collectionMethod === "delivery") {
      const drivers = await User.find({ role: "driver" })
      if (drivers.length === 0) {
        throw new Error("No delivery men available")
      }

      const randomIndex = Math.floor(Math.random() * drivers.length)
      const assignedDriver = drivers[randomIndex]
      const driver = await Driver.findOne({
        user: assignedDriver._id,
      }).populate("user")

      const shipment = new Shipment({
        order: orderId,
        driver: driver._id,
        pickedUpAt: null,
        deliveredAt: null,
        currentLocation: null,
        status: "atShop",
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
      shipment.status = "shipped"
      await shipment.save()
    }

    res.status(200).json({
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
