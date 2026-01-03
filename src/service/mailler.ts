import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

// Create a test account or replace with real credentials.
export const SendEmail = async (mailOptions: Mail.Options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GOOGLE_APP_EMAIL,
      pass: process.env.GOOGLE_APP_PASSWORD,
    },
  });

  // Wrap in an async IIFE so we can use await.

  const info = await transporter.sendMail({
    from: `"Social-App" <${process.env.GOOGLE_APP_EMAIL}>`,
    ...mailOptions,
    // to: "bar@example.com, baz@example.com",
    // subject: "Hello ✔",
    // text: "Hello world?", // plain‑text body
    // html: "<b>Hello world?</b>", // HTML body
  });

  console.log("Message sent:", info.messageId);
};
export const GeneratOTP = async() => {
  return  Math.floor(Math.random() * 1000000).toString();
};
