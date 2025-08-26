const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
require("../../config/config");

const REGION = global.gConfig.awsS3.region || "eu-north-1"; // Ensure region is set
const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: global.gConfig.awsS3.accessKeyId,
        secretAccessKey: global.gConfig.awsS3.accessKey
    }
});

async function uploadFileToS3(filePath, bucketName, folderName, fileName) {
    try {
        const fileContent = fs.readFileSync(filePath);
        folderName = folderName.replace(/^\/+|\/+$/g, "");
        const keyName = `${folderName}/${fileName}`;

        const params = {
            Bucket: bucketName,
            Key: keyName,
            Body: fileContent,
            ACL: "public-read"
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);

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
