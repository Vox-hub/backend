const mongoose = require("mongoose");
const Fs = require("fs");
const { promisify } = require("util");
const ffprobe = promisify(require("ffprobe"));
const ffprobeStatic = require("ffprobe-static");
const User = require("../models/user");
const Request = require("../models/request");
const Subscription = require("../models/subscription");
const { transcribe, sendPrompt } = require("../utils/openai");
const { uploadFile } = require("../utils/spaces");
const { createRecording } = require("../utils/voice");

// determine language for polly
function findLanguage(l) {
  if (l === "en") {
    return "en-US";
  } else if (l === "ar") {
    return "arb";
  } else if (l === "fr") {
    return "fr-FR";
  }
}

// get history

function getHistory(chat, prompt) {
  let history = [];

  if (chat) {
    chat.forEach((element) => {
      const { text, prompt } = element;

      history.push({ role: "user", content: prompt });
      history.push({ role: "assistant", content: text });
    });
  }

  history.push({ role: "user", content: prompt });

  return history;
}

async function getAudioDuration(filePath) {
  try {
    const info = await ffprobe(filePath, { path: ffprobeStatic.path });
    const audioStream = info.streams.find(
      (stream) => stream.codec_type === "audio"
    );
    return audioStream.duration;
  } catch (err) {
    console.error("Error getting audio duration:", err);
    throw err;
  }
}

exports.createRequestText = async (req, res) => {
  let { prompt, voiceId, language, model, userId } = req.body;

  try {
    const user = await User.findById(userId)
      .select("openai_key subscription chat")
      .populate({
        path: "subscription",
      })
      .populate({
        path: "chat",
      });

    let { openai_key, subscription, chat } = user;
    const { question, answer } = subscription.hours;

    const history = getHistory(chat, prompt);

    const askGPT = await sendPrompt(openai_key, history, model);

    const response = askGPT.choices[0].message.content;

    const audio = {
      Text: response,
      OutputFormat: "mp3",
      VoiceId: voiceId,
      Engine: "standard",
      LanguageCode: findLanguage(language),
    };
    const data = await createRecording(audio);

    const answerPath = `uploads/${askGPT.id}.mp3`;
    Fs.writeFileSync(answerPath, data.AudioStream);

    const params = {
      ACL: "public-read",
      Bucket: "voxhub",
      Key: `answers/${askGPT.id}.mp3`,
      ContentType: "audio/mpeg",
      Body: Fs.createReadStream(answerPath),
    };

    const answer_duration = await getAudioDuration(answerPath);

    let hours = {
      question: question,
      answer: answer - answer_duration / 3600,
    };

    Subscription.findOneAndUpdate({ _id: subscription._id }, { hours })
      .then(async () => {
        await uploadFile({ params }).then(() => {
          const request = new Request({
            _id: new mongoose.Types.ObjectId(),
            answer: `answers/${askGPT.id}.mp3`,
            prompt: prompt,
            text: response,
            sent_by: userId,
          });

          request
            .save()
            .then(async () => {
              await User.findByIdAndUpdate(userId, {
                $push: { chat: request._id },
              }).then(() => {
                Fs.unlinkSync(answerPath);
                res.status(200).json(request);
              });
              [];
            })
            .catch((err) => {
              res.status(500).json({ error: `Failed saving to db ${err}` });
            });
        });
      })
      .catch((err) => {
        res.status(500).json({ error: `Failed billings ours ${err}` });
      });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.createRequestAudio = async (req, res) => {
  let { voiceId, question_duration, language, model, userId } = req.body;

  try {
    const user = await User.findById(userId)
      .select("openai_key subscription")
      .populate({
        path: "subscription",
      });

    let { openai_key, subscription, chat } = user;
    const { question, answer } = subscription.hours;
    const filename = `uploads/${req.file.filename}`;

    // transcribing the prompt
    const prompt = await transcribe(filename, language);

    const history = getHistory(chat, prompt);

    // sending the prompt
    const askGPT = await sendPrompt(openai_key, history, model);

    // chatgpt response
    const response = askGPT.choices[0].message.content;

    // using text to speech for response
    const audio = {
      Text: response,
      OutputFormat: "mp3",
      VoiceId: voiceId,
      Engine: "standard",
      LanguageCode: findLanguage(language),
    };
    const data = await createRecording(audio);

    // saving it to s3 bucket
    const answerPath = `uploads/${askGPT.id}.mp3`;
    Fs.writeFileSync(answerPath, data.AudioStream);

    const params = {
      ACL: "public-read",
      Bucket: "voxhub",
      Key: `answers/${askGPT.id}.mp3`,
      ContentType: "audio/mpeg",
      Body: Fs.createReadStream(answerPath),
    };

    const answer_duration = await getAudioDuration(answerPath);

    let hours = {
      question: question - question_duration / 3600,
      answer: answer - answer_duration / 3600,
    };

    Subscription.findOneAndUpdate({ _id: subscription._id }, { hours })
      .then(async () => {
        await uploadFile({ params }).then(async () => {
          const params = {
            ACL: "public-read",
            Bucket: "voxhub",
            Key: `questions/${req.file.filename}`,
            ContentType: "audio/mpeg",
            Body: Fs.createReadStream(filename),
          };

          await uploadFile({ params }).then(async () => {
            const request = new Request({
              _id: new mongoose.Types.ObjectId(),
              question: `questions/${req.file.filename}`,
              answer: `answers/${askGPT.id}.mp3`,
              prompt: prompt,
              text: response,
              sent_by: userId,
            });

            request
              .save()
              .then(async () => {
                await User.findByIdAndUpdate(userId, {
                  $push: { chat: request._id },
                }).then(() => {
                  Fs.unlinkSync(answerPath);
                  Fs.unlinkSync(filename);
                  res.status(200).json(request);
                });
              })
              .catch((err) => {
                res.status(500).json({ error: `Failed saving to db ${err}` });
              });
          });
        });
      })
      .catch((err) => {
        res.status(500).json({ error: `Failed billings ours ${err}` });
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to process the file" });
  }
};
