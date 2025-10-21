const axios = require("axios")
const cheerio = require("cheerio")

const getPrices = async (req, res) => {
  try {
    const goldResponse = await axios.get("https://bahrain-goldprice.com/")
    const $gold = cheerio.load(goldResponse.data)

    const goldPrices = []

    $gold(".divTableBody > .divTableRow").each((index, element) => {
      if (index === 0) return // Skip header row

      const cells = $gold(element).find(".divTableCell")
      if (cells.length >= 5) {
        const date = $gold(cells[0]).text().trim()
        const price24k = parseFloat($gold(cells[1]).text().trim())
        const price22k = parseFloat($gold(cells[2]).text().trim())
        const price21k = parseFloat($gold(cells[3]).text().trim())
        const price18k = parseFloat($gold(cells[4]).text().trim())

        if (!isNaN(price24k)) {
          goldPrices.push({
            date,
            price24k,
            price22k,
            price21k,
            price18k,
          })
        }
      }
    })

    const silverResponse = await axios.get(
      "https://bahrain-goldprice.com/silverprice/"
    )
    const $silver = cheerio.load(silverResponse.data)

    const silverPrices = []

    $silver(".divTableRow").each((_, row) => {
      const cells = $silver(row).find(".divTableCell")
      if (cells.length >= 2) {
        const priceText = $silver(cells[0]).text().trim()
        const dateText = $silver(cells[1]).text().trim().replace(/[()]/g, "")
        const pricePerOunce = parseFloat(priceText)
        if (!isNaN(pricePerOunce)) {
          const pricePerGram = pricePerOunce / 31.1035

          silverPrices.push({
            date: dateText,
            price925: parseFloat(pricePerGram.toFixed(4)), 
          })
        }
      }
    })

    return res.json({
      gold: goldPrices,
      silver: silverPrices,
    })
  } catch (error) {
    console.error("Error fetching metal prices:", error)
    res.status(500).json({ error: "Error fetching metal prices" })
  }
}

module.exports = { getPrices }
