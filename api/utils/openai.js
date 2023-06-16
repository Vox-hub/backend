const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.sendPrompt = async (prompt) => {
  try {
    const text = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 2048,
      n: 1,
      stop: null,
      temperature: 0.7,
    });

    return text.data;
  } catch (err) {
    return err;
  }
};
