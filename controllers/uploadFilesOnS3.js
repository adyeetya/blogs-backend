const { uploadFileToS3 } = require("../helper/uploadFiles");
const uploadFilesOnS3 = async (req, res, next) => {
    try {
        // console.log(req);

        const file = req.files;
        // console.log(file);
        const buketName = 'foundersmiddleeast';
        

        const result = await uploadFileToS3(file[0].path, buketName, file[0].filename);
        console.log('url', result.url)
        if (!result) {
            res.status(500).json({
                success: false,
                message: 'Something went wrong while uploading file to S3'
            });
        }
        return res.status(200).json({
            result,
            success: true,
            message: 'File uploaded successfully',
            url: result.url
        });;
    } catch (error) {
        console.log(error);
        next(error);
    }
}
module.exports = { uploadFilesOnS3 };