const mongoose = require("mongoose");
const moment = require("moment");

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: {
    type: String,
    required: true,
    unique: true,
    match:
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
  },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  role: { type: String },
  verified: { type: Boolean, required: true },
  password: { type: String, required: true },
  // avatar: { type: String },
  stories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },
  ],
  createdAt: {
    type: Date,
    default: () => moment().utc(),
  },
  confirmationCode: {
    type: String,
    unique: true,
  },
  voiceuuid: { type: String },
  subscriptionData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
  },
});

module.exports = mongoose.model("User", userSchema);
