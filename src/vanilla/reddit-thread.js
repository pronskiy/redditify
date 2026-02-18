/**
 * Vanilla JS implementation of the Reddit Thread Viewer
 * This replaces the React-based implementation
 */

import { fetchRedditThread, parseRedditHtml, searchSubredditForUrl } from '../lib/reddit-service';
import { formatRedditDate, formatScore } from '../lib/utils';

/**
 * Creates a Reddit thread viewer
 * @param {Object} options - Configuration options
 * @param {string} options.url - Reddit thread URL
 * @param {number} options.maxCommentDepth - Maximum depth of comments to display
 * @param {boolean} options.showPostContent - Whether to show the post content
 * @param {boolean} options.showCommentControls - Whether to show comment controls
 * @param {boolean} options.showAttribution - Whether to show the attribution link at the bottom
 * @param {Function} options.onError - Error callback function
 * @param {HTMLElement} container - Container element to render the thread in
 */
export async function createRedditThread(options, container) {
  const {
    url,
    maxCommentDepth = 5,
    showPostContent = true,
    showCommentControls = true,
    showAttribution = true, // Default to true
    onError
  } = options;

  // Create loading state
  renderLoadingState(container);

  try {
    // Fetch thread data
    const [threadData, commentsData] = await fetchRedditThread(url);
    
    // Check if we have post data
    if (threadData.data.children.length === 0) {
      renderEmptyState(container);
      return;
    }

    const post = threadData.data.children[0];
    const comments = commentsData.data.children;

    // Render the thread
    renderThread(post, comments, {
      maxCommentDepth,
      showPostContent,
      showCommentControls,
      showAttribution
    }, container);
  } catch (error) {
    console.error('Error loading Reddit thread:', error);
    renderErrorState(container, error);
    if (onError) {
      onError(error);
    }
  }
}

/**
 * Renders a loading state
 * @param {HTMLElement} container - Container element
 */
function renderLoadingState(container) {
  container.className = 'redditify reddit-thread-loading';
  container.innerHTML = `
    <div class="reddit-thread-loading-content">
      <div class="loading-pulse">
        <div class="loading-line"></div>
        <div class="loading-line"></div>
        <div class="loading-block"></div>
        <div class="loading-line"></div>
        <div class="loading-line"></div>
      </div>
    </div>
  `;
}

/**
 * Renders an error state
 * @param {HTMLElement} container - Container element
 * @param {Error} error - Error object
 */
function renderErrorState(container, error) {
  container.className = 'redditify reddit-thread-error';
  container.innerHTML = `
    <h3>Error loading Reddit thread</h3>
    <p>${error.message}</p>
  `;
}

/**
 * Renders an empty state
 * @param {HTMLElement} container - Container element
 */
function renderEmptyState(container) {
  container.className = 'redditify reddit-thread-empty';
  container.innerHTML = `
    <p>No thread data available</p>
  `;
}

/**
 * Renders a Reddit thread
 * @param {Object} post - Post data
 * @param {Array} comments - Comments data
 * @param {Object} options - Configuration options
 * @param {HTMLElement} container - Container element
 */
function renderThread(post, comments, options, container) {
  const { maxCommentDepth, showPostContent, showCommentControls, showAttribution } = options;
  
  // Set container class
  container.className = 'redditify reddit-thread';
  
  // Create post header
  const postHeader = createPostHeader(post);
  
  // Create post content if needed
  let postContent = '';
  if (showPostContent) {
    postContent = createPostContent(post);
  }
  
  // Create comments if needed
  let commentsSection = '';
  if (maxCommentDepth > 0) {
    commentsSection = `
      <div class="reddit-comments">
        ${createCommentList(comments, maxCommentDepth, showCommentControls)}
      </div>
    `;
  }
  
  // Create attribution link if needed
  let attributionSection = '';
  if (showAttribution) {
    attributionSection = `
      <div class="reddit-attribution">
        Rendered with <a href="https://github.com/pronskiy/redditify" target="_blank" rel="noopener noreferrer">redditify</a>
      </div>
    `;
  }
  
  // Set the HTML
  container.innerHTML = `
    ${postHeader}
    ${postContent}
    ${commentsSection}
    ${attributionSection}
  `;
  
  // Add event listeners for comment collapsing
  setupCommentCollapsing(container);
}

/**
 * Sets up event listeners for comment collapsing
 * @param {HTMLElement} container - Container element
 */
function setupCommentCollapsing(container) {
  // Find all collapse buttons
  const collapseButtons = container.querySelectorAll('.reddit-comment-collapse-button');
  
  // Add click event listeners to each button
  collapseButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Find the parent comment element
      const commentElement = this.closest('.reddit-comment');
      
      if (commentElement) {
        // Toggle collapsed state
        if (commentElement.classList.contains('collapsed')) {
          // Expand
          commentElement.classList.remove('collapsed');
          this.textContent = '[−]';
          this.setAttribute('data-action', 'collapse');
        } else {
          // Collapse
          commentElement.classList.add('collapsed');
          this.textContent = '[+]';
          this.setAttribute('data-action', 'expand');
        }
      }
    });
  });
}

/**
 * Creates a post header
 * @param {Object} post - Post data
 * @returns {string} HTML string
 */
function createPostHeader(post) {
  const { data } = post;
  const formattedDate = formatRedditDate(data.created_utc);
  const formattedScore = formatScore(data.score);
  
  return `
    <div class="reddit-post-header">
      <div class="reddit-post-subreddit">
        <a href="https://www.reddit.com/r/${data.subreddit}" target="_blank" rel="noopener noreferrer">
          r/${data.subreddit}
        </a>
      </div>
      <h2 class="reddit-post-title">
        <a href="https://www.reddit.com${data.permalink}" target="_blank" rel="noopener noreferrer">
          ${data.title}
        </a>
      </h2>
      <div class="reddit-post-meta">
        <span class="reddit-post-author">
          Posted by 
          <a href="https://www.reddit.com/user/${data.author}" target="_blank" rel="noopener noreferrer">
            u/${data.author}
          </a>
        </span>
        <span class="reddit-post-date">${formattedDate}</span>
        <span class="reddit-post-score">${formattedScore} points</span>
        <span class="reddit-post-comments">${data.num_comments} comments</span>
      </div>
    </div>
  `;
}

/**
 * Creates post content
 * @param {Object} post - Post data
 * @returns {string} HTML string
 */
function createPostContent(post) {
  const { data } = post;
  
  // Check if it's an external link with thumbnail
  const hasExternalLink = !data.is_self && data.url;
  const hasThumbnail = data.thumbnail && data.thumbnail !== 'self' && data.thumbnail !== 'default';
  
  // Parse the HTML content
  const contentHtml = data.selftext_html ? parseRedditHtml(data.selftext_html) : '';
  
  let externalLinkHtml = '';
  if (hasExternalLink) {
    externalLinkHtml = `
      <div class="reddit-post-external-link">
        <a href="${data.url}" target="_blank" rel="noopener noreferrer">
          ${data.url}
        </a>
      </div>
    `;
  }
  
  let thumbnailHtml = '';
  if (hasThumbnail) {
    thumbnailHtml = `
      <div class="reddit-post-thumbnail">
        <a href="${data.url}" target="_blank" rel="noopener noreferrer">
          <img src="${data.thumbnail}" alt="Post thumbnail" style="max-height: 500px;">
        </a>
      </div>
    `;
  }
  
  let textContentHtml = '';
  if (contentHtml) {
    textContentHtml = `
      <div class="reddit-post-text">
        ${contentHtml}
      </div>
    `;
  } else if (data.selftext) {
    textContentHtml = `
      <div class="reddit-post-text">
        ${data.selftext}
      </div>
    `;
  }
  
  return `
    <div class="reddit-post-content">
      ${externalLinkHtml}
      ${thumbnailHtml}
      ${textContentHtml}
    </div>
  `;
}

/**
 * Creates a comment list
 * @param {Array} comments - Comments data
 * @param {number} maxDepth - Maximum depth of comments to display
 * @param {boolean} showControls - Whether to show comment controls
 * @param {number} currentDepth - Current depth level
 * @returns {string} HTML string
 */
function createCommentList(comments, maxDepth, showControls, currentDepth = 1) {
  if (!comments || comments.length === 0 || currentDepth > maxDepth) {
    return '';
  }
  
  return `
    <ul class="reddit-comment-list depth-${currentDepth}">
      ${comments.map(comment => createCommentItem(comment, maxDepth, showControls, currentDepth)).join('')}
    </ul>
  `;
}

/**
 * Creates a comment item
 * @param {Object} comment - Comment data
 * @param {number} maxDepth - Maximum depth of comments to display
 * @param {boolean} showControls - Whether to show comment controls
 * @param {number} currentDepth - Current depth level
 * @returns {string} HTML string
 */
function createCommentItem(comment, maxDepth, showControls, currentDepth) {
  // Skip if it's a "more comments" item or deleted
  if (comment.kind === 'more' || !comment.data || comment.data.body === '[deleted]') {
    return '';
  }
  
  const { data } = comment;
  const formattedDate = formatRedditDate(data.created_utc);
  const formattedScore = formatScore(data.score);
  const contentHtml = data.body_html ? parseRedditHtml(data.body_html) : '';
  
  // Create child comments if any
  let childComments = '';
  let hasReplies = false;
  if (data.replies && data.replies.data && data.replies.data.children.length > 0 && currentDepth < maxDepth) {
    childComments = createCommentList(
      data.replies.data.children,
      maxDepth,
      showControls,
      currentDepth + 1
    );
    hasReplies = true;
  }
  
  // Create controls if needed
  let controlsHtml = '';
  if (showControls) {
    controlsHtml = `
      <div class="reddit-comment-controls">
        <a href="https://www.reddit.com${data.permalink}" target="_blank" rel="noopener noreferrer">
          Permalink
        </a>
      </div>
    `;
  }
  
  // Create collapse button if there are replies or content
  const collapseButton = `
    <span class="reddit-comment-collapse-button" data-action="collapse">[−]</span>
  `;
  
  return `
    <li class="reddit-comment" id="comment-${data.id}">
      <div class="reddit-comment-content">
        <div class="reddit-comment-header">
          ${collapseButton}
          <a href="https://www.reddit.com/user/${data.author}" target="_blank" rel="noopener noreferrer" class="reddit-comment-author">
            ${data.author}
          </a>
          <span class="reddit-comment-score">${formattedScore} points</span>
          <span class="reddit-comment-date">${formattedDate}</span>
        </div>
        <div class="reddit-comment-body comment-body">
          ${contentHtml}
        </div>
        ${controlsHtml}
      </div>
      ${childComments}
    </li>
  `;
}

/**
 * Renders a "not found" prompt with a link to submit on Reddit
 * @param {Object} options - Configuration options
 * @param {string} options.subreddit - Subreddit name
 * @param {string} options.url - URL that was searched for
 * @param {string} options.suggestTitle - Suggested title for Reddit submit
 * @param {boolean} options.showAttribution - Whether to show the attribution link
 * @param {HTMLElement} container - Container element
 */
function renderSearchNotFound(options, container) {
  const { subreddit, url, suggestTitle, showAttribution } = options;
  const submitUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(suggestTitle)}`;

  let attributionSection = '';
  if (showAttribution) {
    attributionSection = `
      <div class="reddit-attribution">
        Rendered with <a href="https://github.com/pronskiy/redditify" target="_blank" rel="noopener noreferrer">redditify</a>
      </div>
    `;
  }

  container.className = 'redditify reddit-search-prompt';
  container.innerHTML = `
    <div class="reddit-search-prompt-content">
      <div class="reddit-search-prompt-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
          <path d="M12 14C12.55 14 13 13.55 13 13C13 12.45 12.55 12 12 12C11.45 12 11 12.45 11 13C11 13.55 11.45 14 12 14Z" fill="currentColor"/>
          <path d="M13 6H11V11H13V6Z" fill="currentColor"/>
        </svg>
      </div>
      <div class="reddit-search-prompt-text">
        <div class="reddit-search-prompt-heading">No discussion found on r/${subreddit}</div>
        <div class="reddit-search-prompt-subtext">Be the first to share this on Reddit</div>
      </div>
      <a href="${submitUrl}" target="_blank" rel="noopener noreferrer" class="reddit-search-prompt-button">
        Discuss on Reddit
      </a>
    </div>
    ${attributionSection}
  `;
}

/**
 * Searches for a URL in a subreddit and renders the thread or a prompt
 * @param {Object} options - Configuration options
 * @param {string} options.subreddit - Subreddit name
 * @param {string} options.url - URL to search for
 * @param {string} options.suggestTitle - Suggested title for Reddit submit
 * @param {number} options.maxCommentDepth - Maximum depth of comments to display
 * @param {boolean} options.showPostContent - Whether to show the post content
 * @param {boolean} options.showCommentControls - Whether to show comment controls
 * @param {boolean} options.showAttribution - Whether to show the attribution link
 * @param {Function} options.onError - Error callback function
 * @param {HTMLElement} container - Container element
 */
export async function searchAndRenderThread(options, container) {
  const {
    subreddit,
    url,
    suggestTitle = '',
    maxCommentDepth = 5,
    showPostContent = true,
    showCommentControls = true,
    showAttribution = true,
    onError
  } = options;

  // Show loading state
  renderLoadingState(container);

  try {
    const post = await searchSubredditForUrl(subreddit, url);

    if (post) {
      // Found a thread - fetch full thread with comments
      const threadUrl = `https://www.reddit.com${post.data.permalink}`;
      const [threadData, commentsData] = await fetchRedditThread(threadUrl);

      if (threadData.data.children.length === 0) {
        renderSearchNotFound({ subreddit, url, suggestTitle, showAttribution }, container);
        return;
      }

      const fullPost = threadData.data.children[0];
      const comments = commentsData.data.children;

      renderThread(fullPost, comments, {
        maxCommentDepth,
        showPostContent,
        showCommentControls,
        showAttribution
      }, container);
    } else {
      // No thread found - show prompt
      renderSearchNotFound({ subreddit, url, suggestTitle, showAttribution }, container);
    }
  } catch (error) {
    console.error('Error searching for Reddit thread:', error);
    renderErrorState(container, error);
    if (onError) {
      onError(error);
    }
  }
}
