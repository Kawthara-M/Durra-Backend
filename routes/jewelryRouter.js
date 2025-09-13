const router = require('express').Router()
const jewelryCtrl = require('../controllers/jewelryController')
const middleware = require('../middleware')


router.get(
  '/',
  jewelryCtrl.getAllJewelry
)

router.get(
  '/:jewelryId',
  jewelryCtrl.getJewelry
)


module.exports = router