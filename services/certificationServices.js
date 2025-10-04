const axios = require("axios")
const cheerio = require("cheerio") // extract elemnt out of of the HTML response
const qs = require("qs") // to make url encoded form

async function verifyDanatReport(reportNo, reportDate) {
  const url = "https://www.danat.bh/verify-reports/"

  const formData = {
    _wpcf7: "15283",
    _wpcf7_version: "5.3.2",
    _wpcf7_locale: "en_US",
    _wpcf7_unit_tag: "wpcf7-f15283-p15284-o1",
    _wpcf7_container_post: "15284",
    _wpcf7_posted_data_hash: "",
    report_no: reportNo,
    report_date: reportDate,
  }

  try {
    const response = await axios.post(url, qs.stringify(formData), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Referer: url,
      },
    })

    const $ = cheerio.load(response.data)

    const messageEl = $("#message") // to find an element with id = message

    if (messageEl.length > 0) {
      const messageText = messageEl.text().trim()
      const downloadLink = messageEl.find("a").attr("href") || null

      if (messageEl.hasClass("bg-success")) {
        return {
          success: true,
          message: messageText,
          downloadLink,
        }
      } else if (messageEl.hasClass("bg-danger")) {
        return {
          success: false,
          message: messageText,
          downloadLink: null,
        }
      } else {
        return {
          success: false,
          message: "Unknown response status: " + messageText,
          downloadLink: null,
        }
      }
    } else {
      return {
        success: false,
        message: "No response message found in verification page.",
      }
    }
  } catch (err) {
    console.error("Error during DANAT verify:", err.message)
    return {
      success: false,
      message: "DANAT verification error: " + err.message,
    }
  }
}

module.exports = {
  verifyDanatReport,
}
