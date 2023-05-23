const mongoose = require("mongoose");
const moment = require("moment");

const storySchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  story: { type: String, required: true },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  midjourney_data: {},
  picture: { type: String },
  isVC: { type: Boolean },
  createdAt: {
    type: Date,
    default: () => moment().utc(),
  },
});

module.exports = mongoose.model("Story", storySchema);
