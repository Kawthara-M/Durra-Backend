import { sendEmail } from "../services/emailService.js"

export const sendContactMessage = async (req, res) => {
  try {
    const { subject, message } = req.body

    if (!subject || !message) {
      return res.status(400).json({
        error: "Subject and message are required",
      })
    }

    const userEmail = res.locals.payload?.email || "Anonymous User"

    await sendEmail({
      to:  process.env.EMAIL_USERNAME,
      subject: `New Contact Message — ${subject}`,
      html: `
<div style="font-family:Arial, sans-serif; background:#f7f7f7; padding:2em; color:#333;">
  <div style="max-width:90%; margin:auto; background:#ffffff; padding:2.2em; border-radius:0.5em; border:0.07em solid #e8e8e8;">

    <h2 style="color:#000; font-size:1.5em; margin-bottom:1em;">
      New Contact Request
    </h2>

    <p style="font-size:1em; line-height:1.6;">
      A user has submitted a contact form through the Durra platform:
    </p>

    <div style="
      background:#f9f9f9;
      border-left:4px solid #6f0101;
      padding:1em;
      margin:1.5em 0;
      border-radius:0.3em;
      font-size:0.95em;
    ">
      <p style="margin:0.3em 0;">
        <strong>From:</strong> ${userEmail}
      </p>
      <p style="margin:0.3em 0;">
        <strong>Subject:</strong> ${subject}
      </p>
      <p style="margin-top:0.5em;">
        <strong>Message:</strong><br/>
        ${message.replace(/\n/g, "<br/>")}
      </p>
    </div>

    <p style="font-size:0.9em; color:#777;">
      This message was submitted via the "Contact Us" page on the DURRA platform.
    </p>

    <div style="
      margin-top:2.5em;
      text-align:center;
      font-weight:bold;
      color:#6f0101;
    ">
      DURRA
    </div>

  </div>
</div>
`,
    })

    res.status(200).json({ success: true })
  } catch (err) {
    console.error("Contact form error:", err)
    res.status(500).json({ error: "Failed to send message" })
  }
}
