const router = require("express").Router()
const orderCtrl = require("../controllers/orderController.js")
const middleware = require("../middleware")

router.get(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  orderCtrl.getAllOrders
)
router.get(
  "/pending",
  middleware.stripToken,
  middleware.verifyToken,
  orderCtrl.getPendingOrder
)

router.get(
  "/:orderId",
  middleware.stripToken,
  middleware.verifyToken,
  orderCtrl.getOrder
)
router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  orderCtrl.createOrder
)

router.put(
  "/:orderId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  orderCtrl.updateOrder
)

router.put(
  "/:orderId/pay",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  orderCtrl.payOrder
)

// for jewelers and deliverymen
router.put(
  "/update-status/:orderId",
  middleware.stripToken,
  middleware.verifyToken,
  orderCtrl.updateOrderStatus
)

router.delete(
  "/:orderId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  orderCtrl.cancelOrder
)

module.exports = router
