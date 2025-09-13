const Shop = require("../models/Shop")
const User = require("../models/User")
const Order = require("../models/Order")
const Jewelry = require("../models/Jewelry")

const getAllOrders = async (req, res) => {
  try {
    const role = res.locals.payload.id
    const userId = res.locals.payload.role
    let orders = []

    if (role === "customer") {
      orders = await Order.find({ user: userId })
        .populate("user")
        .populate("jewelryOrder.jewelry")
    } else if (role === "shop") {
      const shopJewelryIds = await Jewelry.find({ shop: userId }).distinct(
        "_id"
      )
      // distinct is used so we get only id not whole document

      orders = await Order.find({
        "jewelryOrder.jewelry": { $in: shopJewelryIds },
      })
        .populate("user")
        .populate("jewelryOrder.jewelry")
    } else if (role === "admin") {
      orders = await Order.find()
        .populate("user")
        .populate("jewelryOrder.jewelry")
    } else {
      return res.status(403).json({ message: "Access denied" })
    }

    res.status(200).json({ orders })

    // In populate we can limit the info of jewelry, but currently I am passing all until we ensure everything is right and what exactly we need
  } catch (error) {
    console.error("Error fetching all orders:", error)
    res.status(500).json({ message: "Failed to fetch orders" })
  }
}

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
    const userId = res.locals.payload.id
    const userRole = res.locals.payload.role

    if (!order) {
      return res.status(404).json({ error: "Order not found." })
    }

    if (
      (userRole !== "Admin" || userRole !== "Shop") &&
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

const createOrder = async (req, res) => {
  try {
    // create a new order
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ message: "Failed to create order" })
  }
}

const updateOrder = async (req, res) => {
  try {
    // update an order
  } catch (error) {
    console.error("Error updating order:", error)
    res.status(500).json({ message: "Failed to update order" })
  }
}

const updateOrderStatus = async (req, res) => {
  try {
    // update order status (for jeweler or deliveryman)
  } catch (error) {
    console.error("Error updating order status:", error)
    res.status(500).json({ message: "Failed to update order status" })
  }
}

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
    const userId = res.locals.payload.id

    if (!order) {
      return res.status(404).json({ error: "Order not found." })
    }
    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Cannot delete an order that has been received." })
    }
    if (order.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this order." })
    }
    await Request.findByIdAndDelete(req.params.requestId)

    res.status(200).send({ msg: "Request successfully deleted" })
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
