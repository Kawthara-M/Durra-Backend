const User = require("../models/User")
const Driver = require("../models/Driver")
const Shop = require("../models/Shop")

// tested for admin, customer, and jeweler
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(res.locals.payload.id)

    if (!user) {
      return res.status(404).send("User not found")
    }

    const shop = await Shop.findOne({ user: res.locals.payload.id })
    const driver = await Driver.findOne({ user: res.locals.payload.id })

    res.status(200).json({
      user,
      shop: shop || "",
      driver: driver || "",
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching user profile.",
    })
  }
}

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().lean() 
    if (!users.length) {
      return res.status(200).json({ users: [] })
    }

    const userIds = users.map((u) => u._id)

    const shops = await Shop.find({ user: { $in: userIds } })
      .select("_id user name")
      .lean()

    const drivers = await Driver.find({ user: { $in: userIds } })
      .select("_id user licenseNo vehiclePlateNumber")
      .lean()

    const shopByUserId = {}
    shops.forEach((s) => {
      shopByUserId[s.user.toString()] = s
    })

    const driverByUserId = {}
    drivers.forEach((d) => {
      driverByUserId[d.user.toString()] = d
    })

    const usersWithRelations = users.map((u) => {
      const id = u._id.toString()
      return {
        ...u,
        shop: shopByUserId[id] || null,
        driver: driverByUserId[id] || null,
      }
    })

    res.status(200).json({
      users: usersWithRelations,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return res.status(500).json({
      error: "Failure encountered while fetching users.",
    })
  }
}

// tested! test again
const updateUserProfile = async (req, res) => {
  try {
    const { fName, lName, email, phone } = req.body
    const userId = res.locals.payload.id

    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ error: "Email is already taken." })
      }
    }

    const updateFields = {}
    if (fName) updateFields.fName = fName
    if (lName) updateFields.lName = lName
    if (email) updateFields.email = email
    if (phone) updateFields.phone = phone

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    )

    return res.status(200).json({ user: updatedUser })
  } catch (error) {
    console.error("Update error:", error)
    return res.status(500).json({
      error: "Failure encountered while updating user profile.",
    })
  }
}

module.exports = {
  getUserProfile,
  getAllUsers,
  updateUserProfile,
}
