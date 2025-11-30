const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ReviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedItem: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "reviewedItemType", // dynamic reference
    },
    reviewedItemType: {
      type: String,
      required: true,
      enum: ["Service", "Jewelry", "Collection"], // should we add collection?
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Review", ReviewSchema)
