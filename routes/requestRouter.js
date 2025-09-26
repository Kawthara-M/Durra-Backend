const router = require("express").Router()
const requestCtrl = require("../controllers/requestController")
const middleware = require("../middleware")
const upload = require("../middleware/multer")

router.get(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isAdmin,
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
  middleware.isAdmin,
  requestCtrl.getRequest
)

router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  requestCtrl.createRequest
)

router.put(
  "/:requestId",
  middleware.stripToken,
  middleware.verifyToken,
  requestCtrl.updateRequest
)

module.exports = router
