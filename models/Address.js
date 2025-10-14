const mongoose = require("mongoose")
const Schema = mongoose.Schema

const AddressSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String },
  road: { type: String },
  building: { type: String },
  house: { type: String },
  area: { type: String },
  governante: { type: String },
  coordinates: {
    type: [Number], // [longitude, latitude]
  },
})

module.exports = mongoose.model("Address", AddressSchema)
