const router = require("express").Router()
const serviceCtrl = require("../controllers/serviceController")
const middleware = require("../middleware")
const upload = require("../middleware/multer")


router.get("/", serviceCtrl.getAllServices)
router.get(
  "/shop",
  middleware.stripToken,
  middleware.verifyToken,
  serviceCtrl.getAllServicesByShop
)
router.get("/:serviceId", serviceCtrl.getService)



router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isJeweler,
  upload.array("images", 5),
  serviceCtrl.createService
)

router.put(
  "/:serviceId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isJeweler,
  upload.array("images", 5),
  serviceCtrl.updateService
)
router.delete(
  "/:serviceId",
  middleware.stripToken,
  middleware.verifyToken,
  upload.array("images", 5),
  serviceCtrl.deleteService
)

module.exports = router
