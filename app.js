const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const passportStrategy = require("./api/utils/passport.js");
const userRoutes = require("./api/routes/user");
const storyRoutes = require("./api/routes/story");
const paddleRoutes = require("./api/routes/paddle");
const contactRoutes = require("./api/routes/contact");

mongoose.connect(
  `mongodb+srv://doadmin:${process.env.MONGO_ATLAS_PW}@storytalk-db-f77a717d.mongo.ondigitalocean.com/admin?tls=true&authSource=admin`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.Promise = global.Promise;

app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: "GET,POST,PATCH,PUT,DELETE",
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.CLIENT_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use("/user", userRoutes);
app.use("/story", storyRoutes);
app.use("/paddle", paddleRoutes);
app.use("/contact", contactRoutes);

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
