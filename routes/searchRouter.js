const router = require("express").Router()
const searchCtrl = require("../controllers/searchController.js")

router.get("/", searchCtrl.searchAll)

module.exports = router