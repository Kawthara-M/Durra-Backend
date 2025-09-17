// imports
const express = require("express")
require("dotenv").config()
const path = require("path")
const fs = require("fs")

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
const collectionRouter = require("./routes/collectionRouter")
const orderRouter = require("./routes/orderRouter")
const addressRouter = require("./routes/addressRouter")
// const deliveryRouter = require("./routes/deliveryRouter")

// use Routers
app.use("/auth", authRouter)
app.use("/profile", userRouter)
app.use("/requests", requestRouter)
app.use("/shops", shopRouter)
app.use("/jewelry", jewelryRouter)
app.use("/collections", collectionRouter)
app.use("/orders", orderRouter)
app.use("/addresses", addressRouter)
// app.use("drivers", deliveryRouter)

// Listener
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
