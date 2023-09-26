const mongoose = require("mongoose");
const moment = require("moment");

const subscriptionSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    user_id: { type: String, required: true },
    hours: {
      question: { type: Number, required: true },
      answer: { type: Number, required: true },
    },
    subscription_id: { type: String, required: true },
    subscription_plan_id: { type: String, required: true },
    status: { type: String, required: true },
    cancel_url: { type: String, required: true },
    update_url: { type: String, required: true },
    next_bill_date: { type: String, required: true },
    createdAt: {
      type: Date,
      default: () => moment().utc(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
