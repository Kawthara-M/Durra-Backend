const Jewelry = require("../models/Jewelry")
const Service = require("../models/Service")
const Shop = require("../models/Shop")

const searchAll = async (req, res) => {
  try {
    const queryString = req.body.search?.trim()

    if (!queryString) {
      return res.status(400).json({ error: "Search query is required" })
    }

    const queryStrings = queryString.split(" ")
    const regexQueries = queryStrings.map((word) => ({
      $regex: word,
      $options: "i",
    }))

    // Jewelry search fields
    const jewelryQuery = {
      $and: [
        { deleted: false },
        {
          $or: [
            ...regexQueries.map((regex) => ({ name: regex })),
            ...regexQueries.map((regex) => ({ description: regex })),
            ...regexQueries.map((regex) => ({
              "preciousMaterials.name": regex,
            })),
            ...regexQueries.map((regex) => ({ "diamonds.type": regex })),
            ...regexQueries.map((regex) => ({ "pearls.type": regex })),
            ...regexQueries.map((regex) => ({ "otherMaterials.name": regex })),
          ],
        },
      ],
    }

    // Service search fields
    const serviceQuery = {
      $and: [
        { deleted: false },
        {
          $or: [
            ...regexQueries.map((regex) => ({ name: regex })),
            ...regexQueries.map((regex) => ({ description: regex })),
          ],
        },
      ],
    }

    // Shop search fields
    const shopQuery = {
      $or: [
        ...regexQueries.map((regex) => ({ name: regex })),
      ],
    }

    const [jewelryResults, serviceResults, shopResults] = await Promise.all([
      Jewelry.find(jewelryQuery).populate("shop"),
      Service.find(serviceQuery).populate("shop"),
      Shop.find(shopQuery),
    ])

    // Combine all results
    const results = {
      jewelry: jewelryResults,
      services: serviceResults,
      shops: shopResults,
    }

    const totalResults =
      jewelryResults.length + serviceResults.length + shopResults.length

    if (totalResults === 0) {
      return res.status(404).json({ message: "No results found" })
    }

    return res.status(200).json(results)
  } catch (error) {
    console.error("Search error:", error.message)
    return res.status(500).json({ error: "Internal server error" })
  }
}


module.exports = {
  searchAll,
}
