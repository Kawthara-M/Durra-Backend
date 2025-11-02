const mongoose = require("mongoose")
const Schema = mongoose.Schema

const WishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },

    items: [
      {
        favouritedItem: {
          type: Schema.Types.ObjectId,
          required: true,
          refPath: "items.favouritedItemType",
        },
        favouritedItemType: {
          type: String,
          required: true,
          enum: ["Service", "Jewelry", "Collection"],
        },
      }
    ]
  },
  { timestamps: true }
)

module.exports = mongoose.model("Wishlist", WishlistSchema)
