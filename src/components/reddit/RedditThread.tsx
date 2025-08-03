import React, { useEffect, useState } from 'react';
import { fetchRedditThread } from '../../lib/reddit-service';
import { RedditThreadViewerProps, RedditPost, RedditComment } from '../../lib/types';
import { cn } from '../../lib/utils';
import RedditPostHeader from './RedditPostHeader';
import RedditPostContent from './RedditPostContent';
import RedditCommentList from './RedditCommentList';

export default function RedditThread({
  url,
  className,
  maxCommentDepth = 5,
  showPostContent = true,
  showCommentControls = true,
  onError,
}: RedditThreadViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [post, setPost] = useState<RedditPost | null>(null);
  const [comments, setComments] = useState<RedditComment[]>([]);

  useEffect(() => {
    const loadThread = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [threadData, commentsData] = await fetchRedditThread(url);
        
        if (threadData.data.children.length > 0) {
          setPost(threadData.data.children[0]);
        }
        
        setComments(commentsData.data.children);
        setLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error);
        setLoading(false);
        if (onError) {
          onError(error);
        }
      }
    };

    loadThread();
  }, [url, onError]);

  if (loading) {
    return (
      <div className={cn("reddit-thread-loading p-4 rounded-md bg-white dark:bg-reddit-darkGray border border-gray-200 dark:border-gray-800", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("reddit-thread-error p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800", className)}>
        <h3 className="text-red-600 dark:text-red-400 font-medium">Error loading Reddit thread</h3>
        <p className="text-red-500 dark:text-red-300 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={cn("reddit-thread-empty p-4 rounded-md bg-white dark:bg-reddit-darkGray border border-gray-200 dark:border-gray-800", className)}>
        <p className="text-gray-500 dark:text-gray-400">No thread data available</p>
      </div>
    );
  }

  return (
    <div className={cn("reddit-thread rounded-md overflow-hidden bg-white dark:bg-reddit-darkGray border border-gray-200 dark:border-gray-800", className)}>
      <RedditPostHeader post={post} />
      
      {showPostContent && (
        <RedditPostContent post={post} />
      )}
      
      <div className="reddit-comments p-2 md:p-4 bg-white dark:bg-reddit-darkGray">
        <RedditCommentList 
          comments={comments} 
          maxDepth={maxCommentDepth} 
          showControls={showCommentControls} 
        />
      </div>
    </div>
  );
}
