const router = require("express").Router()
const comparsionCtrl = require("../controllers/comparsionController")
const middleware = require("../middleware")

router.get(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  comparsionCtrl.getComparsion
)

router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  comparsionCtrl.createComparsion
)
router.put(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  comparsionCtrl.updateComparsion
)

module.exports = router
