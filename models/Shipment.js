const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ShipmentSchema = new Schema(
  {
    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },

    pickedUpAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    currentLocation: {
      type: String,
    },
    securityKey: {
      type: String,
    },
    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Shipment", ShipmentSchema)
