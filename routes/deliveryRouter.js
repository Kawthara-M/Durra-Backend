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

router.put(
  '/:driverId',
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isAdmin,
  deliveryCtrl.updateDriver
)

router.delete(
  '/:driverId',
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isAdmin,
  deliveryCtrl.deleteDriver
)


module.exports = router