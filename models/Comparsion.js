const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ComparsionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    jewelry: [
      {
        type: Schema.Types.ObjectId,
        ref: "Jewelry",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Comparsion", ComparsionSchema)
