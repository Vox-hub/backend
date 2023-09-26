const mongoose = require("mongoose");

const Subscription = require("../models/subscription");
const User = require("../models/user");

exports.getSubscription = (req, res) => {
  Subscription.find({ _id: req.params.id })
    .exec()
    .then((doc) => {
      res.status(200).json(doc[0]);
    })
    .catch((err) => res.status(500).json({ err }));
};

exports.createSubscription = (req, res) => {
  let {
    user_id,
    subscription_id,
    subscription_plan_id,
    status,
    next_bill_date,
    cancel_url,
    update_url,
  } = req.body;

  let { NEWBORN_ID, CHILD_ID, ADULT_ID } = process.env;

  function getHours(plan) {
    if (plan === NEWBORN_ID) {
      return {
        question: 4,
        answer: 24,
      };
    } else if (plan === CHILD_ID) {
      return {
        question: 7,
        answer: 50,
      };
    } else if (plan === ADULT_ID) {
      return {
        question: 10,
        answer: 100,
      };
    }
  }

  const subscription = new Subscription({
    _id: new mongoose.Types.ObjectId(),
    user_id: user_id,
    subscription_id: subscription_id,
    subscription_plan_id: subscription_plan_id,
    status: status,
    hours: getHours(subscription_plan_id),
    next_bill_date: next_bill_date,
    cancel_url: cancel_url,
    update_url: update_url,
  });

  subscription
    .save()
    .then((result) => {
      User.findOneAndUpdate(
        { _id: JSON.parse(req.body.passthrough).userId },
        { subscription: result._id }
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
        { $unset: { subscription: 1 } }
      )
        .then(() => res.status(200).json({ message: "Done!" }))
        .catch((err) => res.status(500).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ error: err }));
};

// exports.addFeatures = (req, res, next) => {
//   User.findOneAndUpdate({ email: req.body.email }, { credits: 500 })
//     .exec()
//     .then(() => {
//       res.status(200);
//     })
//     .catch((err) => res.status(500).json({ err }));
// };

// exports.removeFeatures = (req, res, next) => {
//   User.findOneAndUpdate({ email: req.body.email }, { credits: 0 })
//     .exec()
//     .then(() => {
//       res.status(200);
//     })
//     .catch((err) => res.status(500).json({ err }));
// };
