const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/mailer");

router.post("/send", (req, res, next) => {
  const { fullname, email, message } = req.body;

  sendEmail(
    process.env.AUTH_USER,
    process.env.AUTH_USER,
    `StoryTalk: Contact from ${fullname}`,
    `
             
                <h2>Fullname: ${fullname}</h2>
                <h2>Email: ${email}</h2>
                <p>${message}</p>             
               
                <b>Thanks, StoryTalk</b>
                `
  ).then(() => {
    res.status(200).json({ message: "Message sent!" });
  });
});

module.exports = router;
