const Comparsion = require("../models/Comparsion")
const Jewelry = require("../models/Jewelry")

// tested from frontend
const getComparsion = async (req, res) => {
  try {
    const userId = res.locals.payload.id

    const comparsion = await Comparsion.findOne({ user: userId }).populate(
      "jewelry"
    )

    if (!comparsion) {
      return res.status(404).json({ error: "Comparsion not found." })
    }

    res.status(200).json({ comparsion })
  } catch (error) {
    console.error("Error fetching comparsion:", error)
    res.status(500).json({ error: "Failed to fetch comparsion." })
  }
}

// tested from frontend
const createComparsion = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const { jewelryId } = req.body

    console.log(jewelryId)

    if (!jewelryId) {
      return res.status(400).json({ error: "jewelryId is required." })
    }

    const j = await Jewelry.findById(jewelryId)
    if (!j) {
      return res.status(404).json({ error: "This jewelry piece is not found." })
    }

    const existing = await Comparsion.findOne({ user: userId })
    if (existing) {
      return res
        .status(400)
        .json({ error: "Comparsion already exists. Use PUT /comparison." })
    }

    const newComparsion = await Comparsion.create({
      user: userId,
      jewelry: [j._id],
    })

    const populated = await newComparsion.populate("jewelry")

    res.status(201).json({
      message: "Comparsion created successfully.",
      comparsion: populated,
    })
  } catch (error) {
    console.error("Error creating comparsion:", error)
    res.status(500).json({ error: "Failed to create comparsion." })
  }
}

// tested from frontend
const updateComparsion = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    let { jewelry } = req.body 

    if (!Array.isArray(jewelry)) {
      return res.status(400).json({ error: "jewelry must be an array" })
    }

    const uniqueIds = [...new Set(jewelry.map((id) => id.toString()))]

    const updatedComparsion = await Comparsion.findOneAndUpdate(
      { user: userId },
      { $set: { jewelry: uniqueIds } },
      { new: true }
    ).populate("jewelry")

    if (!updatedComparsion) {
      return res.status(404).json({ error: "Comparsion not found" })
    }

    res.json({ comparsion: updatedComparsion })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update comparsion" })
  }
}

module.exports = {
  getComparsion,
  createComparsion,
  updateComparsion,
}
