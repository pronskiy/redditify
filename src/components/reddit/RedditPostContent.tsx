import React from 'react';
import { RedditPost } from '../../lib/types';
import { parseRedditHtml } from '../../lib/reddit-service';

interface RedditPostContentProps {
  post: RedditPost;
}

export default function RedditPostContent({ post }: RedditPostContentProps) {
  const { data } = post;
  
  // If it's not a self post and has a thumbnail, show the thumbnail
  const hasExternalLink = !data.is_self && data.url;
  const hasThumbnail = data.thumbnail && data.thumbnail !== 'self' && data.thumbnail !== 'default';
  
  // Parse the HTML content
  const contentHtml = data.selftext_html ? parseRedditHtml(data.selftext_html) : '';
  
  return (
    <div className="reddit-post-content p-3 border-b border-gray-200 dark:border-gray-800">
      {/* External link */}
      {hasExternalLink && (
        <div className="mb-3">
          <a 
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-reddit-blue hover:underline text-sm break-all"
          >
            {data.url}
          </a>
        </div>
      )}
      
      {/* Thumbnail */}
      {hasThumbnail && (
        <div className="mb-3">
          <a 
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img 
              src={data.thumbnail} 
              alt="Post thumbnail" 
              className="max-w-full rounded-md"
              style={{ maxHeight: '500px' }}
            />
          </a>
        </div>
      )}
      
      {/* Text content */}
      {contentHtml ? (
        <div 
          className="reddit-post-text prose dark:prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      ) : data.selftext ? (
        <div className="reddit-post-text whitespace-pre-wrap text-sm">
          {data.selftext}
        </div>
      ) : null}
    </div>
  );
}
