import './styles/globals.css';

// Export main component
export { default as RedditThread } from './components/reddit/RedditThread';

// Export types
export type { 
  RedditThreadViewerProps,
  RedditPost,
  RedditComment,
  RedditThreadResponse,
  RedditCommentsResponse
} from './lib/types';

// Export utilities
export { 
  formatRedditDate,
  formatScore,
  getRedditJson
} from './lib/utils';

// Export service functions
export {
  fetchRedditThread,
  parseRedditHtml
} from './lib/reddit-service';
