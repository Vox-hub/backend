const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}.${file.originalname.split(".").pop()}`);
  },
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
});

const upload = multer({ storage: storage });

if (!fs.existsSync("uploads/")) {
  fs.mkdirSync("uploads/");
}

module.exports = upload;
