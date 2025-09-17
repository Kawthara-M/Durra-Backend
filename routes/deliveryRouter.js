const router = require('express').Router()
const deliveryCtrl = require('../controllers/deliveryController')
const middleware = require('../middleware')


router.get(
  '/',
  deliveryCtrl.getAllDrivers
)

router.get(
  '/:id',
  deliveryCtrl.getDriver
)
router.post(
  '/',
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isAdmin,
  deliveryCtrl.createDriver
)


module.exports = router