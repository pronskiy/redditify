import React, { useState, useEffect } from 'react';
import { RedditThread, fetchRedditThread } from '../src/index';

/**
 * Advanced example of using the RedditThread component
 * 
 * This example shows how to:
 * 1. Use the RedditThread component with custom configuration
 * 2. Manually fetch and process Reddit thread data
 * 3. Implement custom controls and theming
 * 4. Handle different view modes
 */
export default function AdvancedExample() {
  const [url, setUrl] = useState('https://www.reddit.com/r/PHP/comments/1m78ww6/morethanone_class_per_file_motoautoload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [commentDepth, setCommentDepth] = useState(5);
  const [showContent, setShowContent] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const inputUrl = (document.getElementById('reddit-url-advanced') as HTMLInputElement).value;
    
    try {
      // Example of manually fetching the thread data
      // You could process or transform the data here before rendering
      const [threadData, commentsData] = await fetchRedditThread(inputUrl);
      console.log('Thread data:', threadData);
      console.log('Comments data:', commentsData);
      
      // Update the URL to render the thread
      setUrl(inputUrl);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setLoading(false);
    }
  };
  
  return (
    <div className={`reddit-example p-4 max-w-4xl mx-auto ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Advanced Reddit Thread Viewer</h1>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2 mb-4">
            <input
              id="reddit-url-advanced"
              type="text"
              defaultValue={url}
              placeholder="Enter Reddit thread URL"
              className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button 
              type="submit" 
              className="bg-reddit-blue text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Load Thread
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <input 
                  type="checkbox" 
                  checked={darkMode} 
                  onChange={(e) => setDarkMode(e.target.checked)}
                  className="rounded"
                />
                <span>Dark Mode</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <input 
                  type="checkbox" 
                  checked={showContent} 
                  onChange={(e) => setShowContent(e.target.checked)}
                  className="rounded"
                />
                <span>Show Post Content</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <input 
                  type="checkbox" 
                  checked={showControls} 
                  onChange={(e) => setShowControls(e.target.checked)}
                  className="rounded"
                />
                <span>Show Comment Controls</span>
              </label>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300">
                <span>Comment Depth: {commentDepth}</span>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={commentDepth} 
                  onChange={(e) => setCommentDepth(parseInt(e.target.value))}
                  className="w-full"
                />
              </label>
            </div>
          </div>
        </form>
        
        {loading ? (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">
            Loading...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
            Error: {error.message}
          </div>
        ) : (
          <div className="bg-reddit-lightGray dark:bg-reddit-darkGray rounded-lg overflow-hidden">
            <RedditThread 
              url={url}
              maxCommentDepth={commentDepth}
              showPostContent={showContent}
              showCommentControls={showControls}
              onError={(err) => setError(err)}
              className="border border-gray-200 dark:border-gray-700"
            />
          </div>
        )}
      </div>
    </div>
  );
}
