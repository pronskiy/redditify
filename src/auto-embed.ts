import React from 'react';
import { createRoot } from 'react-dom/client';
import { RedditThread } from './index';
import './styles/globals.css';

/**
 * Auto-embedding script for Reddit Thread Viewer
 * 
 * This script automatically finds all elements with the data-reddit-thread attribute
 * and renders a Reddit thread inside them.
 * 
 * Usage:
 * <div 
 *   data-reddit-thread="https://www.reddit.com/r/subreddit/comments/id/title/"
 *   data-reddit-max-depth="5"
 *   data-reddit-show-content="true"
 *   data-reddit-show-controls="true"
 * ></div>
 */

// Function to initialize Reddit threads on the page
function initRedditThreads() {
  // Find all elements with the data-reddit-thread attribute
  const threadElements = document.querySelectorAll('[data-reddit-thread]');
  
  // If no elements found, exit
  if (threadElements.length === 0) {
    return;
  }
  
  // Process each element
  threadElements.forEach((element) => {
    // Get the URL from the data attribute
    const url = element.getAttribute('data-reddit-thread');
    
    if (!url) {
      console.error('Reddit Thread Viewer: Missing URL in data-reddit-thread attribute');
      return;
    }
    
    // Get optional configuration from data attributes
    const maxDepth = parseInt(element.getAttribute('data-reddit-max-depth') || '5', 10);
    const showContent = element.getAttribute('data-reddit-show-content') !== 'false';
    const showControls = element.getAttribute('data-reddit-show-controls') !== 'false';
    
    try {
      // Create a React root for this element
      const root = createRoot(element as HTMLElement);
      
      // Render the Reddit thread component
      root.render(
        React.createElement(RedditThread, {
          url,
          maxCommentDepth: maxDepth,
          showPostContent: showContent,
          showCommentControls: showControls,
          onError: (error) => {
            console.error('Error loading Reddit thread:', error);
            root.render(
              React.createElement('div', { className: 'reddit-thread-error' },
                `Error loading Reddit thread: ${error.message}`
              )
            );
          }
        })
      );
    } catch (error) {
      console.error('Error rendering Reddit thread:', error);
      element.innerHTML = `<div class="reddit-thread-error">Error rendering Reddit thread: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
    }
  });
}

// Run the initialization when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRedditThreads);
} else {
  // DOM already loaded, run immediately
  initRedditThreads();
}

// Export the init function for manual initialization
export { initRedditThreads };
