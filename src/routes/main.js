const { Router } = require("express");
const router = Router();
const {
  sharedWithMe,
  home,
  myUploads,
  createFolder,
  getUser,
  getFileSharedWith,
  share,
  uploadFile,
  removeSharedAcess,
  deleteFile,
  deleteFolder,
} = require("../controllers/mainContoller");

router.get("/", home);

router.get("/sharedWithMe/:_id?", sharedWithMe);

router.get("/myUploads/:_id?", myUploads);

router.post("/createFolder", createFolder);

router.post("/getUser", getUser);

router.post("/getFileSharedWith", getFileSharedWith);

router.post("/share", share);

router.post("/uploadFile", uploadFile);

router.post("/removeSharedAccess", removeSharedAcess);

router.post("/deleteFile", deleteFile);

router.post("/deleteFolder", deleteFolder);

module.exports = router;
