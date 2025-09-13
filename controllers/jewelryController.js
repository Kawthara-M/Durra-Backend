const Jewelry = require("../models/Jewelry")


const getAllJewelry = async (req, res) => {
  try {
    const jewelry = await Jewelry.find().populate("shop")

    res.status(200).json({
      jewelry,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching jewelry.",
    })
  }
}


const getJewelry = async (req, res) => {
  try {
    const jewelry = await Jewelry.findById(req.params.jewelryId).populate("shop")
    if (!jewelry) {
      return res.status(404).json({
        error: "Jewelry not found. It may have been deleted or does not exist.",
      })
    }

    res.status(200).json({
      jewelry,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching this jewelry.",
    })
  }
}


module.exports = {
  getAllJewelry,
  getJewelry,
}
