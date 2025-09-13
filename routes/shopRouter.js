const router = require('express').Router()
const shopCtrl = require('../controllers/shopController')
const middleware = require('../middleware')


router.get(
  '/',
  shopCtrl.getAllShops
)

router.get(
  '/:shopId',
  shopCtrl.getShop
)
router.post(
  '/',
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isAdmin,
  shopCtrl.createShop
)


module.exports = router