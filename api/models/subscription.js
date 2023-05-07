const mongoose = require("mongoose");
const moment = require("moment");

const subscriptionSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  user_id: { type: String, required: true },
  subscription_id: { type: String, required: true },
  subscription_plan_id: { type: String, required: true },
  status: { type: String, required: true },
  cancel_url: { type: String, required: true },
  update_url: { type: String, required: true },
  stories_ttv: { type: Number },
  createdAt: {
    type: Date,
    default: () => moment().utc(),
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
