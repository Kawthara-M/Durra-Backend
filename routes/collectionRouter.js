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


module.exports = router