/**
 * Main entry point for the vanilla JS version of the Reddit Thread Viewer
 */

import { createRedditThread, searchAndRenderThread } from './reddit-thread';
import { initRedditThreads } from './auto-embed';
import { fetchRedditThread, parseRedditHtml, searchSubredditForUrl } from '../lib/reddit-service';
import { formatRedditDate, formatScore, getRedditJson } from '../lib/utils';

// Export all the necessary functions
export {
  createRedditThread,
  searchAndRenderThread,
  initRedditThreads,
  fetchRedditThread,
  searchSubredditForUrl,
  parseRedditHtml,
  formatRedditDate,
  formatScore,
  getRedditJson
};
