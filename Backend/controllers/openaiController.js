const OpenAI = require("openai");
require("dotenv").config(); // Ensure this is at the VERY top

exports.chat = async (req, res) => {
  // Debug: This will print to your terminal to verify the key is loaded
  // console.log("Key Check:", process.env.OPENAI_API_KEY ? "Found" : "Missing");

  console.log("Key Check:", process.env.OPENAI_API_KEY);
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "API Key is missing. Check your .env file.",
    });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o", // Ensure you use a valid model name
      messages: [
        {
          role: "user",
          content: "Write a one-sentence bedtime story about a unicorn.",
        },
      ],
    });

    res.status(200).json({
      story: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("OpenAI API Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
