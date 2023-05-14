const express = require("express");
const router = express.Router();
const {
  getStories,
  getStory,
  addStory,
  getAudio,
  updateStory,
  deleteStory,
} = require("../controllers/story");

const checkAuth = require("../middleware/check-auth.js");

router.get("/", getStories);
router.get("/:storyId", getStory);

router.post("/", addStory);
router.post("/:storyId/audio", getAudio);
router.patch("/:storyId", checkAuth, updateStory);
router.delete("/:storyId", deleteStory);

module.exports = router;
