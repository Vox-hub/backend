const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.getUsers = (req, res) => {
  User.find()
    .exec()
    .then((docs) => res.status(200).json(docs))
    .catch((err) => res.status(500).json({ error: err }));
};

exports.getUser = (req, res, next) => {
  var user = req.params.user;

  User.find({ _id: user })
    .populate({
      path: "chat",
    })
    .populate({
      path: "subscription",
    })
    .exec()
    .then((doc) => {
      res.status(200).json(doc[0]);
    })
    .catch((err) => res.status(500).json({ err }));
};

exports.handleLoginSuccess = (req, res) => {
  let { user } = req;
  let { provider, id } = req.user;

  if (user) {
    if (provider === "google") {
      User.find({ email: user._json.email }).then((user) => {
        const token = jwt.sign(
          {
            userId: user[0]._id,
            google_id: id,
            firstname: user[0].firstname,
            lastname: user[0].lastname,
            openai_key: user[0].openai_key,
            email: user[0].email,
            picture: user[0].picture,
          },
          process.env.PRIVATE_KEY,
          {
            expiresIn: "24h",
          }
        );
        res.status(200).json({
          error: false,
          message: "Successfully Loged In",
          token: token,
        });
      });
    } else {
      User.find({ email: user.emails[0].value }).then((user) => {
        const token = jwt.sign(
          {
            userId: user[0]._id,
            github_id: id,
            firstname: user[0].firstname,
            lastname: user[0].lastname,
            openai_key: user[0].openai_key,
            email: user[0].email,
            picture: user[0].picture,
          },
          process.env.PRIVATE_KEY,
          {
            expiresIn: "24h",
          }
        );
        res.status(200).json({
          error: false,
          message: "Successfully Loged In",
          token: token,
        });
      });
    }
  } else {
    res.status(403).json({ error: true, message: "Not Authorized" });
  }
};

exports.updateUser = (req, res) => {
  var userId = req.params.userId;
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }

  User.update({ _id: userId }, { $set: updateOps })
    .exec()
    .then(() => {
      User.findById(userId)
        .exec()
        .then((user) => {
          const token = jwt.sign(
            {
              userId: user._id,
              google_id: user.google_id || user.github_id,
              firstname: user.firstname,
              lastname: user.lastname,
              email: user.email,
              picture: user.picture,
              openai_key: user.openai_key,
            },
            process.env.PRIVATE_KEY,
            {
              expiresIn: "24h",
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
};

exports.deleteUser = (req, res) => {
  User.deleteOne({ _id: req.params.userId })
    .exec()
    .then((result) => res.status(200).json({ message: "User deleted" }))
    .catch((err) => res.status(500).json({ error: err }));
};
