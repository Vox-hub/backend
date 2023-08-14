const mongoose = require("mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const passport = require("passport");
const User = require("../models/user");

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} = process.env;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/user/google/callback",
      scope: ["profile", "email"],
    },
    async function (accessToken, refreshToken, profile, callback) {
      try {
        let info = profile._json;

        const result = await User.find({ email: info.email });

        if (result.length >= 1) {
          callback(null, profile);
        } else {
          const user = new User({
            _id: new mongoose.Types.ObjectId(),
            google_id: profile.id,
            email: info.email,
            firstname: info.given_name,
            lastname: info.family_name,
            picture: info.picture,
          });

          await user.save();
          callback(null, profile);
        }
      } catch (error) {
        console.error(error);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: "/user/github/callback",
      scope: ["user:email"],
    },
    async function (accessToken, refreshToken, profile, callback) {
      try {
        let { displayName, emails, photos } = profile;

        const result = await User.find({ email: emails[0].value });

        if (result.length >= 1) {
          callback(null, profile);
        } else {
          const nameParts = displayName.split(" ");

          const user = new User({
            _id: new mongoose.Types.ObjectId(),
            github_id: profile.id,
            email: emails[0].value,
            firstname: nameParts[0],
            lastname: nameParts[nameParts.length - 1],
            picture: photos[0].value,
          });

          await user.save();
          callback(null, profile);
        }
      } catch (error) {
        console.error(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
