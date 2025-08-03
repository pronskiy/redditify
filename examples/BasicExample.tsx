import React, { useState } from 'react';
import { RedditThread } from '../src/index';

/**
 * Basic example of using the RedditThread component
 * 
 * This example shows how to:
 * 1. Use the RedditThread component with a URL
 * 2. Handle loading state and errors
 * 3. Allow users to input their own Reddit thread URL
 */
export default function BasicExample() {
  const [url, setUrl] = useState('https://www.reddit.com/r/PHP/comments/1m78ww6/morethanone_class_per_file_motoautoload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // In a real app, you might want to validate the URL here
    const inputUrl = (document.getElementById('reddit-url') as HTMLInputElement).value;
    setUrl(inputUrl);
    setLoading(false);
  };
  
  return (
    <div className="reddit-example p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reddit Thread Viewer Example</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            id="reddit-url"
            type="text"
            defaultValue={url}
            placeholder="Enter Reddit thread URL"
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button 
            type="submit" 
            className="bg-reddit-blue text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Load Thread
          </button>
        </div>
      </form>
      
      {loading ? (
        <div className="p-4 bg-gray-100 rounded">Loading...</div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error: {error.message}
        </div>
      ) : (
        <RedditThread 
          url={url}
          maxCommentDepth={5}
          showPostContent={true}
          showCommentControls={true}
          onError={(err) => setError(err)}
        />
      )}
    </div>
  );
}
