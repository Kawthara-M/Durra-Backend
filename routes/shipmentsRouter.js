const router = require("express").Router()
const shipmentsCtrl = require("../controllers/shipmentsController")
const middleware = require("../middleware")

router.get(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isDeliveryMan,
  shipmentsCtrl.getShipments
)

router.get("/:id", shipmentsCtrl.getShipment)

router.put(
  "/:id",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isDeliveryMan,
  shipmentsCtrl.updateShipment
)

module.exports = router
