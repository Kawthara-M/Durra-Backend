const mongoose = require("mongoose")
const Schema = mongoose.Schema

const OrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // serviceOrderId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "",
    //   required: true,
    // },
    // resellingOrderId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "",
    //   required: true,
    // },
    jewelryOrder: [
      {
        jewelry: {
          type: Schema.Types.ObjectId,
          ref: "Jewelry",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["ready", "not-ready"],
          default: "not-ready",
        },
        notes: {
          type: String,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    collectionMethod: {
      type: Number,
      enum: ["delivery", "at-shop-collection"],
      default: "delivery",
    },
    status: {
      type: String,
      enum: ["pending","received", "processing", "shipped", "delivered", "cancelled"],
      default: "received",
    },
    /* deliveryMan: {
      
    } */
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Order", OrderSchema)
