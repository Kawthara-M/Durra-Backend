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
    productionCost: {
      type: Number,
      required: true,
    },
    originPrice: {
      type: Number,
      required: true,
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
        shape: {
          type: String,
          required: true,
        },
        color: {
          type: String,
          required: true,
        },
        number: {
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
        number: {
          type: Number,
          required: true,
        },
        color: {
          type: String,
        },
        clarity: {
          type: String,
          required: true,
        },
        cutGrade: {
          type: String,
        },
        type: {
          type: String,
          required: true,
        },
        shape: {
          type: String,
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
    certifications: [
      {
        name: {
          type: String,
          required: true,
        },
        reportNumber: {
          type: String,
        },
        reportDate: {
          type: String,
        },
        isVerified: {
          type: Boolean,
        },
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

module.exports = mongoose.model("Jewelry", JewelrySchema)
