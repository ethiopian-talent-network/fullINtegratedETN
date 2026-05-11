import { generateCoverLetter as openaiGenerateCoverLetter, generateProposal as openaiGenerateProposal, improveContent as openaiImproveContent } from './openaiApi';
import { generateCoverLetter as geminiGenerateCoverLetter, generateProposal as geminiGenerateProposal, improveContent as geminiImproveContent } from './geminiApi';
import { generateCoverLetter as fallbackGenerateCoverLetter, generateProposal as fallbackGenerateProposal, improveContent as fallbackImproveContent } from './fallbackApi';

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
  provider?: string;
}

// Configuration for AI providers
const AI_CONFIG = {
  preferredProvider: 'fallback', // Using fallback due to API issues
  enableFallback: true,
  timeout: 30000, // 30 seconds
  skipFailingProviders: true, // Skip providers that consistently fail
};

// Check if API keys are available
const hasOpenAIKey = !!import.meta.env.VITE_OPENAI_API_KEY;
const hasGeminiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

console.log('AI Service initialized:', {
  hasOpenAIKey,
  hasGeminiKey,
  preferredProvider: AI_CONFIG.preferredProvider
});

export const generateCoverLetter = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  const providers = getAvailableProviders();
  
  for (const provider of providers) {
    try {
      console.log(`Attempting to generate cover letter with ${provider}...`);
      
      let response: GenerateContentResponse;
      
      switch (provider) {
        case 'openai':
          response = await openaiGenerateCoverLetter(request);
          break;
        case 'gemini':
          response = await geminiGenerateCoverLetter(request);
          break;
        case 'fallback':
          response = await fallbackGenerateCoverLetter(request);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
      
      return { ...response, provider };
      
    } catch (error: any) {
      console.warn(`${provider} failed:`, error.message);
      
      // If this is the last provider, throw the error
      if (provider === providers[providers.length - 1]) {
        throw new Error(`All AI providers failed. Last error: ${error.message}`);
      }
      
      // Continue to next provider
      continue;
    }
  }
  
  throw new Error('No AI providers available');
};

export const generateProposal = async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
  const providers = getAvailableProviders();
  
  for (const provider of providers) {
    try {
      console.log(`Attempting to generate proposal with ${provider}...`);
      
      let response: GenerateContentResponse;
      
      switch (provider) {
        case 'openai':
          response = await openaiGenerateProposal(request);
          break;
        case 'gemini':
          response = await geminiGenerateProposal(request);
          break;
        case 'fallback':
          response = await fallbackGenerateProposal(request);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
      
      return { ...response, provider };
      
    } catch (error: any) {
      console.warn(`${provider} failed:`, error.message);
      
      // If this is the last provider, throw the error
      if (provider === providers[providers.length - 1]) {
        throw new Error(`All AI providers failed. Last error: ${error.message}`);
      }
      
      // Continue to next provider
      continue;
    }
  }
  
  throw new Error('No AI providers available');
};

export const improveContent = async (
  originalContent: string,
  improvementType: 'tone' | 'length' | 'clarity' | 'impact',
  targetTone?: string
): Promise<string> => {
  const providers = getAvailableProviders();
  
  for (const provider of providers) {
    try {
      console.log(`Attempting to improve content with ${provider}...`);
      
      let improvedContent: string;
      
      switch (provider) {
        case 'openai':
          improvedContent = await openaiImproveContent(originalContent, improvementType, targetTone);
          break;
        case 'gemini':
          improvedContent = await geminiImproveContent(originalContent, improvementType, targetTone);
          break;
        case 'fallback':
          improvedContent = await fallbackImproveContent(originalContent, improvementType, targetTone);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
      
      return improvedContent;
      
    } catch (error: any) {
      console.warn(`${provider} failed:`, error.message);
      
      // If this is the last provider, throw the error
      if (provider === providers[providers.length - 1]) {
        throw new Error(`All AI providers failed. Last error: ${error.message}`);
      }
      
      // Continue to next provider
      continue;
    }
  }
  
  throw new Error('No AI providers available');
};

// Helper function to determine available providers in order of preference
function getAvailableProviders(): string[] {
  const providers: string[] = [];
  
  // If skipFailingProviders is enabled and preferred is fallback, use only fallback
  if (AI_CONFIG.skipFailingProviders && AI_CONFIG.preferredProvider === 'fallback') {
    providers.push('fallback');
    return providers;
  }
  
  // Add preferred provider first if available
  if (AI_CONFIG.preferredProvider === 'openai' && hasOpenAIKey) {
    providers.push('openai');
  } else if (AI_CONFIG.preferredProvider === 'gemini' && hasGeminiKey) {
    providers.push('gemini');
  }
  
  // Add other available providers
  if (hasGeminiKey && !providers.includes('gemini')) {
    providers.push('gemini');
  }
  if (hasOpenAIKey && !providers.includes('openai')) {
    providers.push('openai');
  }
  
  // Always add fallback as last resort
  if (AI_CONFIG.enableFallback) {
    providers.push('fallback');
  }
  
  return providers;
}

// Utility function to test AI service
export const testAIService = async (): Promise<{ success: boolean; provider?: string; error?: string }> => {
  try {
    const testRequest: GenerateContentRequest = {
      talentProfile: {
        name: 'Test User',
        skills: ['JavaScript', 'React'],
        experience: 'Mid-level',
        education: 'Computer Science',
        about: 'Test profile',
        location: 'Ethiopia'
      },
      jobDetails: {
        title: 'Frontend Developer',
        description: 'Test job',
        requirements: 'React experience',
        company: 'Test Company',
        location: 'Remote',
        experience: 'Mid-level'
      },
      type: 'cover_letter',
      tone: 'professional',
      length: 'short'
    };
    
    const result = await generateCoverLetter(testRequest);
    return { success: true, provider: result.provider };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export { AI_CONFIG };