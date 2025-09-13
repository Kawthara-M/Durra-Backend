const nodemailer = require("nodemailer")
require("dotenv").config()

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
})

async function sendEmail({ to, subject, text, html }) {
  console.log("Preparing to send email to:", to) 

  if (!to || typeof to !== "string" || !to.includes("@")) {
    throw new Error("Invalid recipient email address.")
  }

  const mailOptions = {
    from: `"Durra Support" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject,
    text,
    html,
  }

  try {
    console.log("Email sent to:", to)
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error("Failed to send email:", error)
  }
}

module.exports = { sendEmail }
