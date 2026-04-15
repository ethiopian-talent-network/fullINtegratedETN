const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.sendConnectionNotification = async (
  reciverEmail,
  reciverName,
  senderName,
) => {
  const mailerOptions = {
    from: `"Ethiopian Talent Network" <${process.env.EMAIL_USER}>`,
    to: reciverEmail,
    subject: `New Connection Request from ${senderName}`,
    text: `Hello ${reciverEmail},\n\n${senderName} has sent you a connection request on Ethiopian Talent Network.\n\nPlease log in to your account to accept or decline the request.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello ${reciverEmail},</h2>
        <p><strong>${senderName}</strong> wants to connect with you on the <strong>Ethiopian Talent Network</strong>.</p>
        <p>Networking with peers is a great way to get endorsements and find new opportunities.</p>
        <a href="http://localhost:5000/connections/pending"
           style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           View Request
        </a>
        <br/><br/>
        <p>Best regards,<br/>The ETN Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailerOptions);
  } catch (error) {
    console.error("Error sending connection notification:", error);
  }
};
