import { uploadFileToS3 } from "../helper/uploadFiles";
export const uploadFilesOnS3 = async (req, res, next) => {
    try {
        // console.log(req);

        const file = req.files;
        // console.log(file);
        const buketName = '';
        const key = req.body.keyId;

        const result = await uploadFileToS3(file[0].path, buketName, key, file[0].filename);
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