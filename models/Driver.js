const mongoose = require("mongoose")
const Schema = mongoose.Schema

const DriverSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    licenseNo: {
      type: String,
      required: true,
    },
    vehiclePlateNumber: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Driver", DriverSchema)
