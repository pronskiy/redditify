/**
 * Main entry point for the vanilla JS version of the Reddit Thread Viewer
 */

import { createRedditThread } from './reddit-thread';
import { initRedditThreads } from './auto-embed';
import { fetchRedditThread, parseRedditHtml } from '../lib/reddit-service';
import { formatRedditDate, formatScore, getRedditJson } from '../lib/utils';

// Export all the necessary functions
export {
  createRedditThread,
  initRedditThreads,
  fetchRedditThread,
  parseRedditHtml,
  formatRedditDate,
  formatScore,
  getRedditJson
};
