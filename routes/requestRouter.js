const router = require("express").Router()
const requestCtrl = require("../controllers/requestController")
const middleware = require("../middleware")
const upload = require("../middleware/multer")

router.get(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  requestCtrl.getAllRequests
)
router.get(
  "/shop/:shopId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isAdmin,
  requestCtrl.getAllRequestsByShop
)

router.get(
  "/:requestId",
  middleware.stripToken,
  middleware.verifyToken,
  requestCtrl.getRequest
)

router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  upload.array("image", 5),
  requestCtrl.createRequest
)

router.put(
  "/:requestId",
  middleware.stripToken,
  middleware.verifyToken,
  requestCtrl.updateRequest
)

router.delete(
  "/:requestId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isJeweler,
  requestCtrl.deleteRequest
)

module.exports = router
