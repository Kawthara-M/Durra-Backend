const router = require("express").Router()
const collectionCtrl = require("../controllers/collectionController")
const middleware = require("../middleware")
const upload = require("../middleware/multer")

router.get("/", collectionCtrl.getAllCollections)

router.get("/shop", collectionCtrl.getCollectionForJeweler)

router.get(
  "/:collectionId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isJeweler,
  collectionCtrl.getCollection
)

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
