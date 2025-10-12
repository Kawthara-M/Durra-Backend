const mongoose = require("mongoose")
const Schema = mongoose.Schema

const RequestSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
      details: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Request", RequestSchema)
