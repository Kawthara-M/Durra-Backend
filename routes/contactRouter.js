const router = require("express").Router()
const contactCtrlCtrl = require("../controllers/contactController.js")
const middleware = require("../middleware")

router.post(
  "/",
  middleware.stripToken,
  middleware.verifyToken,
  contactCtrlCtrl.sendContactMessage
)

module.exports = router
