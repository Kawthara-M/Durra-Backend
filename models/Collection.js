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
    originPrice: {
      type: Number,
      // required: true
    },
    images: [{ type: String }],
    limitPerOrder: {
      type: Number,
      required: true,
    },

    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Collection", CollectionSchema)
