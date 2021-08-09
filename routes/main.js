const { Router } = require("express");
const User = require("../models/Auth");
const fs = require("fs");
const ObjectId = require("mongodb").ObjectID;
const router = Router();

router.get("/", (req, res) => {
  res.render("index", { req });
});

const recursiveGetFolder = (files, _id) => {
  let singleFile = null;
  for (var a = 0; a < files.length; a++) {
    const file = files[a];
    if (file.type == "folder") {
      if (file._id) {
        return file;
      }
      if (file.files.length > 0) {
        singleFile = recursiveGetFolder(file.files, _id);
        if (singleFile != null) {
          return singleFile;
        }
      }
    }
  }
};

const getUpdatedArray = (arr, _id, uploadedObj) => {
  for (let a = 0; a < arr.length; a++) {
    if (arr[a].type == "folder") {
      if (arr[a]._id == _id) {
        arr[a].files.push(uploadedObj);
        arr[a]._id = ObjectId(arr[a]._id);
      }
      if (arr[a].files.length > 0) {
        arr[a]._id = ObjectId(arr[a]._id);
        getUpdatedArray(arr[a].files, _id, uploadedObj);
      }
    }
  }
};

router.get("/myUploads/:_id?", async (req, res) => {
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
      if (folderObj == null) {
        req.status = "error";
        req.message = "Folder not found";
        res.render("myUploads", { req });
        return false;
      }
      uploaded = folderObj.files;
      folderName = folderObj.folderName;
      createdAt = folderObj.createdAt;
    }
    if (uploaded == null) {
      req.status = "error";
      req.message = "Directory not found";
      res.render("myUploads", { req });
      return false;
    }
    res.render("myUploads", { req, uploaded, folderName, _id, createdAt });
    return false;
  }
  res.redirect("/login");
});

router.post("/createFolder", async (req, res) => {
  const name = req.body.name;
  const _id = req.body._id;

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
        { uploaded: uploadedObj }
      );
    } else {
      console.log(updatedArray);
      for (let a = 0; a < updatedArray.length; a++) {
        updatedArray[a]._id = ObjectId(updatedArray[a]._id);
      }
      await User.findOneAndUpdate(
        { _id: ObjectId(req.session.user._id) },
        { uploaded: updatedArray }
      );
    }
    res.redirect("/myuploads/" + _id);
    return false;
  }
  res.redirect("/login");
});

module.exports = router;
