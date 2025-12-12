const router = require("express").Router()
const requestCtrl = require("../controllers/requestController")
const middleware = require("../middleware")

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

// not protected because jeweler still doesn't have account
router.post(
  "/",
  requestCtrl.createRequest
)

router.put(
  "/:requestId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isAdmin,
  requestCtrl.updateRequest
)

module.exports = router
