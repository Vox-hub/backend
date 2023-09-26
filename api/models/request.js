const mongoose = require("mongoose");
const moment = require("moment");

const requestSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    text: { type: String, required: true },
    prompt: { type: String, required: true },
    question: { type: String },
    answer: { type: String, required: true },
    sent_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: () => moment().utc(),
    },
    expiresAt: { type: Date, default: Date.now, index: { expires: "1d" } },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
