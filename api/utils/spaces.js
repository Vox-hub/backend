const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const { AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY } = process.env;

const s3Client = new S3Client({
  endpoint: "https://nyc3.digitaloceanspaces.com",
  forcePathStyle: false,
  region: "nyc3",
  credentials: {
    accessKeyId: AWS_ACCESS_KEY, // Access key pair. You can create access key pairs using the control panel or API.
    secretAccessKey: AWS_SECRET_ACCESS_KEY, // Secret access key defined through an environment variable.
  },
});

exports.uploadFile = async ({ params }) => {
  try {
    const data = await s3Client.send(new PutObjectCommand(params));

    return data;
  } catch (err) {
    console.log("Error", err);
  }
};
