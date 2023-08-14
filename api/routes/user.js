const express = require("express");
const router = express.Router();
const passport = require("passport");

const checkAuth = require("../middleware/check-auth.js");

const {
  getUsers,
  getUser,
  handleLoginSuccess,
  updateUser,
  deleteUser,
} = require("../controllers/user");

// fetching users
router.get("/", getUsers);
router.get("/:user", checkAuth, getUser);

router.get("/login/success", handleLoginSuccess);

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    error: true,
    message: "Log in failure",
  });
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: `${process.env.CLIENT_URL}/auth-handler`,
    failureRedirect: "/login/failed",
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    scope: ["user:email"],
    successRedirect: `${process.env.CLIENT_URL}/auth-handler`,
    failureRedirect: "/",
  })
);

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect(process.env.CLIENT_URL);
});

// oath features
router.patch("/:userId", checkAuth, updateUser);
router.delete("/:userId", checkAuth, deleteUser);

module.exports = router;
