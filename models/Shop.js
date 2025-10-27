const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ShopSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {  
      type: String,
      default: "",
    },
    cr: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Shop", ShopSchema)
