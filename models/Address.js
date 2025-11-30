const mongoose = require("mongoose")
const Schema = mongoose.Schema

const AddressSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  road: { type: String, required: true },
  block: { type: String, required: true },
  house: { type: String },
  area: { type: String },
  governante: { type: String, required: true },
  coordinates: {
    type: [Number], // [longitude, latitude]
  },
})

module.exports = mongoose.model("Address", AddressSchema)
