const express = require("express");
const router = express.Router();

const checkAuth = require("../middleware/check-auth.js");

const {
  getUsers,
  getUser,
  signUp,
  signIn,
  userVerification,
  updateUser,
  // changePassword,
  // forgotPassword,
  deleteUser,
} = require("../controllers/user");

// fetching users
router.get("/", checkAuth, getUsers);
router.get("/:user", checkAuth, getUser);

// oath handlers
router.post("/signup", signUp);
router.post("/signin", signIn);

// oath features
router.patch("/verify/:token", userVerification);
// router.get("/forgotpassword/:email", forgotPassword);
router.patch("/:userId", checkAuth, updateUser);
// router.patch("/changepassword/:code", changePassword);
router.delete("/:userId", checkAuth, deleteUser);

module.exports = router;
