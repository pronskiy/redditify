import { RedditThread } from '../src/index';
import React from 'react';
import { createRoot } from 'react-dom/client';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const threadContainer = document.getElementById('thread-container');
  const threadUrlInput = document.getElementById('thread-url');
  const loadButton = document.getElementById('load-button');
  
  // Create React root
  const root = createRoot(threadContainer);
  
  // Function to load and render thread
  const loadThread = () => {
    const url = threadUrlInput.value.trim();
    
    if (!url) {
      alert('Please enter a Reddit thread URL');
      return;
    }
    
    // Remove .json extension if present for display
    const displayUrl = url.endsWith('.json') 
      ? url.substring(0, url.length - 5) 
      : url;
    
    // Render loading state
    root.render(
      React.createElement('div', { className: 'loading' }, 
        'Loading thread...'
      )
    );
    
    // Render the Reddit thread component
    try {
      root.render(
        React.createElement(RedditThread, { 
          url: url,
          maxCommentDepth: 5,
          showPostContent: false,
          showCommentControls: true,
          onError: (error) => {
            console.error('Error loading thread:', error);
            root.render(
              React.createElement('div', { className: 'error' }, 
                `Error loading thread: ${error.message}`
              )
            );
          }
        })
      );
    } catch (error) {
      console.error('Error rendering thread:', error);
      root.render(
        React.createElement('div', { className: 'error' }, 
          `Error rendering thread: ${error.message}`
        )
      );
    }
  };
  
  // Add event listeners
  loadButton.addEventListener('click', loadThread);
  threadUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadThread();
    }
  });
  
  // Load the default thread on page load
  loadThread();
});
