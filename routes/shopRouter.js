const router = require("express").Router()
const shopCtrl = require("../controllers/shopController")
const middleware = require("../middleware")
const upload = require("../middleware/multer")

router.get("/", shopCtrl.getAllShops)
router.get("/:shopId", shopCtrl.getShop)
router.get("/products/:shopId", shopCtrl.getProducts)

// can be accessed by admin or shop?
router.put(
  "/:shopId",
  middleware.stripToken,
  middleware.verifyToken,
  upload.single("image"),
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
