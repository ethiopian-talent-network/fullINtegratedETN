import { useState } from 'react';
import { generateCoverLetter } from '../api/ai/aiService';

export default function AITest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [provider, setProvider] = useState<string>('');

  const testAPI = async () => {
    setTesting(true);
    setError('');
    setResult('');
    setProvider('');

    try {
      const testRequest = {
        talentProfile: {
          name: 'John Doe',
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: 'Mid-level',
          education: 'Computer Science',
          about: 'Passionate developer',
          location: 'Ethiopia'
        },
        jobDetails: {
          title: 'Frontend Developer',
          description: 'Build web applications',
          requirements: 'React, JavaScript experience required',
          company: 'Tech Company',
          location: 'Remote',
          experience: 'Mid-level'
        },
        type: 'cover_letter' as const,
        tone: 'professional' as const,
        length: 'short' as const
      };

      const response = await generateCoverLetter(testRequest);
      setResult(response.content);
      setProvider(response.provider || 'Unknown');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const hasOpenAIKey = !!import.meta.env.VITE_OPENAI_API_KEY;
  const hasGeminiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">AI Service Test</h2>
      
      {/* API Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded border">
        <h3 className="font-medium mb-2">API Status:</h3>
        <div className="text-sm space-y-1">
          <p className={hasOpenAIKey ? 'text-green-600' : 'text-red-600'}>
            OpenAI: {hasOpenAIKey ? '✓ Configured' : '✗ Not configured'}
          </p>
          <p className={hasGeminiKey ? 'text-green-600' : 'text-red-600'}>
            Gemini: {hasGeminiKey ? '✓ Configured' : '✗ Not configured'}
          </p>
          <p className="text-blue-600">Fallback: ✓ Always available</p>
        </div>
      </div>
      
      <button
        onClick={testAPI}
        disabled={testing}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {testing ? 'Testing AI Service...' : 'Test AI Service'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-bold">Success! Generated Content:</h3>
          {provider && (
            <p className="text-sm text-green-600 mb-2">Provider used: {provider}</p>
          )}
          <p className="mt-2 whitespace-pre-wrap">{result}</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Tries Gemini API first (if configured)</li>
          <li>Falls back to OpenAI API (if configured)</li>
          <li>Uses local fallback as last resort</li>
          <li>Provides seamless experience regardless of provider availability</li>
        </ol>
      </div>
    </div>
  );
}