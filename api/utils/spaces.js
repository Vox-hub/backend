const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutBucketLifecycleConfigurationCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const { aws_access_key, aws_secret_access_key } = process.env;

const s3Client = new S3Client({
  endpoint: "https://s3.amazonaws.com",
  forcePathStyle: false,
  region: "us-east-1",
  credentials: {
    accessKeyId: aws_access_key,
    secretAccessKey: aws_secret_access_key,
  },
});

exports.uploadMulter = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: "voxhub",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    Expires: new Date(Date.now() + 6 * 60 * 60 * 1000),
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `user/${Date.now()}.${file.originalname.split(".").pop()}`);
    },
  }),
});

exports.getFile = async (params) => {
  try {
    const { Body } = await s3Client.send(new GetObjectCommand(params));
    return Body;
  } catch (error) {
    console.error("Error occurred while fetching S3 object:", error);
    throw error;
  }
};

exports.uploadFile = async ({ params }) => {
  try {
    const data = await s3Client.send(new PutObjectCommand(params));

    return data;
  } catch (err) {
    console.log("Error", err);
  }
};

exports.deleteFile = async (key) => {
  try {
    let params = { Bucket: "voxhub", Key: key };

    const data = await s3Client.deleteObject(params);

    return data;
  } catch (err) {
    return err;
  }
};
