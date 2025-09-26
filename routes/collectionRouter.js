const router = require('express').Router()
const collectionCtrl = require('../controllers/collectionController')
const middleware = require('../middleware')


router.get(
  '/',
  collectionCtrl.getAllCollections
)

router.get(
  '/:collectionId',
  collectionCtrl.getCollection
)

router.post('/',
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isJeweler,
  collectionCtrl.createCollection
)
router.put('/:collectionId',
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isJeweler,
  collectionCtrl.updateCollection
)
router.delete('/:collectionId',
  middleware.stripToken,
  middleware.verifyToken,
  collectionCtrl.deleteCollection
)


module.exports = router