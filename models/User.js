const mongoose = require("mongoose")
const Schema = mongoose.Schema

const UserSchema = mongoose.Schema(
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
    addresses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    defaultAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
    },

    passwordDigest: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Customer", "Jeweler", "Driver"],
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

module.exports = mongoose.model("User", UserSchema)
