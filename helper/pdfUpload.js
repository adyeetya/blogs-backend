// utils/pdfUpload.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const clean = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "_" + clean);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isPdf = file.mimetype === "application/pdf" || ext === ".pdf";
  if (!isPdf) return cb(new Error("Only PDF files are allowed"));
  cb(null, true);
}

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: 90 * 1024 * 1024 }, // 90MB
}).single("pdf");

module.exports = uploadPdf;
