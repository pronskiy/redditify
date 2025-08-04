/**
 * Auto-embedding script for Reddit Thread Viewer (Vanilla JS version)
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

import { createRedditThread } from './reddit-thread';
import '../styles/vanilla.css';

// Function to inject CSS styles
function injectStyles() {
  // Create a style element
  const styleElement = document.createElement('style');
  styleElement.id = 'redditify-styles';
  
  // Add the styles
  styleElement.textContent = `
    /* Base Reddit embed styles */
    .reddit-thread {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      border-radius: 0.375rem;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      background-color: white;
      color: #1a1a1b;
    }
    
    .reddit-thread-error {
      padding: 1rem;
      color: #ef4444;
      background-color: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 0.375rem;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .reddit-thread {
        background-color: #1a1a1b;
        color: #d7dadc;
        border-color: #343536;
      }
      
      .reddit-thread-error {
        background-color: rgba(239, 68, 68, 0.1);
        color: #f87171;
        border-color: rgba(239, 68, 68, 0.2);
      }
    }
    
    /* Comment styling */
    .comment-body a {
      color: #0079d3;
      text-decoration: underline;
    }
    
    .comment-body pre,
    .comment-body code {
      background-color: #f6f7f8;
      border-radius: 0.25rem;
      padding: 0 0.25rem;
    }
    
    .comment-body pre {
      padding: 0.75rem;
      margin: 0.5rem 0;
      overflow-x: auto;
    }
    
    /* Dark mode for comment styling */
    @media (prefers-color-scheme: dark) {
      .comment-body a {
        color: #4da3ff;
      }
      
      .comment-body pre,
      .comment-body code {
        background-color: #272729;
      }
    }

    /* Loading animation */
    .loading-pulse {
      padding: 1rem;
    }
    
    .loading-line, .loading-block {
      background-color: #e5e7eb;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
    }
    
    .loading-line {
      height: 1rem;
    }
    
    .loading-line:nth-child(1) {
      width: 75%;
    }
    
    .loading-line:nth-child(2) {
      width: 50%;
    }
    
    .loading-block {
      height: 8rem;
    }
    
    @media (prefers-color-scheme: dark) {
      .loading-line, .loading-block {
        background-color: #343536;
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    .loading-pulse > * {
      animation: pulse 1.5s ease-in-out infinite;
    }
  `;
  
  // Add the style element to the head
  document.head.appendChild(styleElement);
}

// Function to initialize Reddit threads on the page
function initRedditThreads() {
  // Inject styles if they don't exist yet
  if (!document.getElementById('redditify-styles')) {
    injectStyles();
  }
  
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
      // Create the Reddit thread
      createRedditThread({
        url,
        maxCommentDepth: maxDepth,
        showPostContent: showContent,
        showCommentControls: showControls,
        onError: (error) => {
          console.error('Error loading Reddit thread:', error);
          element.className = 'reddit-thread-error';
          element.innerHTML = `
            <div class="reddit-thread-error">
              Error loading Reddit thread: ${error.message}
            </div>
          `;
        }
      }, element);
    } catch (error) {
      console.error('Error rendering Reddit thread:', error);
      element.innerHTML = `
        <div class="reddit-thread-error">
          Error rendering Reddit thread: ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
      `;
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
