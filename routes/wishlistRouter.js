const router = require("express").Router()
const wishlistRouter = require("../controllers/wishlistController")
const middleware = require("../middleware")

router.get(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  wishlistRouter.getWishlist
)

router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  wishlistRouter.createWishlist
)
router.put(
  "/:wishlistId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  wishlistRouter.updateWishlist
)

module.exports = router
