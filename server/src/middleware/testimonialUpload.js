const multer = require("multer");

const configuredLimit = Number.parseInt(process.env.TESTIMONIAL_UPLOAD_MAX_MB || "500", 10);
const maxFileSizeMb = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 500;

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (/^(audio|image|video)\//i.test(file.mimetype)) return callback(null, true);
    callback(new Error("Only audio, image, or video files are allowed."));
  },
});
