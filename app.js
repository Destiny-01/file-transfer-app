const express = require("express");
const app = express();
const path = require("path");
const mainRoute = require("./routes/main");
const session = require("express-session");
const morgan = require("morgan");
const cookie = require("cookie-parser");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");
const connectDB = require("./db");
const MongoStore = require("connect-mongo");

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 },
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  })
);

app.use((req, res, next) => {
  req.isLogin = typeof req.session.user !== "undefined";
  req.user = req.session.user;
  next();
});

app.use(express.static(path.join(__dirname + "/public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan("tiny"));

app.use("/", mainRoute);
app.use("/", authRoute);
connectDB();

app.listen(port, () => console.log(`Server is listening on port ${port}`));
