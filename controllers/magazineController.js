// controllers/magazine.controller.js
const path = require("path");
const fs = require("fs");
const Magazine = require("../models/Magazine");
const { uploadFileToS3 } = require("../helper/uploadFiles");
const { processPdfToImagesAndUpload } = require("../helper/pdfProcessing");

const BUCKET = process.env.AWS_S3_BUCKET || 'foundersmiddleeast';
const REGION = process.env.AWS_REGION || "ap-south-1";

function publicUrl(key) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

module.exports = {
  async create(req, res) {
    try {
      const { title, slug, dateOfPublish, author, publisher, coverSummary, keywords } = req.body;
      if (!title || !slug || !dateOfPublish) {
        return res.status(400).json({ success: false, message: "title, slug, dateOfPublish required" });
      }
      const s3Prefix = `magazines/${slug}`;
      const mag = await Magazine.create({
        title,
        slug,
        dateOfPublish: new Date(dateOfPublish),
        author,
        publisher,
        coverSummary,
        keywords,
        s3Prefix,
        status: "draft",
      });
      return res.json({ success: true, data: mag });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  },

  async getBySlug(req, res) {
    const { slug } = req.params;
    const mag = await Magazine.findOne({ slug });
    if (!mag) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: mag });
  },

  async list(req, res) {
    const mags = await Magazine.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: mags });
  },

  async uploadPdfAndProcess(req, res) {
    const { slug } = req.params;
    const mag = await Magazine.findOne({ slug });
    if (!mag) return res.status(404).json({ success: false, message: "Magazine not found" });

    const file = req.file || (req.files && req.files[0]);
    if (!file) return res.status(400).json({ success: false, message: "PDF required" });

    try {
      mag.status = "processing";
      await mag.save();

      const pdfKey = `${mag.s3Prefix}/source.pdf`;
      console.log('Uploading PDF to S3:', pdfKey);
      await uploadFileToS3(file.path, BUCKET, pdfKey);
      console.log('Uploaded PDF to S3:', pdfKey);
      const pdfUrl = publicUrl(pdfKey);

      mag.sourcePdf = { key: pdfKey, url: pdfUrl, sizeBytes: file.size };
      await mag.save();

      const { pages, coverImageUrl } = await processPdfToImagesAndUpload({
        pdfPath: file.path,
        s3Prefix: mag.s3Prefix,
        bucket: BUCKET,
      });
 console.log('Proccessed PDF and uploaded to S3', pages.length, 'pages');
      mag.pages = pages;
      mag.pageCount = pages.length;
      mag.coverImageUrl = coverImageUrl || (pages[0] && pages[0].url);
      mag.status = "ready";
      await mag.save();

      fs.unlink(file.path, () => {});
      return res.json({ success: true, data: mag });
    } catch (e) {
      mag.status = "failed";
      await mag.save();
      return res.status(500).json({ success: false, message: e.message });
    }
  },
};
