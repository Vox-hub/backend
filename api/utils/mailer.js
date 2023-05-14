const nodemailer = require("nodemailer");

exports.sendEmail = async (from, to, subject, body) => {
  const { AUTH_USER, AUTH_PASS } = process.env;
  let transporter = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 465,
    secure: true, //ssl
    auth: {
      user: AUTH_USER,
      pass: AUTH_PASS,
    },
  });

  let info = await transporter.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: body,
  });
};
