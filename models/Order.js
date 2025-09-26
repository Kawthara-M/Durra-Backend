const mongoose = require("mongoose")
const Schema = mongoose.Schema

const OrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    serviceOrder: [
      {
        service: {
          type: Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        jewelry: [
          {
            platformJewelry: {
              type: Schema.Types.ObjectId,
              ref: "Jewelry",
            },
            ownedJewelry: {
              type: Schema.Types.Mixed,
            },
          },
        ],
        images: { type: [String], default: [] },
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
      type: String,
      enum: ["delivery", "at-shop-collection"],
      default: "delivery",
    },
    status: {
      type: String,
      enum: [
        "pending", // while in cart
        "submitted", // customer clicked submit order
        "accepted", // shop accepted order
        "rejected", // shop rejected order
        "processing", // shop is working on order
        "pickup", // ready for pickup by driver or customer
        "delivered", // received by customer
        "cancelled", // customer cancelled before shop decides
      ], // ensure they are correct
      default: "pending",
    },
    address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      // required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Order", OrderSchema)
