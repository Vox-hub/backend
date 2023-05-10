const mongoose = require("mongoose");
const axios = require("axios");
const Fs = require("fs");
const Path = require("path");
const { Configuration, OpenAIApi } = require("openai");

const User = require("../models/user");
const Story = require("../models/story");
const Subscription = require("../models/subscription");

const { uploadFile } = require("../utils/spaces");
const { createRecording } = require("../utils/voice");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.getStories = (req, res, next) => {
  Story.find()
    .select("_id story author picture isVC createdAt")
    .populate({
      path: "author",
      select: "_id username email firstname lastname subscriptionData",
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
      select: "_id username email firstname lastname subscriptionData",
      populate: {
        path: "subscriptionData",
        select: "subscription_plan_id stories_ttv",
      },
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

  const path = Path.resolve(`temp/${filename}.jpg`);
  const writer = Fs.createWriteStream(path);
  const imageResponse = await axios.get(imageUrl, {
    responseType: "stream",
  });
  imageResponse.data.pipe(writer);
  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  const fileContent = Fs.readFileSync(path);

  const params = {
    ACL: "public-read",
    Bucket: "storytalk",
    Key: `stories/${filename}.jpg`,
    Body: fileContent,
    ContentType: "image/jpg",
  };

  try {
    await uploadFile({ params });

    Fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
      } else {
        if (req.body.author === "guest") {
          const story = new Story({
            _id: new mongoose.Types.ObjectId(),
            story: text.data.choices[0].text,
            picture: `stories/${filename}.jpg`,
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
            picture: `stories/${filename}.jpg`,
          });

          story
            .save()
            .then((story) => {
              User.findByIdAndUpdate(req.body.author, {
                $push: { stories: story._id },
              }).then(() => {
                res.status(200).json({
                  message: "Story created",
                  _id: story._id,
                });
              });
            })
            .catch((err) => res.status(500).json({ error: err }));
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
};

exports.getAudio = async (req, res, next) => {
  const { storyId } = req.params;
  const { voiceId } = req.body;

  try {
    const storyData = await Story.findById(storyId).populate({
      path: "author",
      select: "_id subscriptionData",
      populate: { path: "subscriptionData", select: "_id stories_ttv" },
    });

    if (storyData.isVC) {
      return res
        .status(500)
        .json({ message: "This story already has a recording!" });
    }

    const audio = {
      Text: storyData.story,
      OutputFormat: "mp3",
      VoiceId: voiceId,
    };
    const data = await createRecording(audio);
    const filePath = `temp/${storyId}.mp3`;
    Fs.writeFileSync(filePath, data.AudioStream);

    const params = {
      ACL: "public-read",
      Bucket: "storytalk",
      Key: `recording/${storyId}.mp3`,
      ContentType: "audio/mpeg",
      Body: Fs.createReadStream(filePath),
    };

    await uploadFile({ params });

    Fs.unlink(filePath, async (err) => {
      if (err) {
        console.error(err);
      } else {
        const newCount = storyData.author.subscriptionData.stories_ttv - 1;

        await Story.updateOne({ _id: storyId }, { isVC: true });

        await Subscription.updateOne(
          { _id: storyData.author.subscriptionData._id },
          { stories_ttv: newCount }
        );

        return res
          .status(200)
          .json({ message: "Audio created!", path: params.Key });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err });
  }
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
