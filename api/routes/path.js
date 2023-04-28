const express = require("express");
const router = express.Router();
var fs = require("fs");

router.get("/:id", (req, res, next) => {
  fs.readFile(`api/controllers/images/${req.params.id}`, function (err, data) {
    if (err) {
      res.status(404);
    } else {
      res.send(data);
    }
  });
});

module.exports = router;

// C:\Users\Imad\Desktop\Upwork\backend\api\controllers\images
