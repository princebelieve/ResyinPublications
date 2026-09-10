// server/src/middleware/upload.js
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const digitalField = ["pdfFile", "epubFile"].includes(file.fieldname);
    const digitalType = file.fieldname === "pdfFile"
      ? file.mimetype === "application/pdf"
      : file.mimetype === "application/epub+zip";
    if (digitalField) return callback(null, digitalType);
    return callback(null, file.mimetype.startsWith("image/"));
  },
});

const digitalUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ["application/pdf", "application/epub+zip"];
    callback(null, allowed.includes(file.mimetype));
  },
});

module.exports = upload;
module.exports.digitalUpload = digitalUpload;
