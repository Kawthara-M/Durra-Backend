const crypto = require("crypto")
const User = require("../models/User")
const middleware = require("../middleware/index.js")
const validatePassword = require("../validators/passwordValidator.js")
const { createUser } = require("../services/userServices.js")
const { deleteUserAccount } = require("../services/userServices.js")
const { sendEmail } = require("../services/emailService")
const { findByIdAndDelete } = require("../models/Shop.js")

// tested: I created an admin user, a jeweler user, and a customer user
const SignUp = async (req, res) => {
  try {
    const { fName, lName, email, phone, password, confirmPassword, role } =
      req.body

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords must match!" })
    }

    const user = await createUser({
      fName,
      lName,
      email,
      phone,
      password,
      role,
    })

    // await sendEmail({
    //   to: email,
    //   subject: "Welcome to Durra!",
    //   text: `Greetings ${fName},\n\nWelcome to Durra! Your account has been successfully created and approved.\n\nYou can now log in and start using our services.\n\n- Durra Team`,
    // })

    return res.status(201).json({
      message: "Signup successful!",
      userId: user._id,
    })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

// tested for Admin, Jeweler, and Customer
const SignIn = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (user) {
      let matched = await middleware.comparePassword(
        password,
        user.passwordDigest
      )
      if (matched) {
        let payload = {
          id: user._id,
          email: user.email,
          role: user.role,
        }
        let token = middleware.createToken(payload)
        return res.send({ user: payload, token })
      } else {
        return res
          .status(401)
          .send({ status: "Error", msg: "Invalid Credentials" })
      }
    } else {
      res.status(401).send({ status: "Error", msg: "Invalid Credentials" })
    }
  } catch (error) {
    console.log(error)
    res.status(401).send({ status: "Error", msg: "Invalid Credentials!" })
  }
}

// tested: deleted customer account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.params.userId
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).send("User not found!")
    }
    if (res.locals.payload.id != userId) {
      return res.status(403).json({ message: "Unauthorized action." })
    }
    if (user && user.role === "Customer") {
      await User.findByIdAndDelete(userId)
    }
    await sendEmail({
      to: user.email,
      subject: "Account Deleted!",
      text: `Greetings ${user.fName},\n\n Your account has been successfully deleted.\n\n- Durra Team`,
    })

    res.status(200).send({ msg: "Account successfully deleted" })
  } catch (error) {
    console.error(error)
    res.status(500).send({ msg: "Failed to delete account" })
  }
}

// tested!
const UpdatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    let user = await User.findById(res.locals.payload.id)

    if (user) {
      let matched = await middleware.comparePassword(
        oldPassword,
        user.passwordDigest
      )
      if (matched) {
        if (!validatePassword(newPassword)) {
          return res.status(400).json({
            error:
              "Weak Password! Have a mix of capital and lower letters, digits, and unique symbols!",
          })
        }

        let passwordDigest = await middleware.hashPassword(newPassword)
        user = await User.findByIdAndUpdate(res.locals.payload.id, {
          passwordDigest,
        })

        let payload = {
          id: user.id,
          email: user.email,
          role: user.role,
        }
        return res
          .status(200)
          .send({ status: "Password Updated!", user: payload })
      } else {
        res.status(401).send({ status: "Error", msg: "Invalid old password!" })
      }
    } else {
      return res.status(404).send("User not found!")
    }
  } catch (error) {
    console.log(error)
    res.status(401).send({
      status: "Error",
      msg: "An error has occurred updating password!",
    })
  }
}

// tested
const setPassword = async (req, res) => {
  try {
    const { token } = req.query
    const { newPassword, confirmPassword } = req.body

    if (!token) {
      return res.status(400).json({ error: "Token is required" })
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" })
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" })
    }

    if (!validatePassword(newPassword)) {
      throw new Error(
        "Weak Password! Have a mix of -lower & upper- case letters, digits, and unique symbols!"
      )
    }

    const passwordDigest = await middleware.hashPassword(newPassword)

    user.passwordDigest = passwordDigest
    user.passwordResetToken = null
    user.passwordResetExpires = null

    await user.save()

    res
      .status(200)
      .json({ message: "Password set successfully! You can now log in." })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error setting password" })
  }
}

const CheckSession = async (req, res) => {
  const { payload } = res.locals
  res.status(200).send(payload)
}

module.exports = {
  SignUp,
  SignIn,
  CheckSession,
  deleteAccount,
  UpdatePassword,
  setPassword,
}
