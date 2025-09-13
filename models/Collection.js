const mongoose = require("mongoose")
const Schema = mongoose.Schema

const CollectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
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

module.exports = mongoose.model("Collection", CollectionSchema)
