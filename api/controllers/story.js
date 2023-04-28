const mongoose = require("mongoose");
const axios = require("axios");
const Fs = require("fs");
const Path = require("path");
const { Configuration, OpenAIApi } = require("openai");

const User = require("../models/user");
const Story = require("../models/story");

const { createRecording } = require("../utils/voice");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.getStories = (req, res, next) => {
  Story.find()
    .select("_id story author picture isVC createdAt")
    .populate({
      path: "author",
      select:
        "_id username email firstname lastname voiceuuid subscriptionData",
    })
    .populate("author.subscriptionData")
    .exec()
    .then((docs) => res.status(200).json(docs))
    .catch((err) => res.status(500).json({ error: err }));
};

exports.getStory = (req, res, next) => {
  Story.find({ _id: req.params.storyId })
    .select("_id story author picture isVC createdAt")
    .populate({
      path: "author",
      select:
        "_id username email firstname lastname voiceuuid subscriptionData",
      populate: { path: "subscriptionData", select: "subscription_plan_id" },
    })
    .exec()
    .then((doc) => {
      res.status(200).json(doc[0]);
    })
    .catch((err) => res.status(500).json({ error: err }));
};

exports.addStory = async (req, res, next) => {
  const openai = new OpenAIApi(configuration);
  const text = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Write me a title and story about ${req.body.subject} in 1000 characters`,
    max_tokens: 2048,
    n: 1,
    stop: null,
    temperature: 0.7,
  });
  const image = await openai.createImage({
    prompt: req.body.subject,
    n: 1,
    size: "1024x1024",
  });
  const imageUrl = image.data.data[0].url;
  const generateRandomString = () => {
    let result = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
  let filename = generateRandomString();
  const path = Path.resolve(__dirname, "images", `${filename}.jpg`);
  const writer = Fs.createWriteStream(path);
  const imageResponse = await axios.get(imageUrl, {
    responseType: "stream",
  });
  imageResponse.data.pipe(writer);
  new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  if (req.body.author === "guest") {
    const story = new Story({
      _id: new mongoose.Types.ObjectId(),
      story: text.data.choices[0].text,
      picture: `${filename}.jpg`,
    });

    story.save().then(() => {
      res.status(200).json({
        message: "Story created",
        _id: story._id,
      });
    });
  } else {
    const story = new Story({
      _id: new mongoose.Types.ObjectId(),
      story: text.data.choices[0].text,
      author: req.body.author,
      picture: `${filename}.jpg`,
    });

    story
      .save()
      .then((story) => {
        User.findOneAndUpdate(
          { _id: req.body.author },
          { voiceuuid: req.body.voiceuuid }
        ).then(() => {
          User.findByIdAndUpdate(req.body.author, {
            $push: { stories: story._id },
          }).then(() => {
            res.status(200).json({
              message: "Story created",
              _id: story._id,
            });
          });
        });
      })
      .catch((err) => res.status(500).json({ error: err }));
  }
};

exports.getAudio = async (req, res, next) => {
  const { storyId, voiceuuid } = req.body;

  var subject = "hello this is a test from the server";

  let response = await createRecording({ subject, voiceuuid });

  Fs.writeFile(
    `./api/controllers/audios/${storyId}.mp3`,
    Buffer.from(response.data),
    { flag: "wx" },
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
      User.findOneAndUpdate({ _id: storyId }, { isVC: true }).then(() => {
        res.status(200).json({
          message: "Done",
        });
      });
    }
  );
};

exports.updateStory = (req, res, next) => {
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }

  Story.update({ _id: req.params.storyId }, { $set: updateOps })
    .exec()
    .then(() => {
      res.status(200).json({
        message: "Story updated",
      });
    })
    .catch((err) => res.status(500).json({ error: err }));
};

exports.deleteStory = (req, res, next) => {
  Story.deleteOne({ _id: req.params.storyId })
    .exec()
    .then((result) => res.status(200).json({ message: "Story deleted" }))
    .catch((err) => res.status(500).json({ error: err }));
};
