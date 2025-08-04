import { createRedditThread } from '../src/index';
import '../src/styles/vanilla.css';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const threadContainer = document.getElementById('thread-container');
  const threadUrlInput = document.getElementById('thread-url');
  const loadButton = document.getElementById('load-button');
  
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
    
    // Render the Reddit thread using vanilla JS
    try {
      createRedditThread({ 
        url: url,
        maxCommentDepth: 5,
        showPostContent: false,
        showCommentControls: true,
        onError: (error) => {
          console.error('Error loading thread:', error);
          threadContainer.className = 'redditify reddit-thread-error';
          threadContainer.innerHTML = `
            <div class="error">
              Error loading thread: ${error.message}
            </div>
          `;
        }
      }, threadContainer);
    } catch (error) {
      console.error('Error rendering thread:', error);
      threadContainer.className = 'redditify reddit-thread-error';
      threadContainer.innerHTML = `
        <div class="error">
          Error rendering thread: ${error.message}
        </div>
      `;
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
