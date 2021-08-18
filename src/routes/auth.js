const { Router } = require("express");
const router = Router();
const {
  registerGet,
  register,
  verifyEmail,
  getLogin,
  login,
  forgotPassword,
  sendRecoveryLink,
  getResetPasswod,
  resetPassword,
  logout,
} = require("../controllers/authController");

router.get("/register", registerGet);

router.post("/register", register);

router.get("/verifyEmail/:email/:verification_token", verifyEmail);

router.get("/login", getLogin);

router.post("/login", login);

router.get("/forgotPassword", forgotPassword);

router.post("/SendRecoveryLink", sendRecoveryLink);

router.get("/resetPassword/:email/:reset_token", getResetPasswod);

router.post("/ResetPassword", resetPassword);

router.get("/logout", logout);

module.exports = router;
