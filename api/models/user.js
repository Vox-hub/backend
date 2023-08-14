const mongoose = require("mongoose");
const moment = require("moment");

const userSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    email: {
      type: String,
      required: true,
      unique: true,
      match:
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
    },
    google_id: { type: String },
    github_id: { type: String },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    picture: { type: String, required: true },
    openai_key: { type: String },
    chat: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request",
        index: { expires: "1d" },
      },
    ],
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    createdAt: {
      type: Date,
      default: () => moment().utc(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
