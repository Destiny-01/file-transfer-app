const { Router } = require("express");
const User = require("../models/Auth");
const fs = require("fs");
const rimraf = require("rimraf");
const ObjectId = require("mongodb").ObjectID;
const router = Router();

exports.home = (req, res) => {
  res.render("index", { req });
};

exports.sharedWithMe = async (req, res) => {
  const _id = req.params._id;
  if (req.session.user) {
    const user = await User.findOne({ _id: ObjectId(req.session.user._id) });
    let files = null;
    let folderName = "";
    if (typeof _id == "undefined") {
      files = user.sharedWithMe;
    } else {
      const folderObj = await recursiveGetSharedFolder(user.files, _id);

      if (folderObj == null) {
        req.status = "error";
        req.message = "Folder not found";
        res.render("error", { req });
        return false;
      }
      files = folderObj.files;
      folderName = folderObj.folderName;
    }
    if (files == null) {
      req.status = "error";
      req.message = "Directory not found";
      res.render("error", { req });
      return false;
    }
    res.render("sharedWithMe", { req, files, _id, folderName });
    return false;
  }
  res.redirect("/login");
};

exports.myUploads = async (req, res) => {
  const _id = req.params._id;
  if (req.session.user) {
    const user = await User.findOne({ _id: ObjectId(req.session.user._id) });
    let uploaded = null;
    let folderName = "";
    let createdAt = "";
    if (typeof _id == "undefined") {
      uploaded = user.uploaded;
    } else {
      const folderObj = await recursiveGetFolder(user.uploaded, _id);
      console.log(user.uploaded, _id);
      if (folderObj == null) {
        req.status = "error";
        req.message = "Folder not found";
        res.render("myUploads", { req, uploaded, folderName, _id, createdAt });
        return false;
      }
      uploaded = folderObj.files;
      folderName = folderObj.folderName;
      createdAt = folderObj.createdAt;
    }
    if (uploaded == null) {
      req.status = "error";
      req.message = "Directory not found";
      res.render("myUploads", { req, uploaded, folderName, _id, createdAt });
      return false;
    }
    res.render("myUploads", { req, uploaded, folderName, _id, createdAt });
    return false;
  }
  res.redirect("/login");
};

exports.createFolder = async (req, res) => {
  const name = req.fields.name;
  const _id = req.fields._id;

  if (req.session.user) {
    const user = await User.findOne({ _id: ObjectId(req.session.user._id) });
    const uploadedObj = {
      _id: ObjectId(),
      type: "folder",
      folderName: name,
      files: [],
      folderPath: "",
      createdAt: new Date().getTime(),
    };
    let folderPath = "";
    let updatedArray = [];
    if (_id == "") {
      folderPath = "public/uploads/" + user.email + "/" + name;
      uploadedObj.folderPath = folderPath;
      if (!fs.existsSync("public/uploads/" + user.email)) {
        fs.mkdirSync("public/uploads/" + user.email);
      }
    } else {
      let folderObj = await recursiveGetFolder(user.uploaded, _id);
      uploadedObj.folderPath = folderObj.folderPath + "/" + name;
      updatedArray = await getUpdatedArray(user.uploaded, _id, uploadedObj);
    }
    if (uploadedObj.folderPath == "") {
      req.session.status = "error";
      req.session.message = "Folder name must not be empty";
      res.redirect("/myUploads");
      return false;
    }
    if (fs.existsSync(uploadedObj.folderPath)) {
      req.session.status = "error";
      req.session.message = "Folder with same name already exists";
      res.redirect("/myUploads");
      return false;
    }
    fs.mkdirSync(uploadedObj.folderPath);
    if (_id == "") {
      await User.findOneAndUpdate(
        { _id: ObjectId(req.session.user._id) },
        { $push: { uploaded: uploadedObj } }
      );
    } else {
      for (let a = 0; a < updatedArray.length; a++) {
        updatedArray[a]._id = ObjectId(updatedArray[a]._id);
      }
      await User.findOneAndUpdate(
        { _id: ObjectId(req.session.user._id) },
        { uploaded: updatedArray }
      );
    }
    res.redirect("/myUploads/" + _id);
    return false;
  }
  res.redirect("/login");
};

exports.getUser = async (req, res) => {
  const email = req.fields.email;

  if (req.session.user) {
    const user = await User.findOne({ email: email });
    if (user == null) {
      res.json({ status: "error", message: `User ${email} does not exists` });
      return false;
    }
    if (!user.isVerified) {
      res.json({
        status: "error",
        message: `User ${user.name} is not verified`,
      });
      return false;
    }
    res.json({
      status: "success",
      message: `Data fetched`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
    return false;
  }
  res.json({ status: "error", message: `please login` });
  return false;
};

exports.getFileSharedWith = async (req, res) => {
  const _id = req.fields._id;
  const sharedWithMe = sharedWithMe.file._id;
  const sharedBy = sharedWithMe.sharedBy._id;

  if (req.session.user) {
    const tempUsers = await User.find({
      "sharedWithMe._id": ObjectId(_id),
      "sharedWithMe.sharedBy._id": ObjectId(req.session.user._id),
    });
    let users = [];
    for (let a = 0; a < tempUsers.length; a++) {
      let sharedObj = null;
      for (let b = 0; b < tempUsers[a].sharedWithMe.length; b++) {
        if (tempUsers[a].sharedWithMe[b].file._id == _id) {
          sharedObj = {
            _id: tempUsers[a].sharedWithMe[b]._id,
            sharedAt: tempUsers[a].sharedWithMe[b].createdAt,
          };
        }
      }
      users.push({
        _id: tempUsers[a]._id,
        name: tempUsers[a].name,
        email: tempUsers[a].email,
        sharedObj: sharedObj,
      });
    }
    res.json({
      status: "success",
      message: `Record fetched`,
      users: {
        users,
      },
    });
    return false;
  }
  res.json({ status: "error", message: `please login` });
};

exports.share = async (req, res) => {
  const _id = req.fields._id;
  const type = req.fields.type;
  const email = req.fields.email;

  const me = await User.findOne({ _id: ObjectId(req.session.user._id) });
  console.log(await recursiveGetFolder(me.uploaded, _id));
  if (req.session.user) {
    const user = await User.findOne({ email: email });
    if (user == null) {
      req.session.status = "error";
      req.session.message = `User ${email} doesn't exist`;
      res.redirect("/myUploads");
      return false;
    }
    if (!user.isVerified) {
      (req.session.status = "error"),
        (req.session.message = `User ${user.name} is not verified`),
        res.redirect("/myUploads/");
      return false;
    }
    let file = null;
    if (type == "folder") {
    } else {
      file = await recursiveGetFile(me.uploaded, _id);
    }
    console.log(file, me.uploaded, _id);
    if (file == null) {
      req.session.status = "error";
      req.session.message = "File not found";
      res.redirect("/myUploads/");
      return false;
    }
    console.log("ppp");
  }
  res.redirect("/login");
};

exports.uploadFile = async (req, res) => {
  if (req.session.user) {
    const user = await User.findOne({ _id: ObjectId(req.session.user._id) });
    if (req.files.file.size > 0) {
      const _id = req.fields._id;
      const uploadedObj = {
        _id: ObjectId(),
        name: req.files.file.name,
        size: req.files.file.size,
        type: req.files.file.type,
        filePath: "",
        createdAt: new Date().getTime(),
      };
      let filePath = "";
      if (_id == "") {
        filePath =
          "public/uploads/" +
          user.email +
          "/" +
          new Date().getTime() +
          "-" +
          req.files.file.name;
        uploadedObj.filePath = filePath;
        if (!fs.existsSync("public/uploads/" + user.email)) {
          fs.mkdirSync("public/uploads/" + user.email);
        }
        fs.readFile(req.files.file.path, (err, data) => {
          if (err) throw err;
          console.log("file read");
          fs.writeFile(filePath, data, async (err) => {
            if (err) throw err;
            console.log("file written");
            await User.findOneAndUpdate(
              { _id: ObjectId(req.session.user._id) },
              { $push: { uploaded: uploadedObj } }
            );
            res.redirect("/myUploads/" + _id);
          });

          fs.unlink(req.files.file.path, (err) => {
            if (err) throw err;
            console.log("file deleted");
          });
        });
      } else {
        const folderObj = await recursiveGetFolder(user.uploaded, _id);
        console.log(req.fields, _id);
        uploadedObj.filePath = folderObj.folderPath + "/" + req.files.file.name;
        let updatedArray = await getUpdatedArray(
          user.uploaded,
          _id,
          uploadedObj
        );
        fs.readFile(req.files.file.path, (err, data) => {
          if (err) throw err;
          console.log("file read");
          fs.writeFile(uploadedObj.filePath, data, async (err) => {
            if (err) throw err;
            console.log("file written");
            for (let a = 0; a < updatedArray.length; a++) {
              updatedArray[a]._id = ObjectId(updatedArray[a]._id);
            }
            await User.findOneAndUpdate(
              { _id: ObjectId(req.session.user._id) },
              { uploaded: updatedArray }
            );
            res.redirect("/myUploads/" + _id);
          });

          fs.unlink(req.files.file.path, (err) => {
            if (err) throw err;
            console.log("file deleted");
          });
        });
      }
    } else {
      req.status = "error";
      req.message = "Please select a valid file";
      res.render("myUploads", { req });
    }
    return false;
  }
  res.redirect("/login");
};

exports.removeSharedAcess = async (req, res) => {
  const _id = req.fields._id;

  if (req.session.user) {
    const user = await User.findOne({
      "sharedWithMe._id": ObjectId(_id),
      "sharedWithMe.sharedBy._id": ObjectId(req.session.user._id),
    });

    for (let a = 0; a < user.sharedWithMe.length; a++) {
      if ((user.sharedWithMe[a]._id = _id)) {
        user.sharedWithMe.splice(a, 1);
      }
    }
    await User.findOneAndUpdate(
      {
        "sharedWithMe._id": ObjectId(_id),
        "sharedWithMe.sharedBy._id": ObjectId(req.session.user._id),
      },
      { sharedWithMe: user.sharedWithMe }
    );
    req.session.status = "success";
    req.session.message = "Shared Access has been removed";
    const backUrl = req.header("referer") || "/";
    res.redirect(backUrl);
    return false;
  }
  res.redirect("/login");
};

exports.deleteFile = async (req, res) => {
  const _id = req.fields._id;
  if (req.session.user) {
    const user = await User.findOne({ _id: ObjectId(req.session.user._id) });
    let updatedArray = await removeFile(user.uploaded, _id);
    for (let a = 0; a < updatedArray.length; a++) {
      updatedArray[a]._id = ObjectId(updatedArray[a]._id);
    }
    await User.findOneAndUpdate(
      { _id: ObjectId(req.session.user._id) },
      { uploaded: updatedArray }
    );
    const backUrl = req.header("referer") || "/";
    res.redirect(backUrl);
    return false;
  }
  res.redirect("/login");
};

exports.deleteFolder = async (req, res) => {
  const _id = req.fields._id;
  if (req.session.user) {
    const user = await User.findOne({ _id: ObjectId(req.session.user._id) });
    let updatedArray = await removeFolder(user.uploaded, _id);
    for (let a = 0; a < updatedArray.length; a++) {
      updatedArray[a]._id = ObjectId(updatedArray[a]._id);
    }
    await User.findOneAndUpdate(
      { _id: ObjectId(req.session.user._id) },
      { uploaded: updatedArray }
    );
    const backUrl = req.header("referer") || "/";
    res.redirect(backUrl);
    return false;
  }
  res.redirect("/login");
};

module.exports = router;
