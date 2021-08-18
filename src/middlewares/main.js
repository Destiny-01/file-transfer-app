exports.recursiveGetFolder = (files, _id) => {
  let singleFile = null;
  for (let a = 0; a < files.length; a++) {
    let file = files[a];
    if (file.type == "folder") {
      if (file._id == _id) {
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

exports.recursiveGetSharedFolder = (files, _id) => {
  let singleFile = null;
  for (let a = 0; a < files.length; a++) {
    let file = typeof files[a].file === "undefined" ? files[a] : files[a].file;
    if (file.type == "folder") {
      if (file._id == _id) {
        return file;
      }
      if (file.files.length > 0) {
        singleFile = recursiveGetSharedFolder(file.files, _id);
        if (singleFile != null) {
          return singleFile;
        }
      }
    }
  }
};

exports.recursiveGetFile = (files, _id) => {
  let singleFile = null;
  for (let a = 0; a < files.length; a++) {
    const file = files[a];
    if (file.type != "folder") {
      if (file._id == _id) {
        return file;
      }
      if (file.type == "folder" && file.files.length > 0) {
        singleFile = recursiveGetFile(file.files, _id);
        if (singleFile != null) {
          return singleFile;
        }
      }
    }
  }
};

exports.getUpdatedArray = (arr, _id, uploadedObj) => {
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
  return arr;
};

exports.removeFile = (arr, _id) => {
  for (let a = 0; a < arr.length; a++) {
    if (arr[a].type != "folder" && arr[a]._id == _id) {
      try {
        fs.unlinkSync(arr[a].filePath);
      } catch (err) {
        console.error(err);
      }
      arr.splice(a, 1);
      break;
    }
    if (arr[a].type == "folder" && arr[a].files.length > 0) {
      arr[a]._id = ObjectId(arr[a]._id);
      removeFile(arr[a].files, _id);
    }
  }
  return arr;
};

exports.removeFolder = (arr, _id) => {
  for (let a = 0; a < arr.length; a++) {
    if (arr[a]._id == _id) {
      rimraf(arr[a].folderPath, () => {});
      arr.splice(a, 1);
      break;
    }
    if (arr[a].files.length > 0) {
      arr[a]._id = ObjectId(arr[a]._id);
      removeFolder(arr[a].files, _id);
    }
  }
  return arr;
};
