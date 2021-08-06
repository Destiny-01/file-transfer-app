const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  uploaded: {
    type: Array,
  },
  reset_token: {
    type: String,
  },
  sharedWithMe: {
    type: Array,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verification_token: {
    type: String,
  },
});

module.exports = mongoose.model("User", userSchema);
