import OpenAI from "openai";

const openai = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export default openai;
