const router = require("express").Router()
const pricesCtrl = require("../controllers/pricesController.js")

router.get("/", pricesCtrl.getPrices)


module.exports = router
