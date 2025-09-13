const Collection = require("../models/Collection")

// tested
const getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find()
      .populate("shop")
      .populate("jewelry")

    res.status(200).json({
      collections,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching collections.",
    })
  }
}

// tested
const getCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(
      req.params.collectionId
    ).populate("shop").populate("jewelry")
    if (!collection) {
      return res.status(404).json({
        error:
          "Collection not found. It may have been deleted or does not exist.",
      })
    }

    res.status(200).json({
      collection,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching this collection.",
    })
  }
}

module.exports = {
  getAllCollections,
  getCollection,
}
