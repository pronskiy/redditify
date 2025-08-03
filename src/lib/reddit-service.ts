import { getRedditJson } from './utils';
import { RedditThreadResponse, RedditCommentsResponse } from './types';

export async function fetchRedditThread(url: string): Promise<[RedditThreadResponse, RedditCommentsResponse]> {
  try {
    const jsonUrl = getRedditJson(url);
    const response = await fetch(jsonUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Reddit thread: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid Reddit thread data format');
    }
    
    const [threadData, commentsData] = data;
    
    return [threadData as RedditThreadResponse, commentsData as RedditCommentsResponse];
  } catch (error) {
    console.error('Error fetching Reddit thread:', error);
    throw error;
  }
}

export function parseRedditHtml(html: string): string {
  if (!html) return '';
  
  // Decode HTML entities
  const decoded = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Remove unnecessary divs and spans
  return decoded
    .replace(/<div class="md">(.*?)<\/div>/g, '$1')
    .replace(/<p>(.*?)<\/p>/g, '<p>$1</p>\n')
    .replace(/<a href="(.*?)".*?>(.*?)<\/a>/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>');
}
