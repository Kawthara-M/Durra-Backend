const router = require("express").Router()
const reviewRouter = require("../controllers/reviewController")
const middleware = require("../middleware")

router.get(
  "/:reviewedItemType/:reviewedItemId",
  middleware.stripToken,
  middleware.verifyToken,
  reviewRouter.getReviews
)
router.get(
  "/can-review/:type/:id",
  middleware.stripToken,
  middleware.verifyToken,
  reviewRouter.canUserReview
)

router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  reviewRouter.createReview
)
router.put(
  "/:reviewId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  reviewRouter.updateReview
)
router.delete(
  "/:reviewId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  reviewRouter.deleteReview
)

module.exports = router
