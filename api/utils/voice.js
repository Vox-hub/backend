const axios = require("axios");

const labs = axios.create({
  baseURL: "https://api.elevenlabs.io/v1",
  headers: {
    "xi-api-key": process.env.ELEVENLABS_API_KEY,
  },
});

exports.createRecording = async ({ subject, voiceuuid }) => {
  // prettier-ignore
  try {
    const response = await labs.post(
      `/text-to-speech/${voiceuuid}`,
      {
        text: subject,
        model_id: "eleven_monolingual_v1",
      },
      // {
      //   headers: {
      //     Accept: "audio/mpeg",
      //   },
      //   responseType: "arraybuffer",
      // }
    );

  return response;
  } catch (err) {
    console.log(err)
  }
};
