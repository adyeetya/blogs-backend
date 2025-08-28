const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
require("../config/config");

const REGION = "ap-south-1"; // Ensure region is set
const s3Client = new S3Client({
    region: REGION,
    credentials: {
        // accessKeyId: global.gConfig.awsS3.accessKeyId,
        accessKeyId:'AKIASZDUDMKXNYO67K5C',
        // secretAccessKey: global.gConfig.awsS3.accessKey
        secretAccessKey:'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'
    }});
console.log('s3 client cred>>>>', global.gConfig.awsS3.accessKeyId, global.gConfig.awsS3.accessKey)
async function uploadFileToS3(filePath, bucketName, fileName) {
    try {
        const fileContent = fs.readFileSync(filePath);

        const keyName = `${fileName}`;
        console.log('keyname', keyName)
        const params = {
            Bucket: bucketName,
            Key: keyName,
            Body: fileContent,
            // ACL: "public-read"
        };
        console.log('params')
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        console.log('file uploaded')
        return {
            success: true,
            message: "File uploaded successfully",
            url: `https://${bucketName}.s3.${REGION}.amazonaws.com/${keyName}`
        };
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw error;
    }
}

module.exports = { uploadFileToS3 };
