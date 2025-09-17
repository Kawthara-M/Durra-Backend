const router = require("express").Router()
const addressCtrl = require("../controllers/addressController.js")
const middleware = require("../middleware")

router.get(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  addressCtrl.getAllAddresses
)

router.get(
  "/:addressId",
  middleware.stripToken,
  middleware.verifyToken,
  addressCtrl.getAddress
)
router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  addressCtrl.createAddress
)

router.put(
  "/:addressId",
  middleware.stripToken,
  middleware.verifyToken,
  addressCtrl.updateAddress
)
router.delete(
  "/:addressId",
  middleware.stripToken,
  middleware.verifyToken,
  addressCtrl.deleteAddress
)

module.exports = router
