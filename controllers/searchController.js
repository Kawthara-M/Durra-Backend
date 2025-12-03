const Jewelry = require("../models/Jewelry")
const Service = require("../models/Service")
const Shop = require("../models/Shop")
const Collection = require("../models/Collection")
const Address = require("../models/Address") // ⬅️ NEW

const searchAll = async (req, res) => {
  try {
    const queryString = req.query.search?.trim()

    if (!queryString) {
      return res.status(400).json({ error: "Search query is required" })
    }

    const queryStrings = queryString.split(" ")
    const regexQueries = queryStrings.map((word) => ({
      $regex: word,
      $options: "i",
    }))

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

    const collectionQuery = {
      $and: [
        {
          $or: [
            ...regexQueries.map((regex) => ({ name: regex })),
            ...regexQueries.map((regex) => ({ description: regex })),
          ],
        },
      ],
    }

    const shopQuery = {
      $or: [...regexQueries.map((regex) => ({ name: regex }))],
    }

    const [jewelryResults, serviceResults, collectionResults, rawShopResults] =
      await Promise.all([
        Jewelry.find(jewelryQuery).populate("shop"),
        Service.find(serviceQuery).populate("shop"),
        Collection.find(collectionQuery).populate({
          path: "jewelry",
          populate: [
            "preciousMaterials",
            "diamonds",
            "pearls",
            "otherMaterials",
          ],
        }),
        Shop.find(shopQuery)
          .populate({
            path: "user",
            populate: { path: "defaultAddress" }, 
          })
          .lean(),
      ])

    const shopResults = rawShopResults.map((shop) => ({
      ...shop,
    }))

    const results = {
      jewelry: jewelryResults,
      services: serviceResults,
      collections: collectionResults,
      shops: shopResults,
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
