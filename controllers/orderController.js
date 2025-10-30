const Shop = require("../models/Shop")
const User = require("../models/User")
const Order = require("../models/Order")
const Jewelry = require("../models/Jewelry")
const Collection = require("../models/Collection")
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
        .populate({
          path: "jewelryOrder.item",
        })
        .populate({
          path: "serviceOrder",
          populate: {
            path: "service",
          },
        })
        .populate("shop")
    } else if (role === "Jeweler") {
      const shop = await Shop.findOne({ user: userId })
      if (!shop) {
        return res.status(404).json({ error: "Shop not found." })
      }

      // to ensure jewelers dont see orders in pending and cancelled states
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
      .populate("user")
      .populate({
        path: "jewelryOrder.item",
      })

      .populate({
        path: "serviceOrder",
        populate: {
          path: "service",
        },
      })

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

// tested: using insomnia
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
    const {
      jewelryOrder: updatedItemsFromClient = [],
      serviceOrder: updatedServicesFromClient = [],
    } = req.body
    
    if (
      (!Array.isArray(updatedItemsFromClient) ||
      updatedItemsFromClient.length === 0) &&
      (!Array.isArray(updatedServicesFromClient) ||
      updatedServicesFromClient.length === 0)
    ) {
      return res.status(400).json({ message: "No valid order data provided." })
    }
    
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: "Order not found." })
      
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
      const { item, itemModel, quantity, totalPrice, notes } = updatedItem

      if (
        !item ||
        !itemModel ||
        quantity === undefined ||
        totalPrice === undefined
      ) {
        return res.status(400).json({
          message:
            "Each item must include item ID, itemModel, quantity, and totalPrice.",
        })
      }

      let itemDoc

      if (itemModel === "Jewelry") {
        itemDoc = await Jewelry.findById(item)
        if (!itemDoc) {
          return res
            .status(400)
            .json({ message: `Jewelry item not found: ${item}` })
        }

        if (quantity > itemDoc.limitPerOrder) {
          return res.status(400).json({
            message: `Quantity for jewelry '${itemDoc.name}' exceeds limit (${itemDoc.limitPerOrder}).`,
          })
        }
      }

      if (itemModel === "Collection") {
        itemDoc = await Collection.findById(item)
        if (!itemDoc) {
          return res
            .status(400)
            .json({ message: `Collection not found: ${item}` })
        }

        if (quantity > itemDoc.limitPerOrder) {
          return res.status(400).json({
            message: `Quantity for collection '${itemDoc.name}' exceeds limit (${itemDoc.limitPerOrder}).`,
          })
        }
      }

      if (itemDoc.shop.toString() !== order.shop.toString()) {
        return res.status(400).json({
          message: "Item does not belong to the same shop as the order.",
        })
      }

      const existingIndex = updatedItems.findIndex(
        (i) => i.item.toString() === item && i.itemModel === itemModel
      )

      if (existingIndex !== -1) {
        if (quantity === 0) {
          updatedItems.splice(existingIndex, 1)
        } else {
          updatedItems[existingIndex].quantity = quantity
          updatedItems[existingIndex].totalPrice = totalPrice
          updatedItems[existingIndex].notes = notes || ""
        }
      } else if (quantity > 0) {
        updatedItems.push({
          item,
          itemModel,
          quantity,
          totalPrice,
          notes: notes || "",
        })
      }
    }

    let updatedServices = []

    for (const serviceItem of updatedServicesFromClient) {
      const { _id, service, jewelry, totalPrice, notes } = serviceItem

      if (
        !service ||
        !Array.isArray(jewelry) ||
        jewelry.length === 0 ||
        totalPrice === undefined
      ) {
        return res.status(400).json({
          message:
            "Each service must include service ID, jewelry items, and totalPrice.",
        })
      }

      const serviceDoc = await Service.findById(service)
      if (!serviceDoc) {
        return res
          .status(400)
          .json({ message: `Service not found: ${service}` })
      }


      if (jewelry.length > serviceDoc.limitPerOrder) {
        return res.status(400).json({
          message: `Too many jewelry items for service '${serviceDoc.name}'. Limit is ${serviceDoc.limitPerOrder}.`,
        })
      }


      updatedServices.push({
        _id,
        service,
        jewelry,
        totalPrice,
        notes: notes || "",
      })
    }
    
    
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

    const populatedOrder = await Order.findById(order._id)
      .populate("user")
      .populate({
        path: "jewelryOrder.item",
      })
      .populate({
        path: "serviceOrder.service",
      })
      .populate("shop")

    res.status(200).json({
      message: "Order updated successfully.",
      order: populatedOrder,
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
