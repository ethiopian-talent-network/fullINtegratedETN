const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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
}

interface GenerateContentResponse {
  content: string;
  suggestions?: string[];
}

export const generateCoverLetter = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = createCoverLetterPrompt(request);
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional career advisor helping job seekers write compelling cover letters.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error Response:', errorData);
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      } else if (response.status === 402 || errorData.includes('insufficient_quota')) {
        throw new Error('OpenAI API quota exceeded - please check billing');
      } else if (response.status === 500) {
        throw new Error('OpenAI service temporarily unavailable');
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated from OpenAI API');
    }

    return {
      content: generatedText.trim(),
      suggestions: extractSuggestions(generatedText)
    };
  } catch (error: any) {
    console.error('Error generating content with OpenAI:', error);
    
    // Re-throw with more specific error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to OpenAI API');
    }
    
    throw error;
  }
};

export const generateProposal = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = createProposalPrompt(request);
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional freelance consultant helping create winning project proposals.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.8,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error Response:', errorData);
      
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      } else if (response.status === 402 || errorData.includes('insufficient_quota')) {
        throw new Error('OpenAI API quota exceeded - please check billing');
      } else if (response.status === 500) {
        throw new Error('OpenAI service temporarily unavailable');
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated from OpenAI API');
    }

    return {
      content: generatedText.trim(),
      suggestions: extractSuggestions(generatedText)
    };
  } catch (error: any) {
    console.error('Error generating proposal with OpenAI:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to OpenAI API');
    }
    
    throw error;
  }
};

const createCoverLetterPrompt = (request: GenerateContentRequest): string => {
  const { talentProfile, jobDetails, tone = 'professional', length = 'medium' } = request;
  
  return `Write a ${tone} cover letter for the following job application:

TALENT PROFILE:
- Name: ${talentProfile.name}
- Skills: ${talentProfile.skills.slice(0, 5).join(', ')}
- Experience: ${talentProfile.experience}
- Location: ${talentProfile.location}

JOB DETAILS:
- Position: ${jobDetails.title}
- Company: ${jobDetails.company}
- Requirements: ${jobDetails.requirements?.substring(0, 200) || 'Not specified'}

Write a ${length === 'short' ? '150-200' : length === 'medium' ? '250-350' : '400-500'} word cover letter that:
1. Highlights relevant skills and experience
2. Shows enthusiasm for the role
3. Demonstrates value to the company
4. Uses a ${tone} tone
5. Ends with a strong call to action

Write only the cover letter content without additional formatting.`;
};

const createProposalPrompt = (request: GenerateContentRequest): string => {
  const { talentProfile, jobDetails, tone = 'professional' } = request;
  
  return `Write a project proposal for the following freelance opportunity:

TALENT PROFILE:
- Name: ${talentProfile.name}
- Skills: ${talentProfile.skills.slice(0, 5).join(', ')}
- Experience: ${talentProfile.experience}

PROJECT DETAILS:
- Project: ${jobDetails.title}
- Company: ${jobDetails.company}
- Requirements: ${jobDetails.requirements?.substring(0, 300) || 'Not specified'}

Write a detailed proposal (500-800 words) that includes:
1. Understanding of project requirements
2. Proposed approach and methodology
3. Timeline and deliverables
4. Why you're the right fit
5. Value proposition

Use a ${tone} tone and structure it professionally. Write only the proposal content.`;
};

const extractSuggestions = (text: string): string[] => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 3).map(s => s.trim());
};

export const improveContent = async (
  originalContent: string, 
  improvementType: 'tone' | 'length' | 'clarity' | 'impact',
  targetTone?: string
): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Improve the following ${originalContent.length > 500 ? 'proposal' : 'cover letter'} by focusing on ${improvementType}:

ORIGINAL CONTENT:
${originalContent}

IMPROVEMENT FOCUS: ${improvementType}
${improvementType === 'tone' ? `Make it more ${targetTone || 'professional'}` : ''}
${improvementType === 'length' ? 'Make it more concise' : ''}
${improvementType === 'clarity' ? 'Improve clarity and readability' : ''}
${improvementType === 'impact' ? 'Make it more impactful and persuasive' : ''}

Provide only the improved version.`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional editor helping improve job application content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.6,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error Response:', errorData);
      
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      } else if (response.status === 402 || errorData.includes('insufficient_quota')) {
        throw new Error('OpenAI API quota exceeded - please check billing');
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const improvedText = data.choices?.[0]?.message?.content;

    if (!improvedText) {
      throw new Error('No improved content generated');
    }

    return improvedText.trim();
  } catch (error: any) {
    console.error('Error improving content:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to OpenAI API');
    }
    
    throw error;
  }
};