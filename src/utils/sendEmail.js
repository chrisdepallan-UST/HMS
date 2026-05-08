const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
   host: "smtp.gmail.com",
  service: "gmail",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },family: 4,
    debug: true,
  logger: true,
  connectionTimeout: 30000,
  greetingTimeout : 30000,
  socketTimeout: 30000
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    
  });
};

module.exports = sendEmail;
