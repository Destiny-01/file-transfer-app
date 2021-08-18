const User = require("../models/Auth");
require("dotenv").config();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

exports.registerGet = (req, res) => {
  res.render("register", { req });
};

const nodemailerObject = {
  service: "gmail",
  host: "smtp.gmail.com",
  secure: true,
  port: 465,
  auth: {
    user: process.env.NODE_MAILER_USER,
    pass: process.env.NODE_MAILER_PASS,
  },
};
const nodemailerFrom = "aigbedestinyic@gmail.com";
const transporter = nodemailer.createTransport(nodemailerObject);

exports.register = async (req, res) => {
  let blah = { user: "" };
  const main = "http://localhost:3000";

  const newUser = {
    name: req.fields.name,
    email: req.fields.email,
    password: bcrypt.hashSync(req.fields.password, 8),
    reset_token: "",
    uploaded: [],
    sharedWithMe: [],
    isVerified: false,
    verification_token: new Date().getTime(),
  };
  const email = newUser.email;
  const checkUser = await User.findOne({ email: email });
  if (checkUser) {
    req.status = "error";
    req.message = "Email already exists. Try verifying your email or login";
    res.render("register", {
      req,
    });
  } else {
    const user = await User.create(newUser);
    const text =
      "Please verify your account by clicking the following link: " +
      main +
      "/verifyEmail/" +
      newUser.email +
      "/" +
      newUser.verification_token;
    const html =
      "Please verify your account by clicking the following link: <br><br><a href='" +
      main +
      "/verifyEmail/" +
      newUser.email +
      "/" +
      newUser.verification_token +
      "'>Confirm Email</a><br><br> Thank you.";

    await transporter.sendMail(
      {
        from: nodemailerFrom,
        to: newUser.email,
        subject: "Email Verification",
        text: text,
        html: html,
      },
      (err, info) => {
        if (err) {
          console.error(err);
        } else {
          console.log("Email sent: " + info.response);
        }
        req.status = "success";
        req.message =
          "Signed up successfully. An email has been sent to verify your account. Then, you can now login";
        res.render("register", {
          req,
        });
      }
    );
  }
};

exports.verifyEmail = async (req, res) => {
  const email = req.params.email;
  const verification_token = req.params.verification_token;

  const user = await User.findOne({
    email: email,
    verification_token: parseInt(verification_token),
  });
  if (user == null) {
    req.status = "error";
    req.message = "Email doesn't exists or verification link expired";
    res.render("login", { req });
  } else {
    const user = await User.findOneAndUpdate(
      {
        email: email,
        verification_token: parseInt(verification_token),
      },
      { verification_token: "", isVerified: true }
    );

    req.status = "success";
    req.message = "Account has been verified";
    res.render("login", { req });
  }
};

exports.getLogin = (req, res) => {
  res.render("login", { req });
};

exports.login = async (req, res) => {
  const email = req.fields.email;
  const password = req.fields.password;
  const user = await User.findOne({
    email: email,
  });
  if (user == null) {
    req.status = "error";
    req.message = "Email doesn't exist";
    res.render("login", { req });
    return false;
  }
  bcrypt.compare(password, user.password, (err, isVerify) => {
    if (isVerify) {
      if (user.isVerified) {
        req.session.user = user;
        res.redirect("/");
        return false;
      }
      req.status = "error";
      req.message = "Kindly Verify your email";
      res.render("login", { req });
      return false;
    }
    req.status = "error";
    req.message = "Password is incorrect";
    res.render("login", { req });
  });
};

exports.forgotPassword = (req, res) => {
  res.render("forgotPassword", { req });
};

exports.sendRecoveryLink = async (req, res) => {
  const email = req.fields.email;
  const user = await User.findOne({
    email: email,
  });
  if (user == null) {
    req.status = "error";
    req.message = "Email doesn't exist";
    res.render("forgotPassword", { req });
    return false;
  }
  const reset_token = new Date().getTime();
  await User.findOneAndUpdate(
    {
      email: email,
    },
    { reset_token: reset_token }
  );
  const text =
    "Please reset your password by clicking the following link: " +
    main +
    "/resetPassword/" +
    email +
    "/" +
    reset_token;
  const html =
    "Please reset your password by clicking the following link: <br><br><a href='" +
    main +
    "/resetPassword/" +
    email +
    "/" +
    reset_token +
    "'>Confirm Email</a><br><br> Thank you.";

  await transporter.sendMail(
    {
      from: nodemailerFrom,
      to: newUser.email,
      subject: "Password Reset",
      text: text,
      html: html,
    },
    (err, info) => {
      if (err) {
        console.error(err);
      } else {
        console.log("Email sent: " + info.response);
      }
      req.status = "success";
      req.message = "An email has been sent to reset your password";
      res.render("ForgotPassword", {
        req,
      });
    }
  );
};

exports.getResetPasswod = async (req, res) => {
  const email = req.params.email;
  const reset_token = req.params.reset_token;

  const user = await User.findOne({
    email: email,
    reset_token: parseInt(reset_token),
  });
  if (user == null) {
    req.status = "error";
    req.message = "Link expired";
    res.render("error", { req });
    return false;
  }
  res.render("resetPassword", {
    req,
    email,
    reset_token,
  });
};

exports.resetPassword = async (req, res) => {
  const email = req.fields.email;
  const reset_token = req.fields.reset_token;
  const new_password = req.fields.new_password;
  const confirm_password = req.fields.confirm_password;
  if (new_password != confirm_password) {
    req.status = "error";
    req.message = "Password does not match";
    res.render("resetPassword", { req, email, reset_token });
    return false;
  }
  const user = await User.findOne({
    email: email,
    reset_token: reset_token,
  });
  if (user == null) {
    req.status = "error";
    req.message = "Email doesn't exist or link expired";
    res.render("resetPassword", { req, email, reset_token });
    return false;
  }
  bcrypt.hash(password, 10, async (err, hash) => {
    await User.findOneAndUpdate(
      {
        email: email,
        reset_token: parseInt(reset_token),
      },
      { reset_token: "", password: hash }
    );
    req.status = "success";
    req.message = "Password has been changed. Try logging in";
    res.render("login", { req });
  });
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
