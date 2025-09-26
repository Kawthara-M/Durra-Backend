const router = require("express").Router()
const shopCtrl = require("../controllers/shopController")
const middleware = require("../middleware")

router.get("/", shopCtrl.getAllShops)

router.get("/:shopId", shopCtrl.getShop)

// can be accessed by admin or shop
router.put(
  "/:shopId",
  middleware.stripToken,
  middleware.verifyToken,
  shopCtrl.updateShop
)
router.delete(
  "/:shopId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isAdmin,
  shopCtrl.deleteShop
)

module.exports = router
