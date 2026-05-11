import { useState } from 'react';

export default function SimpleAITest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testGeminiDirect = async () => {
    setTesting(true);
    setError('');
    setResult('');

    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

    console.log('API Key:', GEMINI_API_KEY ? 'Present' : 'Missing');
    console.log('API Key length:', GEMINI_API_KEY?.length || 0);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Write a short professional greeting."
            }]
          }]
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        setError(`API Error ${response.status}: ${responseText}`);
        return;
      }

      const data = JSON.parse(responseText);
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText) {
        setResult(generatedText);
      } else {
        setError('No content in response: ' + JSON.stringify(data, null, 2));
      }

    } catch (err: any) {
      console.error('Full error:', err);
      setError(`Network/Parse Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Simple Gemini API Test</h2>
      
      <button
        onClick={testGeminiDirect}
        disabled={testing}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Test Gemini API Direct'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <pre className="text-sm whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-bold">Success!</h3>
          <p className="mt-2">{result}</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-100 rounded">
        <h3 className="font-bold mb-2">Check Browser Console (F12) for detailed logs</h3>
        <p className="text-sm">This test will show the exact API response and any errors.</p>
      </div>
    </div>
  );
}