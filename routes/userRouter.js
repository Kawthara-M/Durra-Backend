const router = require('express').Router()
const userCtrl = require('../controllers/userController')
const middleware = require('../middleware')


router.get(
  '/',
  middleware.stripToken,
  middleware.verifyToken,
  userCtrl.getUserProfile
)

router.put(
  '/',
  middleware.stripToken,
  middleware.verifyToken,
  userCtrl.updateUserProfile
)


module.exports = router