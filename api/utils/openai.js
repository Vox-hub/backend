const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.sendPrompt = async (openaiKey, history, model) => {
  try {
    const configuration = new Configuration({
      apiKey: openaiKey,
    });

    const clientOpenai = new OpenAIApi(configuration);

    const chatCompletion = await clientOpenai.createChatCompletion({
      model: model,
      messages: history,
    });

    return chatCompletion.data;
  } catch (err) {
    console.log(err);
  }
};

exports.transcribe = async (filename, language) => {
  try {
    const response = await openai.createTranscription(
      fs.createReadStream(filename),
      "whisper-1",
      language
    );

    return response.data.text;
  } catch (err) {
    console.log(err.response);
  }
};
