const express = require("express");
const router = express.Router();
const {
  getSubscription,
  createSubscription,
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
    default:
      console.log("Unknown case");
  }
});

module.exports = router;
