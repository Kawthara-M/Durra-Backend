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
            name: { type: String },
            images: [{ type: String }],
          },
        ],

        totalPrice: {
          type: Number,
          required: true,
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
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card"],
      default: "Cash",
    },
    status: {
      type: String,
      enum: [
        "pending", // while in cart
        "submitted", // customer clicked submit order
        "accepted", // shop accepted order
        "rejected", // shop rejected order
        "processing", // shop is working on order
        "ready", // ready for delivery
        "out", // out for delivery
        "pickup", // ready for pickup by customer
        "delivered", // received by customer
        "picked-up",
        "cancelled", // customer cancelled before shop decides
      ], // ensure they are correct
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "not-paid"],
      default: "not-paid",
    },
    address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      // required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Order", OrderSchema)
