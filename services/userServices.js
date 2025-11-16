const User = require("../models/User")
const Address = require("../models/Address")
const middleware = require("../middleware/index.js")
const validatePassword = require("../validators/passwordValidator.js")

// createUser is a service because its' reached by auth controller and shop controller
// I should prevent admin direct signup, what if they use insomnia to signup,
async function createUser({
  fName,
  lName,
  email,
  phone,
  password,
  address,
  role,
}) {
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

  const existingUser = await User.findOne({ email: email })
  if (existingUser) {
    throw new Error("A user with this email exists!")
  }

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

module.exports = {
  createUser,
}
