const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const checkAuth = require("../middleware/check-auth.js");

const {
  getUsers,
  getUser,
  signUp,
  signIn,
  userVerification,
  updateUser,
  changePassword,
  forgotPassword,
  resendVerification,
  deleteUser,
} = require("../controllers/user");

// fetching users
router.get("/", getUsers);
router.get("/:user", checkAuth, getUser);

router.get("/login/success", (req, res) => {
  if (req.user) {
    User.find({ email: req.user._json.email }).then((user) => {
      const token = jwt.sign(
        {
          userId: user[0]._id,
          google_id: req.user.id,
          firstname: user[0].firstname,
          lastname: user[0].lastname,
          email: user[0].email,
          role: user[0].role,
        },
        process.env.PRIVATE_KEY,
        {
          expiresIn: "24h",
        }
      );

      res.status(200).json({
        error: false,
        message: "Successfully Loged In",
        user: req.user,
        token: token,
      });
    });
  } else {
    res.status(403).json({ error: true, message: "Not Authorized" });
  }
});

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    error: true,
    message: "Log in failure",
  });
});

// oath handlers
router.post("/signup", signUp);
router.post("/signin", signIn);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: `${process.env.CLIENT_URL}/google`,
    failureRedirect: "/login/failed",
  })
);

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect(process.env.CLIENT_URL);
});
// oath features
router.patch("/verify/:token", userVerification);
router.get("/resend/:email", resendVerification);
router.get("/forgotpassword/:email", forgotPassword);
router.patch("/:userId", checkAuth, updateUser);
router.patch("/changepassword/:code", changePassword);
router.delete("/:userId", checkAuth, deleteUser);

module.exports = router;
