const AWS = require("aws-sdk");

const { aws_access_key, aws_secret_access_key } = process.env;

const Polly = new AWS.Polly({
  signatureVersion: "v4",
  region: "us-east-1",
  credentials: {
    accessKeyId: aws_access_key,
    secretAccessKey: aws_secret_access_key,
  },
});

exports.createRecording = async (audio) => {
  let params = audio;

  try {
    const data = await Polly.synthesizeSpeech(params).promise();

    return data;
  } catch (err) {
    console.error(err);
  }
};
