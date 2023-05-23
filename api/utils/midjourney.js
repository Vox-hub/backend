const axios = require("axios");

const midjourney = axios.create({
  baseURL: "https://api.thenextleg.io/v2",
  headers: {
    Authorization: `Bearer ${process.env.MIDJOURNEY_API_KEY}`,
  },
});

exports.imagine = async (data) => {
  try {
    const response = await midjourney.post("/imagine", data);

    return response.data;
  } catch (err) {
    return err;
  }
};

exports.upscale = async (data) => {
  try {
    const response = await midjourney.post("/button", data);

    return response.data;
  } catch (err) {
    return err;
  }
};

exports.result = async (resultId) => {
  try {
    const response = await midjourney.post("/result", { resultId: resultId });

    return response.data;
  } catch (err) {
    return err;
  }
};
