const Magazine = require('../models/Magazine');
const { uploadFileToS3 } = require('../helper/uploadFiles');

const createMagazine = async (req, res, next) => {
    try {
        const { title, topic, date, pages } = req.body;
        const file = req.files;
        if (!file || !file[0]) {
            return res.status(400).json({ success: false, message: 'PDF file is required' });
        }
        const bucketName = 'foundersmiddleeast';
        const result = await uploadFileToS3(file[0].path, bucketName, file[0].filename);
        if (!result || !result.url) {
            return res.status(500).json({ success: false, message: 'Failed to upload PDF to S3' });
        }
        const magazine = new Magazine({
            title,
            topic,
            date,
            pages,
            pdfUrl: result.url
        });
        await magazine.save();
        return res.status(201).json({ success: true, message: 'Magazine created', magazine });
    } catch (error) {
        next(error);
    }
};

const getAllMagazines = async (req, res, next) => {
    try {
        const magazines = await Magazine.find().sort({ date: -1 });
        res.status(200).json({ success: true, magazines });
    } catch (error) {
        next(error);
    }
};

const getMagazineById = async (req, res, next) => {
    try {
        const magazine = await Magazine.findById(req.params.id);
        if (!magazine) return res.status(404).json({ success: false, message: 'Magazine not found' });
        res.status(200).json({ success: true, magazine });
    } catch (error) {
        next(error);
    }
};

const deleteMagazine = async (req, res, next) => {
    try {
        const magazine = await Magazine.findByIdAndDelete(req.params.id);
        if (!magazine) return res.status(404).json({ success: false, message: 'Magazine not found' });
        res.status(200).json({ success: true, message: 'Magazine deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createMagazine,
    getAllMagazines,
    getMagazineById,
    deleteMagazine
};
