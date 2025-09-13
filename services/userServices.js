const User = require("../models/User")
const Shop = require("../models/Shop")
const middleware = require("../middleware/index.js")
const validatePassword = require("../validators/passwordValidator.js")

async function createUser({ fName, lName, email, phone, password, role }) {
  if ((role === "Admin" || role === "Customer") && !password) {
    throw new Error("Password is required.")
  }
  if (
    (role === "Admin" || role === "Customer") &&
    !validatePassword(password)
  ) {
    throw new Error(
      "Weak Password! Have a mix of -lower & upper- case letters, digits, and unique symbols!"
    )
  }

  const existingUser = await User.findOne({ email:email })
  if (existingUser) {
    throw new Error("A user with this email exists!")
  }
  console.log("am here")

  let passwordDigest = ""
  if (password) {
    passwordDigest = await middleware.hashPassword(password)
  }

  const user = await User.create({
    fName,
    lName,
    email,
    phone,
    role,
    passwordDigest,
  })
  return user
}

async function deleteUserAccount(userId) {
  await Shop.deleteMany({ user: userId })
  // TODO: Delete related data first if needed
  await User.findByIdAndDelete(userId)
}

module.exports = {
  createUser,
  deleteUserAccount,
}
