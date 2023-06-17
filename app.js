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
const contactRoutes = require("./api/routes/contact")

function Main() {
  mongoose.createConnection(
    `mongodb+srv://admin:${process.env.MONGOOSE_PW}@cluster0.2kbs0rs.mongodb.net/?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  ).then(() => {
    console.log("connected!")
  })
}

Main()

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
