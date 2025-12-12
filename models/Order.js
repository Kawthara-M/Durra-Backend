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
    driver: { type: Schema.Types.ObjectId, ref: "Driver" },
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
            material: { type: String },
            type: { type: String },
            details: { type: String },
          },
        ],

        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],

    jewelryOrder: [
      {
        // item and itemModel to allow user to add jewelry / collection
        item: {
          type: Schema.Types.ObjectId,
          required: true,
          refPath: "jewelryOrder.itemModel",
        },
        itemModel: {
          type: String,
          required: true,
          enum: ["Jewelry", "Collection"],
        },
        quantity: {
          type: Number,
          default: 1,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        size: {
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
      ], 
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
