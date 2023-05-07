const mongoose = require("mongoose");

const Subscription = require("../models/subscription");
const User = require("../models/user");

exports.getSubscription = (req, res, next) => {
  Subscription.find({ _id: req.params.id })
    .exec()
    .then((doc) => {
      res.status(200).json(doc[0]);
    })
    .catch((err) => res.status(500).json({ err }));
};

exports.createSubscription = (req, res, next) => {
  let {
    user_id,
    subscription_id,
    subscription_plan_id,
    status,
    cancel_url,
    update_url,
  } = req.body;

  const subscription = new Subscription({
    _id: new mongoose.Types.ObjectId(),
    user_id: user_id,
    subscription_id: subscription_id,
    subscription_plan_id: subscription_plan_id,
    status: status,
    cancel_url: cancel_url,
    update_url: update_url,
    stories_ttv: 500,
  });

  subscription
    .save()
    .then((result) => {
      User.findOneAndUpdate(
        { _id: JSON.parse(req.body.passthrough).userId },
        { subscriptionData: result._id }
      )
        .then(() => {
          res.status(200).json(`Subscription created ${subscription_id}`);
        })
        .catch((err) => res.status(500).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ error: err }));
};

exports.cancelSubscription = (req, res, next) => {
  Subscription.deleteOne({ subscription_id: req.body.subscription_id })
    .exec()
    .then(() => {
      User.updateOne(
        { _id: JSON.parse(req.body.passthrough).userId },
        { $unset: { subscriptionData: 1 } }
      )
        .then(() => res.status(200).json({ message: "Done!" }))
        .catch((err) => res.status(500).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ error: err }));
};

exports.addFeatures = (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((result) => {
      Subscription.findOneAndUpdate(
        { _id: result[0].subscriptionData },
        { stories_ttv: 500 }
      )
        .then(() => {
          res.status(200);
        })
        .catch((err) => res.status(500).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ err }));
};

exports.removeFeatures = (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((result) => {
      Subscription.findOneAndUpdate(
        { _id: result[0].subscriptionData },
        { stories_ttv: 0 }
      )
        .then(() => {
          res.status(200);
        })
        .catch((err) => res.status(500).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ err }));
};
