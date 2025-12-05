// imports
const express = require("express")
require("dotenv").config()
const path = require("path")
const fs = require("fs")
const cors = require("cors")

// Initialize app
const app = express()

// Database Configuration
const mongoose = require("./config/db")

// set Port Configuration
const port = process.env.PORT ? process.env.PORT : 3000

// Require MiddleWares
const morgan = require("morgan")

const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

// use MiddleWares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))
app.use(express.static(path.join(__dirname, "public")))

app.use("/uploads", express.static(uploadsDir))

// Root Route
app.get("/", (req, res) => {
  res.send("Your app is connected . . . ")
})

// Require Routers
const authRouter = require("./routes/authRouter")
const userRouter = require("./routes/userRouter")
const requestRouter = require("./routes/requestRouter")
const shopRouter = require("./routes/shopRouter")
const jewelryRouter = require("./routes/jewelryRouter")
const serviceRouter = require("./routes/serviceRouter")
const collectionRouter = require("./routes/collectionRouter")
const orderRouter = require("./routes/orderRouter")
const addressRouter = require("./routes/addressRouter")
const reviewRouter = require("./routes/reviewRouter")
const wishlistRouter = require("./routes/wishlistRouter")
const comparsionRouter = require("./routes/comparsionRouter")
const deliveryRouter = require("./routes/deliveryRouter")
const shipmentsRouter = require("./routes/shipmentsRouter")
const searchRouter = require("./routes/searchRouter")
const pricesRouter = require("./routes/pricesRouter")
const contactRouter = require("./routes/contactRouter")

// use Routers
app.use("/auth", authRouter)
app.use("/profile", userRouter)
app.use("/requests", requestRouter)
app.use("/shops", shopRouter)
app.use("/jewelry", jewelryRouter)
app.use("/services", serviceRouter)
app.use("/collections", collectionRouter)
app.use("/orders", orderRouter)
app.use("/addresses", addressRouter)
app.use("/reviews", reviewRouter)
app.use("/wishlist", wishlistRouter)
app.use("/comparsion", comparsionRouter)
app.use("/drivers", deliveryRouter)
app.use("/shipments", shipmentsRouter)
app.use("/search", searchRouter)
app.use("/metal-prices", pricesRouter)
app.use("/contact-us", contactRouter)

// Listener
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
