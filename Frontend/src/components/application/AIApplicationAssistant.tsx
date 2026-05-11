import { useState } from 'react';
import { 
  Sparkles, Wand2, RefreshCw, Copy, Check, 
  Settings, Loader2, AlertCircle, Lightbulb, Languages 
} from 'lucide-react';
import { generateCoverLetter, generateProposal, improveContent } from '../../api/ai/aiService';
import { translateJobToAmharic, translateProfileToAmharic } from '../../api/ai/translationApi';

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

interface AIAssistantProps {
  talentProfile: TalentProfile;
  jobDetails: JobDetails;
  onContentGenerated: (content: string, type: 'cover_letter' | 'proposal') => void;
  darkMode: boolean;
}

export default function AIApplicationAssistant({ 
  talentProfile, 
  jobDetails, 
  onContentGenerated, 
  darkMode 
}: AIAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [contentType, setContentType] = useState<'cover_letter' | 'proposal'>('cover_letter');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'confident'>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [language, setLanguage] = useState<'english' | 'amharic'>('english');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleGenerate = async (type: 'cover_letter' | 'proposal') => {
    setIsGenerating(true);
    setError(null);
    setContentType(type);

    try {
      let profileToUse = talentProfile;
      let jobToUse = jobDetails;

      // Skip translation for now due to API issues
      // TODO: Re-enable when Gemini API is stable
      /*
      if (language === 'amharic') {
        setError('Translating to Amharic...');
        const [translatedProfile, translatedJob] = await Promise.all([
          translateProfileToAmharic(talentProfile),
          translateJobToAmharic(jobDetails)
        ]);
        profileToUse = translatedProfile;
        jobToUse = translatedJob;
        setError(null);
      }
      */

      const request = {
        talentProfile: profileToUse,
        jobDetails: jobToUse,
        type,
        tone,
        length: type === 'cover_letter' ? length : 'long',
        language
      };

      const response = type === 'cover_letter' 
        ? await generateCoverLetter(request)
        : await generateProposal(request);

      setGeneratedContent(response.content);
      
      // Show which provider was used
      if (response.provider) {
        console.log(`Content generated using: ${response.provider}`);
        // Show user-friendly message about provider
        if (response.provider === 'fallback') {
          setError('Using offline mode - AI services temporarily unavailable');
          setTimeout(() => setError(null), 3000);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprove = async (improvementType: 'tone' | 'length' | 'clarity' | 'impact') => {
    if (!generatedContent) return;

    setIsImproving(true);
    setError(null);

    try {
      const improved = await improveContent(generatedContent, improvementType, tone);
      setGeneratedContent(improved);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImproving(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const handleUseContent = () => {
    if (generatedContent) {
      onContentGenerated(generatedContent, contentType);
    }
  };

  const cardClass = darkMode 
    ? "bg-gray-800 border-gray-700" 
    : "bg-white border-gray-200";
  
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const mutedClass = darkMode ? "text-gray-400" : "text-gray-600";
  const inputClass = darkMode 
    ? "bg-gray-700 border-gray-600 text-white" 
    : "bg-white border-gray-300 text-gray-900";

  return (
    <div className={`p-6 rounded-xl border ${cardClass} mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className={`font-semibold ${textClass}`}>AI Application Assistant</h3>
            <p className={`text-sm ${mutedClass}`}>Generate personalized cover letters and proposals</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
        >
          <Settings className={`w-4 h-4 ${mutedClass}`} />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`p-4 rounded-lg border mb-4 ${
          darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
        }`}>
          <h4 className={`font-medium mb-3 ${textClass}`}>Generation Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                <div className="flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  Language
                </div>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${inputClass}`}
              >
                <option value="english">English</option>
                <option value="amharic">አማርኛ (Amharic)</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${textClass}`}>Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${inputClass}`}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="confident">Confident</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${textClass}`}>Length (Cover Letter)</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${inputClass}`}
              >
                <option value="short">Short (150-200 words)</option>
                <option value="medium">Medium (250-350 words)</option>
                <option value="long">Long (400-500 words)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Generation Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => handleGenerate('cover_letter')}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
        >
          {isGenerating && contentType === 'cover_letter' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Generate Cover Letter
        </button>
        
        <button
          onClick={() => handleGenerate('proposal')}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
        >
          {isGenerating && contentType === 'proposal' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Generate Proposal
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-3 rounded-lg border mb-4 ${
          error.includes('Translating') || error.includes('offline mode')
            ? darkMode ? "bg-blue-900/20 border-blue-700 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-600"
            : darkMode ? "bg-red-900/20 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-600"
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
          {language === 'amharic' && !error.includes('offline mode') && (
            <p className="text-xs mt-1 opacity-75">
              Note: Amharic translation temporarily unavailable. Content will be generated in English.
            </p>
          )}
        </div>
      )}

      {/* Generated Content */}
      {generatedContent && (
        <div className={`border rounded-lg ${
          darkMode ? "border-gray-600" : "border-gray-200"
        }`}>
          <div className={`flex items-center justify-between p-3 border-b ${
            darkMode ? "border-gray-600" : "border-gray-200"
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className={`font-medium ${textClass}`}>
                Generated {contentType === 'cover_letter' ? 'Cover Letter' : 'Proposal'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${textClass} mb-4`}>
              {generatedContent}
            </div>
            
            {/* Improvement Options */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs ${mutedClass}`}>Improve:</span>
              {[
                { type: 'tone', label: 'Tone', icon: '🎭' },
                { type: 'length', label: 'Length', icon: '📏' },
                { type: 'clarity', label: 'Clarity', icon: '💡' },
                { type: 'impact', label: 'Impact', icon: '🚀' }
              ].map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => handleImprove(type as any)}
                  disabled={isImproving}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    darkMode 
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  } disabled:opacity-50`}
                >
                  {isImproving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>{icon}</span>
                  )}
                  {label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleUseContent}
                className="flex items-center gap-2 px-4 py-2 bg-[#0084ca] text-white rounded-lg hover:bg-[#006ba6] transition-colors"
              >
                <Check className="w-4 h-4" />
                Use This {contentType === 'cover_letter' ? 'Cover Letter' : 'Proposal'}
              </button>
              
              <button
                onClick={() => handleGenerate(contentType)}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {!generatedContent && !isGenerating && (
        <div className={`p-3 rounded-lg ${
          darkMode ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-200"
        }`}>
          <div className="flex items-start gap-2">
            <Lightbulb className={`w-4 h-4 mt-0.5 ${
              darkMode ? "text-blue-300" : "text-blue-600"
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                darkMode ? "text-blue-300" : "text-blue-700"
              }`}>
                AI Tips for Better Results
              </p>
              <ul className={`text-xs mt-1 space-y-1 ${
                darkMode ? "text-blue-200" : "text-blue-600"
              }`}>
                <li>• Make sure your profile is complete with relevant skills and experience</li>
                <li>• The AI will analyze the job requirements to create personalized content</li>
                <li>• You can regenerate content multiple times to get different variations</li>
                <li>• Use the improvement options to fine-tune the generated content</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}