const nodemailer = require("nodemailer");

const sendEmail = async ({ firstName, lastName, email, message }) => {
  const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
      user: "myEmail@gmail.com",
      pass: "password",
    },
    secure: true,
  });

  await transporter.verify();

  const mailData = {
    from: {
      name: `${firstName} ${lastName}`,
      address: "myEmail@gmail.com",
    },
    replyTo: email,
    to: "recipient@gmail.com",
    subject: `form message`,
    text: message,
    html: `${message}`,
  };

  await transporter.sendMail(mailData);
};

module.exports = sendEmail;
