const mongoose = require("mongoose")

const userSchema = mongoose.Schema(
  {
    fName: {
      type: String,
      default: "",
    },
    lName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    passwordDigest: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Customer", "Jeweler", "DeliveryMan"],
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("User", userSchema)
