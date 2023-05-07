const express = require("express");
const router = express.Router();
const {
  getSubscription,
  createSubscription,
  addFeatures,
  removeFeatures,
  cancelSubscription,
} = require("../controllers/subscription");
const checkAuth = require("../middleware/check-auth.js");

router.get("/:id", checkAuth, getSubscription);

router.post("/", (req, res, next) => {
  let alert = req.body.alert_name;

  console.log(alert);
  switch (true) {
    case alert === "subscription_created":
      createSubscription(req, res, next);
      break;
    case alert === "subscription_cancelled":
      cancelSubscription(req, res, next);
      break;
    case alert === "invoice_paid_v2":
      addFeatures(req, res, next);
      break;
    case alert === "invoice_sent_v2":
      removeFeatures(req, res, next);
      break;
    default:
      console.log("Unknown case");
  }
});

module.exports = router;
