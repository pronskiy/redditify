import React from 'react';
import { RedditPost } from '../../lib/types';
import { formatRedditDate, formatScore } from '../../lib/utils';
import { ArrowUpIcon, ArrowDownIcon, MessageSquareIcon } from 'lucide-react';

interface RedditPostHeaderProps {
  post: RedditPost;
}

export default function RedditPostHeader({ post }: RedditPostHeaderProps) {
  const { data } = post;
  
  return (
    <div className="reddit-post-header p-3 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
        <a 
          href={`https://www.reddit.com/${data.subreddit_name_prefixed}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-reddit-blue hover:underline mr-2"
        >
          {data.subreddit_name_prefixed}
        </a>
        <span className="mx-1">•</span>
        <span>Posted by </span>
        <a 
          href={`https://www.reddit.com/user/${data.author}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline mx-1"
        >
          u/{data.author}
        </a>
        <span className="mx-1">•</span>
        <span>{formatRedditDate(data.created_utc)}</span>
        
        {data.link_flair_text && (
          <>
            <span className="mx-1">•</span>
            <span 
              className="px-1.5 py-0.5 text-xs rounded-full"
              style={{ 
                backgroundColor: data.link_flair_background_color || '#edeff1',
                color: data.link_flair_background_color ? '#ffffff' : '#1a1a1b'
              }}
            >
              {data.link_flair_text}
            </span>
          </>
        )}
      </div>
      
      <h1 className="text-lg md:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
        {data.title}
      </h1>
      
      <div className="flex items-center text-sm">
        <div className="flex items-center mr-4">
          <ArrowUpIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
          <span className="font-medium">{formatScore(data.score)}</span>
          <ArrowDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 ml-1" />
        </div>
        
        <div className="flex items-center">
          <MessageSquareIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
          <span>{data.num_comments} comments</span>
          <span className="mx-2">•</span>
          <a 
            href={`https://www.reddit.com${data.permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline cursor-pointer"
          >
            Reply
          </a>
        </div>
      </div>
    </div>
  );
}
