const multer = require("multer")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/") 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const originalExt = file.originalname.split(".").pop()
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + originalExt)
  },
})

const upload = multer({ storage: storage })

module.exports = upload
