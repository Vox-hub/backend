const express = require("express");
const router = express.Router();

// const checkAuth = require("../middleware/check-auth.js");

const {
  createRequestText,
  createRequestAudio,
} = require("../controllers/request.js");

const upload = require("../middleware/upload.js");

router.post("/", upload.single("audio"), createRequestAudio);
router.post("/text", createRequestText);

module.exports = router;
