const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface TalentProfile {
  name: string;
  skills: string[];
  experience: string;
  education: string;
  about: string;
  location: string;
}

interface JobDetails {
  title: string;
  description: string;
  requirements: string;
  company: string;
  location: string;
  experience: string;
  salary?: string;
  budget?: string;
}

interface GenerateContentRequest {
  talentProfile: TalentProfile;
  jobDetails: JobDetails;
  type: 'cover_letter' | 'proposal';
  tone?: 'professional' | 'friendly' | 'confident';
  length?: 'short' | 'medium' | 'long';
  language?: 'english' | 'amharic';
}

interface GenerateContentResponse {
  content: string;
  suggestions?: string[];
}

export const generateCoverLetter = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = createCoverLetterPrompt(request);
  
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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error Response:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini API');
    }

    return {
      content: generatedText.trim(),
      suggestions: extractSuggestions(generatedText)
    };
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw new Error('Failed to generate content. Please try again.');
  }
};

export const generateProposal = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = createProposalPrompt(request);
  
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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error Response:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini API');
    }

    return {
      content: generatedText.trim(),
      suggestions: extractSuggestions(generatedText)
    };
  } catch (error) {
    console.error('Error generating proposal with Gemini:', error);
    throw new Error('Failed to generate proposal. Please try again.');
  }
};

const createCoverLetterPrompt = (request: GenerateContentRequest): string => {
  const { talentProfile, jobDetails, tone = 'professional', length = 'medium', language = 'english' } = request;
  
  if (language === 'amharic') {
    return `በአማርኛ ${tone === 'professional' ? 'ሙያዊ' : tone === 'friendly' ? 'ወዳጃዊ' : 'በራስ የመተማመን'} የሽፋን ደብዳቤ ጻፍ።

የተሰጠው መረጃ:
ስም: ${talentProfile.name}
ክህሎቶች: ${talentProfile.skills.slice(0, 5).join(', ')}
ልምድ: ${talentProfile.experience}
ቦታ: ${talentProfile.location}

ስራ: ${jobDetails.title}
ድርጅት: ${jobDetails.company}
መስፈርቶች: ${jobDetails.requirements?.substring(0, 200) || 'አልተገለጸም'}

${length === 'short' ? '150-200' : length === 'medium' ? '250-350' : '400-500'} ቃላት የሽፋን ደብዳቤ ጻፍ። ክህሎቶችን እና ልምድን አጉልተህ አሳይ።`;
  }
  
  return `Write a ${tone} cover letter for ${jobDetails.title} at ${jobDetails.company}.

Talent: ${talentProfile.name}
Skills: ${talentProfile.skills.slice(0, 5).join(', ')}
Experience: ${talentProfile.experience}
Location: ${talentProfile.location}

Job: ${jobDetails.title}
Company: ${jobDetails.company}
Requirements: ${jobDetails.requirements?.substring(0, 200) || 'Not specified'}

Write a ${length === 'short' ? '150-200' : length === 'medium' ? '250-350' : '400-500'} word cover letter highlighting relevant skills and experience.`;
};

const createProposalPrompt = (request: GenerateContentRequest): string => {
  const { talentProfile, jobDetails, tone = 'professional', language = 'english' } = request;
  
  if (language === 'amharic') {
    return `በአማርኛ የፕሮጀክት ሀሳብ ጻፍ።

የተሰጠው መረጃ:
ስም: ${talentProfile.name}
ክህሎቶች: ${talentProfile.skills.slice(0, 5).join(', ')}
ልምድ: ${talentProfile.experience}

ፕሮጀክት: ${jobDetails.title}
ድርጅት: ${jobDetails.company}
መስፈርቶች: ${jobDetails.requirements?.substring(0, 300) || 'አልተገለጸም'}

ዝርዝር የፕሮጀክት ሀሳብ ጻፍ። የስራ አቀራረብ፣ የጊዜ ሰሌዳ እና ለምን ተስማሚ እንደሆንክ አካትት። ${tone === 'professional' ? 'ሙያዊ' : tone === 'friendly' ? 'ወዳጃዊ' : 'በራስ የመተማመን'} ቋንቋ ተጠቀም።`;
  }
  
  return `Write a project proposal for ${jobDetails.title}.

Talent: ${talentProfile.name}
Skills: ${talentProfile.skills.slice(0, 5).join(', ')}
Experience: ${talentProfile.experience}

Project: ${jobDetails.title}
Company: ${jobDetails.company}
Requirements: ${jobDetails.requirements?.substring(0, 300) || 'Not specified'}

Write a detailed proposal including approach, timeline, and why you're the right fit. Use ${tone} tone.`;
};

const extractSuggestions = (text: string): string[] => {
  // Extract key points that could be suggestions for improvement
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 3).map(s => s.trim());
};

export const improveContent = async (
  originalContent: string, 
  improvementType: 'tone' | 'length' | 'clarity' | 'impact',
  targetTone?: string
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `
Improve the following ${originalContent.length > 500 ? 'proposal' : 'cover letter'} by focusing on ${improvementType}:

ORIGINAL CONTENT:
${originalContent}

IMPROVEMENT INSTRUCTIONS:
${improvementType === 'tone' ? `Adjust the tone to be more ${targetTone || 'professional'} while maintaining the core message.` : ''}
${improvementType === 'length' ? 'Make it more concise while keeping all important points.' : ''}
${improvementType === 'clarity' ? 'Improve clarity and readability without changing the length significantly.' : ''}
${improvementType === 'impact' ? 'Make it more impactful and persuasive while maintaining professionalism.' : ''}

Please provide only the improved version without explanations.
`;

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
          temperature: 0.6,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const improvedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!improvedText) {
      throw new Error('No improved content generated');
    }

    return improvedText.trim();
  } catch (error) {
    console.error('Error improving content:', error);
    throw new Error('Failed to improve content. Please try again.');
  }
};