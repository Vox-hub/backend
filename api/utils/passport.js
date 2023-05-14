const mongoose = require("mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require("../models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/user/google/callback",
      scope: ["profile", "email"],
    },
    function (res, accessToken, refreshToken, profile, callback) {
      let info = profile._json;

      User.find({ email: info.email })
        .exec()
        .then((result) => {
          if (result.length >= 1) {
            callback(null, profile);
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              google_id: profile.id,
              email: info.email,
              firstname: info.given_name,
              lastname: info.family_name,
              role: "member",
              verified: true,
            });

            user.save().then(() => {
              callback(null, profile);
            });
          }
        })
        .catch((err) => res.status(500).json({ error: err }));
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
