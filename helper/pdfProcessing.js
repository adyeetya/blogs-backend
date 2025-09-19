// services/pdfProcessing.js
const path = require("path");
const os = require("os");
const fs = require("fs");
const fsp = require("fs/promises");
const sharp = require("sharp");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { uploadFileToS3 } = require("../helper/uploadFiles");

const pExecFile = promisify(execFile);
const BUCKET = process.env.AWS_S3_BUCKET  || 'foundersmiddleeast';
const REGION = process.env.AWS_REGION || "ap-south-1";

function publicUrl(key) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

async function processPdfToImagesAndUpload({ pdfPath, s3Prefix, bucket }) {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "pdf-"));
  const imagesDir = path.join(tmpDir, "pages");
  await fsp.mkdir(imagesDir);

  const base = path.join(imagesDir, "page");
  // Generate JPEG pages at 180 DPI
  await pExecFile("pdftoppm", ["-jpeg", "-r", "180", pdfPath, base]);

  const files = (await fsp.readdir(imagesDir))
    .filter((f) => f.startsWith("page"))
    .filter((f) => f.endsWith(".jpg") || f.endsWith(".jpeg"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const pages = [];
  for (let i = 0; i < files.length; i++) {
    const localPath = path.join(imagesDir, files[i]);
    const img = sharp(localPath);
    const meta = await img.metadata();
    const targetWidth = Math.min(1600, meta.width || 1600);
    const outPath = path.join(imagesDir, `page-${String(i + 1).padStart(3, "0")}.webp`);

    await img.resize({ width: targetWidth }).webp({ quality: 82 }).toFile(outPath);

    const s3Key = `${s3Prefix}/pages/${path.basename(outPath)}`;
    await uploadFileToS3(outPath, bucket, s3Key);

    const stat = await fsp.stat(outPath);
    const height = meta.width && meta.height
      ? Math.round((meta.height * targetWidth) / meta.width)
      : Math.round((4 / 3) * targetWidth);

    pages.push({
      index: i,
      key: s3Key,
      url: publicUrl(s3Key),
      width: targetWidth,
      height,
      sizeBytes: stat.size,
      format: "webp",
    });
  }

  const coverImageUrl = pages[0]?.url;
  // Cleanup tmp dir best-effort
  try { await fsp.rm(tmpDir, { recursive: true, force: true }); } catch (_) {}

  return { pages, coverImageUrl };
}

module.exports = { processPdfToImagesAndUpload };
