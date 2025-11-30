const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ServiceSchema = new Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
    },
    limitPerOrder: {
      type: Number,
      default: 1,
    },

    images: [
      {
        type: String,
        // required: true,
      },
    ],
    deleted: {
      type: Boolean,
      default: false, 
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Service", ServiceSchema)
