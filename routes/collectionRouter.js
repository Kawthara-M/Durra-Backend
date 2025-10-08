const router = require("express").Router()
const collectionCtrl = require("../controllers/collectionController")
const middleware = require("../middleware")
const upload = require("../middleware/multer")

router.get("/", collectionCtrl.getAllCollections)

router.get("/:collectionId", collectionCtrl.getCollection)

router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isJeweler,
  upload.array("images", 5),
  collectionCtrl.createCollection
)
router.put(
  "/:collectionId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isJeweler,
  upload.array("images", 5),
  collectionCtrl.updateCollection
)
router.delete(
  "/:collectionId",
  middleware.stripToken,
  middleware.verifyToken,
  collectionCtrl.deleteCollection
)

module.exports = router
