const mongoose = require("mongoose")
const Schema = mongoose.Schema

const AddressSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  street: { type: String, required: true },
  building: { type: String, required: true },
  house: { type: String },
  city: { type: String, required: true },
})

module.exports = mongoose.model("Address", AddressSchema)
