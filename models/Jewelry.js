const mongoose = require("mongoose")
const Schema = mongoose.Schema

const JewelrySchema = new Schema(
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
    type: {
      type: String,
      required: true,
    },
    mainMaterial: {
      type: String,
      required: true,
    },
    totalWeight: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
    },
    limitPerOrder: {
      type: Number,
      required: true,
    },
    images: [
      {
        type: String,
        // required: true,
      },
    ],
    preciousMaterials: [
      {
        name: {
          type: String,
          required: true,
        },
        karat: {
          type: Number,
          required: true,
        },
        weight: {
          type: Number,
          required: true,
        },
        productionCost: {
          type: Number,
          required: true,
        },
        karatCost: {
          type: Number,
          required: true,
        },
      },
    ],
    pearls: [
      {
        type: {
          type: String,
          required: true,
        },
        weight: {
          type: Number,
          required: true,
        },
      },
    ],
    diamonds: [
      {
        weight: {
          type: Number,
          required: true,
        },
        color: {
          type: String,
          required: true,
        },
        clarity: {
          type: String,
          required: true,
        },
        cutGrade: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        shape: {
          type: String,
          required: true,
        },
      },
    ],
    otherMaterials: [
      {
        name: {
          type: String,
          required: true,
        },
        weight: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Jewelry", JewelrySchema)
