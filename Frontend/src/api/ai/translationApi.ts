const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface TranslationRequest {
  text: string;
  targetLanguage: 'amharic' | 'english';
}

interface TranslationResponse {
  translatedText: string;
}

export const translateText = async (request: TranslationRequest): Promise<TranslationResponse> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Translation API key not configured');
  }

  const { text, targetLanguage } = request;
  
  const prompt = targetLanguage === 'amharic' 
    ? `Translate the following text to Amharic. Only provide the translation, no explanations:\n\n${text}`
    : `Translate the following Amharic text to English. Only provide the translation, no explanations:\n\n${text}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Translation API Error:', errorData);
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translatedText) {
      throw new Error('No translation generated');
    }

    return {
      translatedText: translatedText.trim()
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};

export const translateJobToAmharic = async (jobDetails: {
  title: string;
  description: string;
  requirements: string;
  company: string;
  location: string;
  experience: string;
}) => {
  try {
    const jobText = `Job Title: ${jobDetails.title}
Company: ${jobDetails.company}
Location: ${jobDetails.location}
Experience Level: ${jobDetails.experience}
Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}`;

    const result = await translateText({
      text: jobText,
      targetLanguage: 'amharic'
    });

    // Parse the translated text back into structured format
    const lines = result.translatedText.split('\n');
    return {
      title: lines[0]?.replace(/^[^:]+:\s*/, '') || jobDetails.title,
      company: lines[1]?.replace(/^[^:]+:\s*/, '') || jobDetails.company,
      location: lines[2]?.replace(/^[^:]+:\s*/, '') || jobDetails.location,
      experience: lines[3]?.replace(/^[^:]+:\s*/, '') || jobDetails.experience,
      description: lines[4]?.replace(/^[^:]+:\s*/, '') || jobDetails.description,
      requirements: lines[5]?.replace(/^[^:]+:\s*/, '') || jobDetails.requirements,
    };
  } catch (error) {
    console.error('Job translation error:', error);
    // Return original if translation fails
    return jobDetails;
  }
};

export const translateProfileToAmharic = async (profile: {
  name: string;
  skills: string[];
  experience: string;
  education: string;
  about: string;
  location: string;
}) => {
  try {
    const profileText = `Name: ${profile.name}
Skills: ${profile.skills.join(', ')}
Experience Level: ${profile.experience}
Education: ${profile.education}
About: ${profile.about}
Location: ${profile.location}`;

    const result = await translateText({
      text: profileText,
      targetLanguage: 'amharic'
    });

    // Parse the translated text back into structured format
    const lines = result.translatedText.split('\n');
    return {
      name: lines[0]?.replace(/^[^:]+:\s*/, '') || profile.name,
      skills: lines[1]?.replace(/^[^:]+:\s*/, '').split(/[،,]/).map(s => s.trim()) || profile.skills,
      experience: lines[2]?.replace(/^[^:]+:\s*/, '') || profile.experience,
      education: lines[3]?.replace(/^[^:]+:\s*/, '') || profile.education,
      about: lines[4]?.replace(/^[^:]+:\s*/, '') || profile.about,
      location: lines[5]?.replace(/^[^:]+:\s*/, '') || profile.location,
    };
  } catch (error) {
    console.error('Profile translation error:', error);
    // Return original if translation fails
    return profile;
  }
};

export const batchTranslateToAmharic = async (texts: string[]): Promise<string[]> => {
  try {
    const batchText = texts.map((text, index) => `[${index + 1}] ${text}`).join('\n');
    
    const result = await translateText({
      text: batchText,
      targetLanguage: 'amharic'
    });

    // Split back into individual translations
    const translations = result.translatedText
      .split(/\[\d+\]/)
      .filter(t => t.trim())
      .map(t => t.trim());

    return translations.length === texts.length ? translations : texts;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts;
  }
};