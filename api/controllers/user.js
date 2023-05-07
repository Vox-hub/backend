const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const mailer = require("../utils/mailer");

const tokenExp = "24h";

exports.getUsers = (req, res, next) => {
  User.find()
    .select(
      "_id firstname lastname email role verified stories voiceuuid createdAt subscriptionData"
    )
    .populate("subscriptionData")
    .populate("stories")
    .exec()
    .then((docs) => res.status(200).json(docs))
    .catch((err) => res.status(500).json({ error: err }));
};
exports.getUser = (req, res, next) => {
  var user = req.params.user;

  User.find({ _id: user })
    .select(
      "_id firstname lastname email role verified stories voiceuuid createdAt subscriptionData"
    )
    .populate("subscriptionData")
    .populate("stories")
    .exec()
    .then((doc) => {
      res.status(200).json(doc[0]);
    })
    .catch((err) => res.status(500).json({ err }));
};

exports.signIn = (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "Email is not found!",
        });
      } else if (user[0].verified === false) {
        return res.status(500).json({
          message: "Account is not verified!",
        });
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (result) {
          const token = jwt.sign(
            {
              userId: user[0]._id,
              firstname: user[0].firstname,
              lastname: user[0].lastname,
              email: user[0].email,
              role: user[0].role,
            },
            process.env.PRIVATE_KEY,
            {
              expiresIn: tokenExp,
            }
          );
          return res.status(200).json({
            message: "Auth successful",
            token: token,
          });
        } else {
          return res.status(401).json({
            message: "Password is wrong!",
          });
        }
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
};
exports.signUp = (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length >= 1) {
        return res.status(409).json({
          message: "Mail exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
            });
          } else {
            const token = jwt.sign(
              { email: req.body.email },
              process.env.PRIVATE_KEY
            );
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              firstname: req.body.firstname,
              lastname: req.body.lastname,
              role: "member",
              verified: false,
              password: hash,
              confirmationCode: token,
              voiceuuid: "",
            });
            mailer
              .sendEmail(
                process.env.AUTH_USER,
                req.body.email,
                "StoryTalk: Please verify your email address to complete registration",
                `
             
                <h2>Dear ${req.body.firstname} ${req.body.lastname}</h2>
                <p>
Thank you for signing up for our service. We are excited to have you on board! To complete the registration process, please click the button below to verify your email address:
                </p>
                <a href=http://storytalk.ai/verify/${token}> here </a>
                
                <p>
                If you did not sign up for our service, please ignore this email.
                </p>
                <b>Thanks, StoryTalk Team</b>
                </div>
                `
              )
              .then(() => {
                user
                  .save()
                  .then(() => {
                    res.status(201).json({
                      message: "User created",
                    });
                  })
                  .catch((err) => {
                    res.status(500).json({
                      error: err,
                    });
                  });
              })
              .catch((err) => {
                res.status(500).json({ err });
              });
          }
        });
      }
    });
};

exports.userVerification = (req, res, next) => {
  let email = jwt.verify(req.params.token, process.env.PRIVATE_KEY).email;

  User.findOneAndUpdate(
    { email: email },
    { $set: { verified: true } },
    { new: true }
  )
    .exec()
    .then(() => res.status(200).json({ message: "Account verified!" }))
    .catch((err) => res.status(500).json({ error: err }));
};

exports.updateUser = (req, res, next) => {
  var userId = req.params.userId;
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }

  if (updateOps.password) {
    res.status(500).json({ message: "you can't change password" });
  } else {
    User.update({ _id: userId }, { $set: updateOps })
      .exec()
      .then(() => {
        User.findById(userId)
          .exec()
          .then((user) => {
            const token = jwt.sign(
              {
                userId: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                role: user.role,
              },
              process.env.PRIVATE_KEY,
              {
                expiresIn: tokenExp,
              }
            );
            res.status(200).json({
              message: "User updated",
              token: token,
            });
          })
          .catch((err) => res.status(500).json({ error: err }));
      })
      .catch((err) => res.status(500).json({ error: err }));
  }
};

exports.forgotPassword = (req, res, next) => {
  User.find({ email: req.params.email })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      mailer
        .sendEmail(
          process.env.AUTH_USER,
          req.params.email,
          "StoryTalk: Password Reset Request",
          `
          
          <img class="logo" src="https://i.imgur.com/xqtbQ0j_d.png?maxwidth=760&fidelity=grand" width=150 height=150  />
          <div>
          <h2>Dear ${user[0].firstname} ${user[0].lastname}</h2>
          <p>
          We have received a request to reset the password for your account. If you did not make this request, please ignore this email.

To reset your password, please click on the link below:

<a href=https://kamasgold.com/changepassword/${user[0].confirmationCode}> here </a>

          </p>
          <b>Thanks, StoryTalk</b>
          </div>
        `
        )
        .then(() =>
          res.status(200).json({
            message: "mail sent!",
          })
        );
    })
    .catch((err) => res.status(500).json({ error: err }));
};

exports.changePassword = (req, res, next) => {
  var email = jwt.verify(req.params.code, process.env.PRIVATE_KEY).email;

  User.find({ email: email })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "failed",
        });
      }

      bcrypt.hash(req.body.newpassword, 10, (err, hash) => {
        if (err) {
          res.status(401).json({
            message: "hash failed",
          });
        } else {
          User.update({ email: email }, { password: hash })
            .exec()
            .then(() => {
              User.find({ email: email })
                .exec()
                .then((user) => {
                  const token = jwt.sign(
                    {
                      userId: user[0]._id,
                      firstname: user[0].firstname,
                      lastname: user[0].lastname,
                      email: user[0].email,
                      role: user[0].role,
                    },
                    process.env.PRIVATE_KEY,
                    {
                      expiresIn: tokenExp,
                    }
                  );

                  mailer
                    .sendEmail(
                      process.env.AUTH_USER,
                      email,
                      "StoryTalk: Password Changed Successfully",
                      `
                      
                <img class="logo" src="https://i.imgur.com/xqtbQ0j_d.png?maxwidth=760&fidelity=grand" width=150 height=150  />
                <div>
                <h2>Hello ${user[0].firstname} ${user[0].lastname}</h2>
              <p>
              This is a confirmation that your password has been successfully changed. If you did not make this change, please contact us immediately at this email.

              If you did make this change, please keep your new password safe and secure. We recommend choosing a strong password that is difficult to guess and changing it periodically to keep your account secure.              
              </p>
                <b>Thanks, StoryTalk</b>
                </div>
                      `
                    )
                    .then(() =>
                      res.status(200).json({
                        message: "Password changed!",
                        token: token,
                      })
                    );
                })
                .catch((err) => res.status(500).json({ error: err }));
            })
            .catch((err) => res.status(500).json({ error: err }));
        }
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
};

exports.deleteUser = (req, res, next) => {
  User.deleteOne({ _id: req.params.userId })
    .exec()
    .then((result) => res.status(200).json({ message: "User deleted" }))
    .catch((err) => res.status(500).json({ error: err }));
};
