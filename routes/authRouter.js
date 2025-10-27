const router = require("express").Router()
const authCtrl = require("../controllers/authController")
const middleware = require("../middleware")

router.post("/sign-up", authCtrl.SignUp)
router.post("/sign-in", authCtrl.SignIn)

router.put(
  "/update-password",
  middleware.stripToken,
  middleware.verifyToken,
  authCtrl.UpdatePassword
)

// reached by new shops trying to set their password for first time
router.post("/set-password", authCtrl.setPassword)

router.post(
  "/forgetPassword",
  authCtrl.forgetPassword
)
router.post(
  "/forget-password",
  middleware.stripToken,
  middleware.verifyToken,
  authCtrl.forgetPassword
)

router.delete(
  "/:userId",
  middleware.stripToken,
  middleware.verifyToken,
  middleware.isCustomer,
  authCtrl.deleteAccount
)

router.get(
  "/session",
  middleware.stripToken,
  middleware.verifyToken,
  authCtrl.CheckSession
)
module.exports = router
