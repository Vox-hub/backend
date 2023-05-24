const mongoose = require("mongoose");
const axios = require("axios");
const Fs = require("fs");
const Path = require("path");
const { Configuration, OpenAIApi } = require("openai");

const User = require("../models/user");
const Story = require("../models/story");
const Subscription = require("../models/subscription");

const { imagine, upscale, result } = require("../utils/midjourney");
const { uploadFile } = require("../utils/spaces");
const { createRecording } = require("../utils/voice");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.getStories = (req, res, next) => {
  Story.find()
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
  let subject = req.body.subject;

  const openai = new OpenAIApi(configuration);

  try {
    const text = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Write me a title and story that will be enjoyable by adults and kids  about ${subject} in 250 words`,
      max_tokens: 2048,
      n: 1,
      stop: null,
      temperature: 0.7,
    });

    if (req.body.author === "guest") {
      const story = new Story({
        _id: new mongoose.Types.ObjectId(),
        story: text.data.choices[0].text,
      });

      story.save().then(async (story) => {
        let data = {
          msg: subject,
          ref: {
            _id: story._id,
          },
        };
        const image = await imagine(data);

        res.status(200).json({
          message: "Story created",
          _id: story._id,
          result: image,
        });
      });
    } else {
      const story = new Story({
        _id: new mongoose.Types.ObjectId(),
        story: text.data.choices[0].text,
        author: req.body.author,
      });

      story
        .save()
        .then(async (story) => {
          let data = {
            msg: subject,
            ref: {
              _id: story._id,
            },
          };
          const image = await imagine(data);
          User.findByIdAndUpdate(req.body.author, {
            $push: { stories: story._id },
          }).then(() => {
            res.status(200).json({
              message: "Story created",
              _id: story._id,
              result: image,
            });
          });
        })
        .catch((err) => res.status(500).json({ error: err }));
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.handleWebhook = async (req, res, next) => {
  let { type, ref } = req.body;

  if (type === "imagine") {
    let { imageUrl, buttons, ref, originatingMessageId, buttonMessageId } =
      req.body;
    let data = {
      imageUrl: imageUrl,
      buttons: buttons,
      buttonMessageId: buttonMessageId,
      originatingMessageId: originatingMessageId,
    };

    await Story.updateOne({ _id: ref._id }, { midjourney_data: data }).then(
      () => {
        res.status(200).json({ message: "Saved!" });
      }
    );
  } else if (type === "button") {
    try {
      const story = await Story.findById(ref._id);

      let imageUrl = req.body.imageUrl;

      // save file temporary
      const path = Path.resolve(`temp/${story._id}.png`);
      const writer = Fs.createWriteStream(path);
      const imageResponse = await axios.get(imageUrl, {
        responseType: "stream",
      });
      imageResponse.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // uploading it to s3
      const fileContent = Fs.readFileSync(path);

      const params = {
        ACL: "public-read",
        Bucket: "storytalk",
        Key: `stories/${story._id}.png`,
        Body: fileContent,
        ContentType: "image/png",
      };

      await uploadFile({ params }).then(() => {
        Fs.unlink(path, async (err) => {
          if (err) {
            console.error(err);
          } else {
            await Story.updateOne(
              { _id: ref._id },
              { picture: `stories/${story._id}.png` }
            ).then(() => res.status(200).json({ message: "Saved image!" }));
          }
        });
      });
    } catch (err) {
      res.status(500).json({ error: err });
    }
  }
};

exports.upscaleImage = async (req, res, next) => {
  const { storyId } = req.params;
  const { button } = req.body;

  try {
    const storyData = await Story.findById(storyId);

    const data = {
      buttonMessageId: storyData.midjourney_data.buttonMessageId,
      button: button,
      ref: {
        _id: storyData._id,
      },
    };

    const response = await upscale(data);

    res.status(200).json({ message: "Sent request!", response: response });
  } catch (err) {
    res.status(500).json({ error: err });
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
      Engine: "neural",
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
        if (storyData?.author?.subscriptionData) {
          const newCount = storyData.author.subscriptionData.stories_ttv - 1;
          await Subscription.updateOne(
            { _id: storyData.author.subscriptionData._id },
            { stories_ttv: newCount }
          );
        }

        await Story.updateOne({ _id: storyId }, { isVC: true });

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
