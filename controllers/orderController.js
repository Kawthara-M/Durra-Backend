const Shop = require("../models/Shop")
const User = require("../models/User")
const Order = require("../models/Order")
const Jewelry = require("../models/Jewelry")
const Service = require("../models/Service")
const Shipment = require("../models/Shipment")
const Driver = require("../models/Driver")

// tested while logged in as jeweler, test again I added service
const getAllOrders = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const role = res.locals.payload.role
    let orders = []

    if (role === "Customer") {
      orders = await Order.find({ user: userId })
        .populate("user")
        .populate("jewelryOrder")
        .populate("serviceOrder")
        .populate("shop")
    } else if (role === "Jeweler") {
      orders = await Order.find({ shop: userId })
        .populate("user")
        .populate("jewelryOrder")
        .populate("serviceOrder")
    } else if (role === "Admin") {
      orders = await Order.find()
        .populate("user")
        .populate("jewelryOrder")
        .populate("serviceOrder")
        .populate("shop")
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

// tested, test again I added service
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
    const userId = res.locals.payload.id
    const userRole = res.locals.payload.role

    if (!order) {
      return res.status(404).json({ error: "Order not found." })
    }

    if (
      userRole !== "Admin" &&
      userRole !== "Jeweler" &&
      order.user.toString() !== userId
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

// teested, and somehow works, test again after service thing
const createOrder = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const {
      jewelryOrder = [],
      serviceOrder = [],
      totalPrice,
      collectionMethod,
      address,
    } = req.body

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
      const jewelryId = jewelryOrder[0].jewelry
      const jewelryItem = await Jewelry.findById(jewelryId)

      if (!jewelryItem) {
        return res.status(400).json({ message: "Jewelry item not found." })
      }

      shopId = jewelryItem.shop

      if (jewelryOrder[0].totalPrice !== totalPrice) {
        return res
          .status(400)
          .json({ message: "Total price mismatch for jewelry order." })
      }
    } else if (serviceOrder.length > 0) {
      const serviceId = serviceOrder[0].service
      const serviceItem = await Service.findById(serviceId)

      if (!serviceItem) {
        return res.status(400).json({ message: "Service item not found." })
      }

      shopId = serviceItem.shop

      if (serviceOrder[0].totalPrice !== totalPrice) {
        return res
          .status(400)
          .json({ message: "Total price mismatch for service order." })
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

// tested by increasing quantity of same jewelry, adding other jewelry, test again after adding services
const updateOrder = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const { orderId } = req.params
    const {
      jewelryOrder: updatedItemsFromClient,
      serviceOrder: updatedServicesFromClient,
    } = req.body

    if (
      (!updatedItemsFromClient || !Array.isArray(updatedItemsFromClient)) &&
      (!updatedServicesFromClient || !Array.isArray(updatedServicesFromClient))
    ) {
      return res.status(400).json({ message: "No valid order data provided." })
    }

    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: "Order not found." })
    }

    if (order.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this order." })
    }

    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending orders can be updated." })
    }

    let updatedItems = [...order.jewelryOrder]

    for (const updatedItem of updatedItemsFromClient) {
      const { jewelry, quantity, totalPrice, notes } = updatedItem

      if (!jewelry || quantity === undefined || totalPrice === undefined) {
        return res.status(400).json({
          message:
            "Each jewelry item must include jewelry ID, quantity, and totalPrice.",
        })
      }

      const jewelryDoc = await Jewelry.findById(jewelry)
      if (!jewelryDoc) {
        return res
          .status(400)
          .json({ message: `Jewelry item not found: ${jewelry}` })
      }

      if (jewelryDoc.shop.toString() !== order.shop.toString()) {
        return res.status(400).json({
          message:
            "Jewelry item does not belong to the same shop as the order.",
        })
      }

      // this jewelry already exist in order?
      const existingIndex = updatedItems.findIndex(
        (item) => item.jewelry.toString() === jewelry
      )

      if (existingIndex !== -1) {
        if (quantity === 0) {
          updatedItems.splice(existingIndex, 1)
        } else {
          updatedItems[existingIndex].quantity = quantity
          updatedItems[existingIndex].totalPrice = totalPrice
          if (notes !== undefined) {
            updatedItems[existingIndex].notes = notes
          }
        }
      } else {
        if (quantity > 0) {
          updatedItems.push({
            jewelry,
            quantity,
            totalPrice,
            status: "not-ready",
            notes: notes || "",
          })
        }
      }
    }

    let updatedServices = []

    if (Array.isArray(updatedServicesFromClient)) {
      for (const serviceItem of updatedServicesFromClient) {
        const { _id, service, jewelry, images, totalPrice, notes } = serviceItem

        if (
          !service ||
          !Array.isArray(jewelry) ||
          jewelry.length === 0 ||
          totalPrice === undefined
        ) {
          return res.status(400).json({
            message:
              "Each service must include service ID, at least one jewelry item, and totalPrice.",
          })
        }

        const parsedJewelry = []

        for (const j of jewelry) {
          if (j.platformJewelry) {
            const pj = await Jewelry.findById(j.platformJewelry)
            if (!pj) {
              return res.status(400).json({
                message: `Platform jewelry not found: ${j.platformJewelry}`,
              })
            }

            parsedJewelry.push({ platformJewelry: j.platformJewelry })
          } else if (j.ownedJewelry) {
            if (!images || !Array.isArray(images) || images.length === 0) {
              return res.status(400).json({
                message: "Images are required for owned jewelry.",
              })
            }
            parsedJewelry.push({ ownedJewelry: j.ownedJewelry })
          } else {
            return res.status(400).json({
              message:
                "Each jewelry item must be either platformJewelry or ownedJewelry.",
            })
          }
        }


        let status = "not-ready"
        if (_id) {
          const existingService = order.serviceOrder.find(
            (s) => s._id.toString() === _id
          )
          if (existingService) {
            status = existingService.status || "not-ready"
          }
        }

        updatedServices.push({
          _id,
          service,
          jewelry: parsedJewelry,
          images: images || [],
          totalPrice,
          status,
          notes: notes || "",
        })
      }
    }

    order.serviceOrder = updatedServices

    const totalJewelryPrice = updatedItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    )
    const totalServicePrice = updatedServices.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    )

    order.jewelryOrder = updatedItems
    order.serviceOrder = updatedServices
    order.totalPrice = totalJewelryPrice + totalServicePrice

    await order.save()

    res.status(200).json({
      message: "Order updated successfully.",
      order,
    })
  } catch (error) {
    console.error("Error updating order:", error)
    res.status(500).json({ message: "Failed to update order" })
  }
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
      },
      Jeweler: {
        submitted: ["accepted", "rejected"],
        accepted: ["processing"],
        processing: ["pickup"],
      },
      Driver: {
        pickup: ["delivered"],
      },
    }

    // to get the allowed status transitions based on the user role and current status of the order
    const allowedTransitions = statusTransitions[role]?.[currentStatus] || []

    if (!allowedTransitions.includes(newStatus)) {
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

    // not tested
    if (newStatus === "pickup" && order.collectionMethod === "delivery") {
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

    res.status(200).json({
      message: `Order status updated to '${newStatus}'.`,
      order,
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({ message: "Failed to update order status" })
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
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
}
