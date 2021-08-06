const express = require("express");
const app = express();
const path = require("path");
const mainRoute = require("./routes/main");
const session = require("express-session");
const authRoute = require("./routes/auth");
const connectDB = require("./db");
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(
  session({
    secret: "secret key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  req.isLogin = typeof req.session.user !== "undefined";
  req.user = req.session.user;
  next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/", mainRoute);
app.use("/", authRoute);
connectDB();

app.use(express.static(path.join(__dirname + "/public")));

app.listen(port, () => console.log(`Server is listening on port ${port}`));
