const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const { SPACES_ACCESS_KEY, SPACES_SECRET_ACCESS_KEY } = process.env;

const s3Client = new S3Client({
  endpoint: "https://nyc3.digitaloceanspaces.com",
  forcePathStyle: false,
  region: "nyc3",
  credentials: {
    accessKeyId: SPACES_ACCESS_KEY,
    secretAccessKey: SPACES_SECRET_ACCESS_KEY,
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
