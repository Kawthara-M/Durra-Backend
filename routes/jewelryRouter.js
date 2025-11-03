const router = require("express").Router()
const jewelryCtrl = require("../controllers/jewelryController")
const middleware = require("../middleware")
const upload = require("../middleware/multer")

router.get(
  "/",
  jewelryCtrl.getAllJewelry
)

router.get("/:jewelryId", jewelryCtrl.getJewelry)
router.get("/shop/:shopId", jewelryCtrl.getJewelryByShop)

router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isJeweler,
  upload.array("images", 5),
  jewelryCtrl.createJewelry
)
router.put(
  "/:jewelryId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isJeweler,
  upload.array("images", 5),
  jewelryCtrl.updateJewelry
)
router.delete(
  "/:jewelryId",
  middleware.stripToken,
  middleware.verifyToken,
  jewelryCtrl.deleteJewelry
)

module.exports = router
