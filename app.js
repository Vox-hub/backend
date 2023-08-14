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
const requestRoutes = require("./api/routes/request");
const subscriptionRoutes = require("./api/routes/subscription");
const contactRoutes = require("./api/routes/contact");

const connectToDatabase = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://admin:${process.env.MONGOOSE_PW}@cryptofunds.tm1wc8l.mongodb.net/?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      }
    );

    mongoose.Promise = global.Promise;

    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

connectToDatabase();

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
    secret: process.env.PRIVATE_KEY,
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
app.use("/request", requestRoutes);
app.use("/subscription", subscriptionRoutes);
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
