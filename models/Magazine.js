// models/Magazine.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const PageSchema = new Schema(
  {
    index: { type: Number, required: true },
    key: { type: String, required: true },
    url: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
    sizeBytes: { type: Number },
    format: { type: String, enum: ["jpg", "png", "webp"], default: "webp" },
  },
  { _id: false }
);

const MagazineSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    dateOfPublish: { type: Date, required: true },
    author: { type: String },
    publisher: { type: String },
    coverSummary: { type: String },
    keywords: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "processing", "ready", "failed"],
      default: "draft",
      index: true,
    },
    sourcePdf: {
      key: { type: String },
      url: { type: String },
      sizeBytes: { type: Number },
    },
    pages: [PageSchema],
    pageCount: { type: Number, default: 0 },
    s3Prefix: { type: String, required: true }, // magazines/<slug>
    coverImageUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Magazine || mongoose.model("Magazine", MagazineSchema);
