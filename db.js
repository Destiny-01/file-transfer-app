const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  // try {
  //   await mongoose.connect("mongodb://localhost:27017/file-transfer-local", {
  //     useNewUrlParser: true,
  //     useFindAndModify: true,
  //     useUnifiedTopology: true,
  //   });
  //   console.log("Connected to db");
  // } catch (err) {
  //   console.error(err);
  // }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useFindAndModify: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to db");
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;
