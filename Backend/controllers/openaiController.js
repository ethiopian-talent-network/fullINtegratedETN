const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.generateContent = async (req, res) => {
  try {
    const { prompt, type = 'cover_letter', maxTokens = 800 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const systemMessage = type === 'cover_letter' 
      ? "You are a professional career advisor helping job seekers write compelling cover letters."
      : "You are a professional freelance consultant helping create winning project proposals.";

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return res.status(500).json({ error: "No content generated" });
    }

    res.json({ 
      content: content.trim(),
      type,
      success: true 
    });

  } catch (error) {
    console.error("OpenAI API Error:", error.message);
    res.status(500).json({ 
      error: error.message || "Failed to generate content",
      success: false 
    });
  }
};

exports.improveContent = async (req, res) => {
  try {
    const { content, improvementType, targetTone } = req.body;

    if (!content || !improvementType) {
      return res.status(400).json({ error: "Content and improvement type are required" });
    }

    const prompt = `Improve the following content by focusing on ${improvementType}:

${content}

Improvement focus: ${improvementType}
${improvementType === 'tone' ? `Make it more ${targetTone || 'professional'}` : ''}
${improvementType === 'length' ? 'Make it more concise' : ''}
${improvementType === 'clarity' ? 'Improve clarity and readability' : ''}
${improvementType === 'impact' ? 'Make it more impactful and persuasive' : ''}

Provide only the improved version.`;

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a professional editor helping improve job application content." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.6,
    });

    const improvedContent = response.choices[0]?.message?.content;
    
    if (!improvedContent) {
      return res.status(500).json({ error: "No improved content generated" });
    }

    res.json({ 
      content: improvedContent.trim(),
      success: true 
    });

  } catch (error) {
    console.error("OpenAI Improve Error:", error.message);
    res.status(500).json({ 
      error: error.message || "Failed to improve content",
      success: false 
    });
  }
};

// Legacy chat endpoint for backward compatibility
exports.chat = async (req, res) => {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
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
