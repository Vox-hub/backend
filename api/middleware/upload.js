const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
});

const upload = multer({ storage });

if (!fs.existsSync("uploads/")) {
  fs.mkdirSync("uploads/");
}

module.exports = upload;
