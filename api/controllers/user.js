const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const mailer = require("../utils/mailer");

exports.getUsers = (req, res, next) => {
  User.find()
    .select(
      "_id firstname lastname email credits role verified confirmationCode stories voiceuuid createdAt subscriptionData"
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
      "_id firstname lastname email credits role verified stories voiceuuid createdAt subscriptionData"
    )
    .populate("subscriptionData")
    .populate("stories")
    .exec()
    .then((doc) => {
      res.status(200).json(doc[0]);
    })
    .catch((err) => res.status(500).json({ err }));
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
                confirmationCode: user[0].confirmationCode,
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

exports.deleteUser = (req, res, next) => {
  User.deleteOne({ _id: req.params.userId })
    .exec()
    .then((result) => res.status(200).json({ message: "User deleted" }))
    .catch((err) => res.status(500).json({ error: err }));
};
