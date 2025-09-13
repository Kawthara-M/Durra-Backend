const User = require("../models/User")
const Shop = require("../models/Shop")

// should cater to deliveryman if we decide they have access
// tested for admin, customer, and jeweler
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(res.locals.payload.id)
    
    if (!user) {
      return res.status(404).send("User not found")
    }
    
    const shop = await Shop.findOne({ user: res.locals.payload.id })

    res.status(200).json({
      user,
      shop: shop || "",
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching user profile.",
    })
  }
}

// only for user data, data related to shop or deliveryman only should be in separate controller
// tested!
const updateUserProfile = async (req, res) => {
  try {
    const { fName, lName, email, phone, address } = req.body
    const userId = res.locals.payload.id

    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ error: "Email is already taken." })
      }
    }

    const userUpdateData = {}
    if (fName) userUpdateData.fName = fName
    if (lName) userUpdateData.lName = fName
    if (email) userUpdateData.email = email
    if (phone) userUpdateData.phone = phone
    if (address) userUpdateData.address = address

    const updatedUser = await User.findByIdAndUpdate(userId, userUpdateData, {
      new: true,
    })
    if (!updatedUser) {
      return res.status(404).send("User not found!")
    }

    res.status(200).json({
      user: updatedUser,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while updating user profile.",
    })
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
}
