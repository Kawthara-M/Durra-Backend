const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS)
const APP_SECRET = process.env.APP_SECRET

const hashPassword = async (password) => {
  let hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  return hashedPassword
}

const comparePassword = async (password, storedPassword) => {
  let passwordMatch = await bcrypt.compare(password, storedPassword)
  return passwordMatch
}

const createToken = (payload) => {
  let token = jwt.sign(payload, APP_SECRET)
  return token
}

const stripToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    if (!authHeader) throw new Error("No auth header")

    const token = authHeader.split(" ")[1]
    if (token) {
      res.locals.token = token
      return next()
    }

    throw new Error("No token in header")
  } catch (error) {
    console.error("stripToken error:", error.message)
    res.status(401).send({ status: "Error", msg: "Unauthorized" })
  }
}

const verifyToken = (req, res, next) => {
  const { token } = res.locals
  try {
    let payload = jwt.verify(token, APP_SECRET)
    if (payload) {
      res.locals.payload = payload
      return next()
    }

    res.status(401).send({ status: "Error", msg: "Unauthorized" })
  } catch (error) {
    console.log(error)
    res.status(401).send({ status: "Error", msg: "Verify Token Error!" })
  }
}

const isAdmin = (req, res, next) => {
  const user = res.locals.payload
  if (user && user.role === "Admin") {
    return next()
  } else {
    return res.status(403).json({ error: "Access denied: Admins only." })
  }
}

const isCustomer = (req, res, next) => {
  const user = res.locals.payload
  if (user && user.role === "Customer") {
    return next()
  } else {
    return res.status(403).json({ error: "Access denied: Customers only." })
  }
}

const isJeweler = (req, res, next) => {
  const user = res.locals.payload
  if (user && user.role === "Jeweler") {
    return next()
  } else {
    return res.status(403).json({ error: "Access denied: Jewelers only." })
  }
}

const isDeliveryMan = (req, res, next) => {
  const user = res.locals.payload
  if (user && user.role === "Driver") {
    return next()
  } else {
    return res.status(403).json({ error: "Access denied: Deliverymen only." })
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  createToken,
  stripToken,
  verifyToken,
  isAdmin,
  isCustomer,
  isJeweler,
  isDeliveryMan,
}
