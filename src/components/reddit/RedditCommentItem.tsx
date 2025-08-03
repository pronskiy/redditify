import React, { useState } from 'react';
import { RedditComment } from '../../lib/types';
import { formatRedditDate, formatScore, cn } from '../../lib/utils';
import { parseRedditHtml } from '../../lib/reddit-service';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import RedditCommentList from './RedditCommentList';

interface RedditCommentItemProps {
  comment: RedditComment;
  maxDepth?: number;
  showControls?: boolean;
  currentDepth?: number;
}

export default function RedditCommentItem({ 
  comment, 
  maxDepth = 5, 
  showControls = true,
  currentDepth = 0 
}: RedditCommentItemProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { data } = comment;
  
  // Parse the HTML content
  const contentHtml = data.body_html ? parseRedditHtml(data.body_html) : '';
  
  // Check if we have replies and if we're not at max depth
  const hasReplies = data.replies && 
                    data.replies.data && 
                    data.replies.data.children && 
                    data.replies.data.children.length > 0;
  
  const showReplies = hasReplies && currentDepth < maxDepth && !collapsed;
  
  // Determine if the comment is from the original poster
  const isOP = data.is_submitter;
  
  // Determine if the comment is distinguished (mod, admin)
  const isMod = data.distinguished === 'moderator';
  const isAdmin = data.distinguished === 'admin';
  
  // Handle collapsing/expanding
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <div 
      id={`comment-${data.id}`}
      className={cn(
        "reddit-comment rounded-md overflow-hidden",
        currentDepth > 0 && "border-l-2 pl-3 ml-2",
        currentDepth === 1 && "border-l-blue-500",
        currentDepth === 2 && "border-l-green-500",
        currentDepth === 3 && "border-l-yellow-500",
        currentDepth === 4 && "border-l-purple-500",
        currentDepth >= 5 && "border-l-gray-500"
      )}>
      <div className="comment-header flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
        {/* Collapse/Expand button */}
        {showControls && (
          <button 
            onClick={toggleCollapsed}
            className="mr-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            aria-label={collapsed ? "Expand comment" : "Collapse comment"}
          >
            {collapsed ? (
              <ChevronDownIcon className="h-3 w-3" />
            ) : (
              <ChevronUpIcon className="h-3 w-3" />
            )}
          </button>
        )}
        
        {/* Author */}
        <a 
          href={`https://www.reddit.com/user/${data.author}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "font-medium hover:underline mr-1",
            isOP && "text-reddit-blue",
            isMod && "text-green-600 dark:text-green-400",
            isAdmin && "text-red-600 dark:text-red-400"
          )}
        >
          {data.author}
          {isOP && " (OP)"}
          {isMod && " [M]"}
          {isAdmin && " [A]"}
        </a>
        
        {/* Score */}
        <div className="flex items-center mx-1">
          <span className="font-medium">
            {data.score_hidden ? "Score hidden" : formatScore(data.score)}
          </span>
        </div>
        
        {/* Time */}
        <span className="mx-1">•</span>
        <span>{formatRedditDate(data.created_utc)}</span>
      </div>
      
      {/* Comment content */}
      {!collapsed && (
        <div 
          className="comment-body prose dark:prose-invert max-w-none text-sm mb-2"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      )}
      
      {/* Comment actions */}
      {showControls && !collapsed && (
        <div className="comment-actions flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          <div className="flex items-center mr-3">
            <a 
              href={`https://www.reddit.com${data.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ArrowUpIcon className="h-3 w-3 mr-1 cursor-pointer" />
              <ArrowDownIcon className="h-3 w-3 cursor-pointer" />
            </a>
          </div>
          <a 
            href={`https://www.reddit.com${data.permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mr-3 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
          >
            Reply
          </a>
          <a 
            href={`#comment-${data.id}`}
            onClick={(e) => {
              e.preventDefault();
              // Get the current page URL without any hash
              const currentUrl = window.location.href.split('#')[0];
              // Create a URL with the comment ID as the anchor
              const shareUrl = `${currentUrl}#comment-${data.id}`;
              
              if (navigator.share) {
                navigator.share({
                  title: `Comment by ${data.author}`,
                  url: shareUrl
                }).catch(err => console.error('Error sharing:', err));
              } else {
                // Copy to clipboard as fallback
                navigator.clipboard.writeText(shareUrl)
                  .then(() => alert('Comment link copied to clipboard!'))
                  .catch(err => {
                    console.error('Failed to copy:', err);
                    window.open(shareUrl, '_blank');
                  });
              }
            }}
            className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer hover:underline"
          >
            Share
          </a>
        </div>
      )}
      
      {/* Replies */}
      {showReplies && (
        <div className="comment-replies mt-2">
          <RedditCommentList 
            comments={data.replies.data.children}
            maxDepth={maxDepth}
            showControls={showControls}
            currentDepth={currentDepth + 1}
          />
        </div>
      )}
    </div>
  );
}
