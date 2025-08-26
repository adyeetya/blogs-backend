import multer from 'multer';
import path from 'path';
import Boom from 'boom';

class UploadHandler {
    constructor(fileSize = 90 * 1024 * 1024) {
        this.maxFileSize = fileSize;

        this.storage = multer.diskStorage({
            filename: (req, file, cb) => {
                const cleanFileName = file.originalname.replace(/\s/g, '');
                cb(null, `${Date.now()}_${cleanFileName}`);
            }
        });

        this.fileFilter = this.fileFilter.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
    }

    fileFilter(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, true);
    }

    handleUploadError(upload, req, res, next) {
        upload(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(Boom.badRequest('File size limit exceeded'));
                }
                return next(Boom.badRequest('Error in file upload'));
            }
            next();
        });
    }

    uploadFile(req, res, next) {
        const upload = multer({
            storage: this.storage,
            fileFilter: this.fileFilter,
            limits: { fileSize: this.maxFileSize }
        }).any();

        this.handleUploadError(upload, req, res, next);
    }
}

export default new UploadHandler();
