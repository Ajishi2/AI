import { useState } from 'react';
import { Lightbulb, Loader2, AlertCircle, Check } from 'lucide-react';

interface AiSuggestionProps {
  onSuggestion: (suggestion: string) => void;
  onCreateTask: (task: {
    title: string;
    description: string;
    status: 'todo';
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    user_id: string;
  }) => Promise<void>;
}

export default function AiSuggestion({ onSuggestion, onCreateTask }: AiSuggestionProps) {
  const [description, setDescription] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cleanSuggestion = (text: string) => {
    return text.replace(/\*\*/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuggestion('');
    setSuccessMessage(null);

    try {
      const response = await fetch('https://ai-rcan.onrender.com/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI suggestion. Please try again.');
      }

      const data = await response.json();
      const cleanedSuggestion = cleanSuggestion(data.suggestion);
      setSuggestion(cleanedSuggestion);
      onSuggestion(cleanedSuggestion);
    } catch (err) {
      console.error('AI Suggestion Error:', err);
      setError('Failed to get AI suggestion. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    setIsCreatingTask(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const title = suggestion.split('\n')[0].replace('Task:', '').trim();
      const cleanedDescription = cleanSuggestion(suggestion);

      await onCreateTask({
        title,
        description: cleanedDescription,
        status: 'todo',
        priority: 'medium',
        due_date: new Date().toISOString(),
        user_id: 'test123',
      });

      setSuccessMessage('Task created successfully!');

      setTimeout(() => {
        setDescription('');
        setSuggestion('');
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Create Task Error:', error);
      setError('Failed to create task from suggestion');
    } finally {
      setIsCreatingTask(false);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
        <div className="flex items-center">
          <Lightbulb className="h-6 w-6 text-yellow-300 mr-2" />
          <h2 className="text-xl font-semibold text-white">AI Task Assistant</h2>
        </div>
        <p className="text-blue-100 mt-1 text-sm">
          Describe what you need to do, and I&apos;ll help create a task for you
        </p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
              What do you need help with?
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., I need to prepare a presentation for next week's meeting..."
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start" role="alert">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center" role="alert">
              <Check className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isLoading || !description.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Lightbulb className="h-5 w-5 mr-2" />
                Get AI Suggestion
              </>
            )}
          </button>
        </form>

        {suggestion && (
          <div className="mt-6 rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
              <h3 className="font-semibold text-blue-800">AI Suggestion:</h3>
            </div>
            <div className="bg-white border border-blue-100 rounded-b-lg shadow-sm">
              <div className="p-4 whitespace-pre-wrap text-gray-700 mb-4">
                {suggestion}
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={handleCreateTask}
                  disabled={isCreatingTask}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isCreatingTask ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Task...
                    </>
                  ) : (
                    'Create Task from Suggestion'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}